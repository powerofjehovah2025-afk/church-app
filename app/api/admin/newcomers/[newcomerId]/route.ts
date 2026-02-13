import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * DELETE: Delete a newcomer record (admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ newcomerId: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify user is admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    const role = profile && "role" in profile ? (profile as { role: string | null }).role : null;
    if (role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden. Admin access required." },
        { status: 403 }
      );
    }

    const { newcomerId } = await params;
    const admin = createAdminClient();

    // Delete the newcomer record
    const { error } = await admin
      .from("newcomers")
      .delete()
      .eq("id", newcomerId);

    if (error) {
      console.error("Error deleting newcomer:", error);
      return NextResponse.json(
        { error: error.message || "Failed to delete newcomer" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Newcomer deleted successfully",
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}

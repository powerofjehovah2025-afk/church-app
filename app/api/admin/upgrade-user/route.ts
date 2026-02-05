import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * API endpoint for admins to upgrade any user to admin role
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized. Please log in first." },
        { status: 401 }
      );
    }

    // Verify current user is admin
    const { data: currentUserProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (currentUserProfile?.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden. Admin access required." },
        { status: 403 }
      );
    }

    // Get user ID from request body
    const body = await request.json().catch(() => ({}));
    const targetUserId = body?.userId;

    if (!targetUserId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Use admin client to update the role (bypasses RLS)
    const admin = createAdminClient();
    const { error: updateError } = await admin
      .from("profiles")
      .update({ role: "admin" })
      .eq("id", targetUserId);

    if (updateError) {
      console.error("Error updating role:", updateError);
      return NextResponse.json(
        { error: updateError.message || "Failed to upgrade user" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "User upgraded to admin successfully!",
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}



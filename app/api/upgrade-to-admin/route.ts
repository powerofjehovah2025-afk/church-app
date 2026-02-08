import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * API endpoint to upgrade the currently authenticated user to admin role.
 * This is a one-time upgrade endpoint for development/testing purposes.
 */
export async function POST() {
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

    // Use admin client to update the role (bypasses RLS)
    const admin = createAdminClient();
    const { error: updateError } = await admin
      .from("profiles")
      .update({ role: "admin" })
      .eq("id", user.id);

    if (updateError) {
      console.error("Error updating role:", updateError);
      return NextResponse.json(
        { error: updateError.message || "Failed to upgrade account" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Account upgraded to admin successfully!",
      role: "admin",
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




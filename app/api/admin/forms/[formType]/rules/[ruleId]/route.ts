import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * DELETE: Delete a submission rule (admin only)
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ formType: string; ruleId: string }> }
) {
  try {
    const { formType, ruleId } = await params;
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

    if (profile?.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden. Admin access required." },
        { status: 403 }
      );
    }

    const admin = createAdminClient();

    // Verify rule belongs to this form type
    const { data: rule } = await admin
      .from("form_submission_rules")
      .select("form_config_id, form_configs!inner(form_type)")
      .eq("id", ruleId)
      .single();

    const { error } = await admin
      .from("form_submission_rules")
      .delete()
      .eq("id", ruleId);

    if (error) {
      console.error("Error deleting rule:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: "Rule deleted successfully" });
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


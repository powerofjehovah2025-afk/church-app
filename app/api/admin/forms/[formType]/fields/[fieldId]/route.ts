import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * DELETE: Delete a form field (admin only)
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ formType: string; fieldId: string }> }
) {
  try {
    const { formType, fieldId } = await params;
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
    
    // Verify the field belongs to the form
    const { data: formConfig } = await admin
      .from("form_configs")
      .select("id")
      .eq("form_type", formType)
      .single();

    if (!formConfig) {
      return NextResponse.json(
        { error: "Form config not found" },
        { status: 404 }
      );
    }

    const { data: field } = await admin
      .from("form_fields")
      .select("id, form_config_id")
      .eq("id", fieldId)
      .single();

    if (!field || field.form_config_id !== formConfig.id) {
      return NextResponse.json(
        { error: "Field not found or does not belong to this form" },
        { status: 404 }
      );
    }

    // Delete the field
    const { error } = await admin
      .from("form_fields")
      .delete()
      .eq("id", fieldId);

    if (error) {
      console.error("Error deleting form field:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Field deleted successfully",
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


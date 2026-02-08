import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET: Get specific version with fields and static content (admin only)
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ formType: string; versionId: string }> }
) {
  try {
    const { formType, versionId } = await params;
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

    // Check if user is admin
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
    
    // Get specific version
    const { data: formConfig, error: configError } = await admin
      .from("form_configs")
      .select("*")
      .eq("id", versionId)
      .eq("form_type", formType)
      .single();

    if (configError || !formConfig) {
      console.error("Error fetching form config:", configError);
      return NextResponse.json(
        { error: configError?.message || "Form version not found" },
        { status: 404 }
      );
    }

    // Get form fields
    const { data: formFields, error: fieldsError } = await admin
      .from("form_fields")
      .select("*")
      .eq("form_config_id", formConfig.id)
      .order("display_order", { ascending: true });

    if (fieldsError) {
      console.error("Error fetching form fields:", fieldsError);
      return NextResponse.json(
        { error: fieldsError.message },
        { status: 500 }
      );
    }

    // Get static content
    const { data: staticContent, error: contentError } = await admin
      .from("form_static_content")
      .select("*")
      .eq("form_config_id", formConfig.id);

    if (contentError) {
      console.error("Error fetching static content:", contentError);
      return NextResponse.json(
        { error: contentError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      formConfig,
      formFields: formFields || [],
      staticContent: staticContent || [],
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


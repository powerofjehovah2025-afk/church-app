import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { FormConfigUpdate } from "@/types/database.types";

/**
 * GET: Get specific form config with fields and static content (admin only)
 * PUT: Update form config (admin only)
 * DELETE: Deactivate form config (soft delete, admin only)
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ formType: string }> }
) {
  try {
    const { formType } = await params;
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
    
    // Get all versions of this form type, ordered by version desc
    const { data: formConfigs, error: configError } = await admin
      .from("form_configs")
      .select("*")
      .eq("form_type", formType)
      .order("version", { ascending: false });

    if (configError) {
      console.error("Error fetching form configs:", configError);
      return NextResponse.json(
        { error: configError.message },
        { status: 500 }
      );
    }

    if (!formConfigs || formConfigs.length === 0) {
      return NextResponse.json(
        { error: "Form config not found" },
        { status: 404 }
      );
    }

    // Get the published version (or first one if none published)
    // Handle case where status might be null or undefined
    const publishedConfig = formConfigs.find((fc) => fc.status === "published");
    const formConfig = publishedConfig || formConfigs[0] || null;

    if (!formConfig || !formConfig.id) {
      return NextResponse.json(
        { error: "Form config not found" },
        { status: 404 }
      );
    }

    // Get form fields for the selected version
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
      allVersions: formConfigs || [],
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

/**
 * PUT: Update form config (admin only)
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ formType: string }> }
) {
  try {
    const { formType } = await params;
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

    const body = await request.json().catch(() => ({}));
    const { version_id, title, description, is_active, version_name, status } = body;

    // If version_id is provided, update that specific version
    // Otherwise, update the published version
    let targetId: string;
    if (version_id) {
      targetId = version_id;
    } else {
      const { data: publishedVersion } = await admin
        .from("form_configs")
        .select("id")
        .eq("form_type", formType)
        .eq("status", "published")
        .single();
      
      if (!publishedVersion) {
        return NextResponse.json(
          { error: "No published version found to update" },
          { status: 404 }
        );
      }
      targetId = publishedVersion.id;
    }

    const updateData: FormConfigUpdate = {};
    if (title !== undefined) {
      if (typeof title !== "string" || title.trim().length === 0) {
        return NextResponse.json(
          { error: "Title must be a non-empty string" },
          { status: 400 }
        );
      }
      updateData.title = title.trim();
    }
    if (description !== undefined) {
      updateData.description = description?.trim() || null;
    }
    if (is_active !== undefined) {
      updateData.is_active = Boolean(is_active);
    }
    if (version_name !== undefined) {
      updateData.version_name = version_name?.trim() || null;
    }
    if (status !== undefined && ["draft", "published", "archived"].includes(status)) {
      updateData.status = status;
    }

    const admin = createAdminClient();
    const { data: updatedFormConfig, error } = await admin
      .from("form_configs")
      .update(updateData)
      .eq("id", targetId)
      .select()
      .single();

    if (error) {
      console.error("Error updating form config:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      formConfig: updatedFormConfig,
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

/**
 * DELETE: Deactivate form config (soft delete, admin only)
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ formType: string }> }
) {
  try {
    const { formType } = await params;
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
    // Soft delete by setting is_active to false
    const { data: updatedFormConfig, error } = await admin
      .from("form_configs")
      .update({ is_active: false } as FormConfigUpdate)
      .eq("form_type", formType)
      .select()
      .single();

    if (error) {
      console.error("Error deactivating form config:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      formConfig: updatedFormConfig,
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


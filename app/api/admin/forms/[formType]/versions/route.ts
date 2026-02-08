import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { FormConfigInsert } from "@/types/database.types";

/**
 * GET: Get all versions of a form type (admin only)
 * POST: Create a new version (duplicate current published version as draft)
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
    
    // Get all versions
    const { data: versions, error } = await admin
      .from("form_configs")
      .select("*")
      .eq("form_type", formType)
      .order("version", { ascending: false });

    if (error) {
      console.error("Error fetching form versions:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ versions: versions || [] });
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
 * POST: Create a new version (duplicate published version as draft)
 */
export async function POST(
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
    const { version_name } = body;

    const admin = createAdminClient();
    
    // Get the published version (or latest version if none published)
    const { data: existingVersions } = await admin
      .from("form_configs")
      .select("*")
      .eq("form_type", formType)
      .order("version", { ascending: false });

    if (!existingVersions || existingVersions.length === 0) {
      return NextResponse.json(
        { error: "No existing form found to duplicate" },
        { status: 404 }
      );
    }

    const sourceVersion = existingVersions.find((v) => v.status === "published") || existingVersions[0];
    const nextVersion = Math.max(...existingVersions.map((v) => v.version || 1)) + 1;

    // Create new version config
    const { data: newConfig, error: configError } = await admin
      .from("form_configs")
      .insert({
        form_type: formType,
        title: sourceVersion.title,
        description: sourceVersion.description,
        is_active: true,
        version: nextVersion,
        status: "draft",
        version_name: version_name || `Version ${nextVersion}`,
        parent_version_id: sourceVersion.id,
      } as FormConfigInsert)
      .select()
      .single();

    if (configError) {
      console.error("Error creating new version:", configError);
      return NextResponse.json(
        { error: configError.message },
        { status: 500 }
      );
    }

    // Copy all fields from source version
    const { data: sourceFields } = await admin
      .from("form_fields")
      .select("*")
      .eq("form_config_id", sourceVersion.id);

    if (sourceFields && sourceFields.length > 0) {
      const newFields = sourceFields.map((field) => ({
        form_config_id: newConfig.id,
        field_key: field.field_key,
        field_type: field.field_type,
        label: field.label,
        placeholder: field.placeholder,
        description: field.description,
        is_required: field.is_required,
        validation_rules: field.validation_rules,
        default_value: field.default_value,
        display_order: field.display_order,
        section: field.section,
        options: field.options,
      }));

      const { error: fieldsError } = await admin
        .from("form_fields")
        .insert(newFields);

      if (fieldsError) {
        console.error("Error copying fields:", fieldsError);
        // Continue anyway - fields can be added manually
      }
    }

    // Copy static content from source version
    const { data: sourceContent } = await admin
      .from("form_static_content")
      .select("*")
      .eq("form_config_id", sourceVersion.id);

    if (sourceContent && sourceContent.length > 0) {
      const newContent = sourceContent.map((content) => ({
        form_config_id: newConfig.id,
        content_key: content.content_key,
        content: content.content,
        content_type: content.content_type,
      }));

      const { error: contentError } = await admin
        .from("form_static_content")
        .insert(newContent);

      if (contentError) {
        console.error("Error copying static content:", contentError);
        // Continue anyway
      }
    }

    return NextResponse.json({
      success: true,
      version: newConfig,
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


import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { FormFieldInsert, FormFieldUpdate } from "@/types/database.types";

/**
 * GET: Get all fields for a form (admin only)
 * POST: Create a new field (admin only)
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
    
    // Get form config first
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

    // Get form fields
    const { data: formFields, error } = await admin
      .from("form_fields")
      .select("*")
      .eq("form_config_id", formConfig.id)
      .order("display_order", { ascending: true });

    if (error) {
      console.error("Error fetching form fields:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ formFields: formFields || [] });
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
 * POST: Create or update a field (admin only)
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
    const {
      id, // If provided, update existing field
      field_key,
      field_type,
      label,
      placeholder,
      description,
      is_required,
      validation_rules,
      default_value,
      display_order,
      section,
      options,
    } = body;

    const admin = createAdminClient();
    
    // Get form config
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

    // Validate required fields
    if (!field_key || typeof field_key !== "string") {
      return NextResponse.json(
        { error: "Field key is required" },
        { status: 400 }
      );
    }

    if (!field_type || typeof field_type !== "string") {
      return NextResponse.json(
        { error: "Field type is required" },
        { status: 400 }
      );
    }

    if (!label || typeof label !== "string") {
      return NextResponse.json(
        { error: "Label is required" },
        { status: 400 }
      );
    }

    // If id is provided, update existing field
    if (id) {
      const updateData: FormFieldUpdate = {};
      if (field_type !== undefined) updateData.field_type = field_type;
      if (label !== undefined) updateData.label = label.trim();
      if (placeholder !== undefined) updateData.placeholder = placeholder?.trim() || null;
      if (description !== undefined) updateData.description = description?.trim() || null;
      if (is_required !== undefined) updateData.is_required = Boolean(is_required);
      if (validation_rules !== undefined) updateData.validation_rules = validation_rules;
      if (default_value !== undefined) updateData.default_value = default_value?.trim() || null;
      if (display_order !== undefined) updateData.display_order = Number(display_order);
      if (section !== undefined) updateData.section = section?.trim() || null;
      if (options !== undefined) updateData.options = options;

      const { data: updatedField, error } = await admin
        .from("form_fields")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("Error updating form field:", error);
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        formField: updatedField,
      });
    }

    // Create new field
    const { data: newField, error } = await admin
      .from("form_fields")
      .insert({
        form_config_id: formConfig.id,
        field_key: field_key.trim(),
        field_type: field_type.trim(),
        label: label.trim(),
        placeholder: placeholder?.trim() || null,
        description: description?.trim() || null,
        is_required: is_required !== undefined ? Boolean(is_required) : false,
        validation_rules: validation_rules || {},
        default_value: default_value?.trim() || null,
        display_order: display_order !== undefined ? Number(display_order) : 0,
        section: section?.trim() || null,
        options: options || [],
      } as FormFieldInsert)
      .select()
      .single();

    if (error) {
      console.error("Error creating form field:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      formField: newField,
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


import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ServiceTemplateUpdate } from "@/types/database.types";

/**
 * GET: Get a single service template with its duty types
 * PUT: Update a service template (admin only)
 * DELETE: Soft delete a service template (admin only)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ templateId: string }> }
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

    const { templateId } = await params;
    const isAdmin = (await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()).data?.role === "admin";

    const client = isAdmin ? createAdminClient() : supabase;

    // Get template
    const { data: template, error: templateError } = await client
      .from("service_templates")
      .select("*")
      .eq("id", templateId)
      .single();

    if (templateError || !template) {
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 }
      );
    }

    // Get duty types for this template
    const { data: dutyTypes, error: dutyTypesError } = await client
      .from("service_template_duty_types")
      .select(`
        *,
        duty_type:duty_types(*)
      `)
      .eq("template_id", templateId);

    if (dutyTypesError) {
      console.error("Error fetching template duty types:", dutyTypesError);
    }

    return NextResponse.json({
      template,
      dutyTypes: dutyTypes || [],
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
 * PUT: Update a service template (admin only)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ templateId: string }> }
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

    if (profile?.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden. Admin access required." },
        { status: 403 }
      );
    }

    const { templateId } = await params;
    const body = await request.json().catch(() => ({}));
    const { name, description, default_time, is_active } = body;

    const updateData: ServiceTemplateUpdate = {};
    if (name !== undefined) {
      if (typeof name !== "string" || name.trim().length === 0) {
        return NextResponse.json(
          { error: "Name must be a non-empty string" },
          { status: 400 }
        );
      }
      updateData.name = name.trim();
    }
    if (description !== undefined) {
      updateData.description = description?.trim() || null;
    }
    if (default_time !== undefined) {
      updateData.default_time = default_time?.trim() || null;
    }
    if (is_active !== undefined) {
      updateData.is_active = is_active;
    }

    const admin = createAdminClient();
    const { data: updatedTemplate, error } = await admin
      .from("service_templates")
      .update(updateData)
      .eq("id", templateId)
      .select()
      .single();

    if (error) {
      console.error("Error updating template:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      template: updatedTemplate,
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
 * DELETE: Soft delete a service template (admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ templateId: string }> }
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

    if (profile?.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden. Admin access required." },
        { status: 403 }
      );
    }

    const { templateId } = await params;

    const admin = createAdminClient();
    // Soft delete by setting is_active to false
    const { error } = await admin
      .from("service_templates")
      .update({ is_active: false })
      .eq("id", templateId);

    if (error) {
      console.error("Error deleting template:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Template deleted successfully",
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


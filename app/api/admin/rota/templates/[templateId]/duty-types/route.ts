import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ServiceTemplateDutyTypeInsert } from "@/types/database.types";

/**
 * GET: Get duty types for a template
 * POST: Add a duty type to a template (admin only)
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

    const { data: dutyTypes, error } = await client
      .from("service_template_duty_types")
      .select(`
        *,
        duty_type:duty_types(*)
      `)
      .eq("template_id", templateId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching template duty types:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ dutyTypes: dutyTypes || [] });
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
 * POST: Add a duty type to a template (admin only)
 */
export async function POST(
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
    const { duty_type_id, is_required } = body;

    if (!duty_type_id || typeof duty_type_id !== "string") {
      return NextResponse.json(
        { error: "Duty type ID is required" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const { data: newTemplateDutyType, error } = await admin
      .from("service_template_duty_types")
      .insert({
        template_id: templateId,
        duty_type_id: duty_type_id.trim(),
        is_required: is_required === true,
      } as ServiceTemplateDutyTypeInsert)
      .select(`
        *,
        duty_type:duty_types(*)
      `)
      .single();

    if (error) {
      console.error("Error adding duty type to template:", error);
      // Check if it's a duplicate
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "This duty type is already assigned to this template" },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      templateDutyType: newTemplateDutyType,
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
 * DELETE: Remove a duty type from a template (admin only)
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
    const { searchParams } = new URL(request.url);
    const dutyTypeId = searchParams.get("duty_type_id");

    if (!dutyTypeId) {
      return NextResponse.json(
        { error: "Duty type ID is required" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const { error } = await admin
      .from("service_template_duty_types")
      .delete()
      .eq("template_id", templateId)
      .eq("duty_type_id", dutyTypeId);

    if (error) {
      console.error("Error removing duty type from template:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Duty type removed from template successfully",
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


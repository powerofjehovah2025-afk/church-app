import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ServiceRecurringPatternUpdate } from "@/types/database.types";

/**
 * GET: Get a single recurring pattern
 * PUT: Update a recurring pattern (admin only)
 * DELETE: Soft delete a recurring pattern (admin only)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ patternId: string }> }
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

    const { patternId } = await params;
    const admin = createAdminClient();

    const { data: pattern, error } = await admin
      .from("service_recurring_patterns")
      .select(`
        *,
        template:service_templates(id, name, description, default_time)
      `)
      .eq("id", patternId)
      .single();

    if (error || !pattern) {
      return NextResponse.json(
        { error: "Pattern not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ pattern });
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
 * PUT: Update a recurring pattern (admin only)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ patternId: string }> }
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

    const { patternId } = await params;
    const body = await request.json().catch(() => ({}));
    const {
      template_id,
      pattern_type,
      day_of_week,
      week_of_month,
      interval_weeks,
      start_date,
      end_date,
      is_active,
      last_generated_date,
    } = body;

    const updateData: ServiceRecurringPatternUpdate = {};
    if (template_id !== undefined) updateData.template_id = template_id;
    if (pattern_type !== undefined) {
      if (!["weekly", "bi_weekly", "monthly", "custom"].includes(pattern_type)) {
        return NextResponse.json(
          { error: "Invalid pattern type" },
          { status: 400 }
        );
      }
      updateData.pattern_type = pattern_type;
    }
    if (day_of_week !== undefined) updateData.day_of_week = day_of_week;
    if (week_of_month !== undefined) updateData.week_of_month = week_of_month;
    if (interval_weeks !== undefined) updateData.interval_weeks = interval_weeks;
    if (start_date !== undefined) updateData.start_date = start_date;
    if (end_date !== undefined) updateData.end_date = end_date;
    if (is_active !== undefined) updateData.is_active = is_active;
    if (last_generated_date !== undefined) updateData.last_generated_date = last_generated_date;

    const admin = createAdminClient();
    const { data: updatedPattern, error } = await admin
      .from("service_recurring_patterns")
      .update(updateData)
      .eq("id", patternId)
      .select(`
        *,
        template:service_templates(id, name, description, default_time)
      `)
      .single();

    if (error) {
      console.error("Error updating pattern:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      pattern: updatedPattern,
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
 * DELETE: Soft delete a recurring pattern (admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ patternId: string }> }
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

    const { patternId } = await params;

    const admin = createAdminClient();
    // Soft delete by setting is_active to false
    const { error } = await admin
      .from("service_recurring_patterns")
      .update({ is_active: false })
      .eq("id", patternId);

    if (error) {
      console.error("Error deleting pattern:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Pattern deleted successfully",
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


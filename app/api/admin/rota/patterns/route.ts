import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ServiceRecurringPatternInsert } from "@/types/database.types";

/**
 * GET: List all recurring patterns (with optional template_id filter)
 * POST: Create a new recurring pattern (admin only)
 */
export async function GET(request: NextRequest) {
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

    const admin = createAdminClient();
    const { searchParams } = new URL(request.url);
    const templateId = searchParams.get("template_id");

    let query = admin
      .from("service_recurring_patterns")
      .select(`
        *,
        template:service_templates(id, name, description, default_time)
      `)
      .order("created_at", { ascending: false });

    // Apply filter if provided
    if (templateId) {
      query = query.eq("template_id", templateId);
    }

    const { data: patterns, error } = await query;

    if (error) {
      console.error("Error fetching patterns:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ patterns: patterns || [] });
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
 * POST: Create a new recurring pattern (admin only)
 */
export async function POST(request: NextRequest) {
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
    } = body;

    // Validation
    if (!template_id || typeof template_id !== "string") {
      return NextResponse.json(
        { error: "Template ID is required" },
        { status: 400 }
      );
    }

    if (!pattern_type || !["weekly", "bi_weekly", "monthly", "custom"].includes(pattern_type)) {
      return NextResponse.json(
        { error: "Pattern type must be one of: weekly, bi_weekly, monthly, custom" },
        { status: 400 }
      );
    }

    if (!start_date || typeof start_date !== "string") {
      return NextResponse.json(
        { error: "Start date is required" },
        { status: 400 }
      );
    }

    // Validate pattern-specific fields
    if (pattern_type === "weekly" || pattern_type === "bi_weekly" || pattern_type === "monthly") {
      if (day_of_week === undefined || day_of_week === null || day_of_week < 0 || day_of_week > 6) {
        return NextResponse.json(
          { error: "Day of week (0-6) is required for this pattern type" },
          { status: 400 }
        );
      }
    }

    if (pattern_type === "monthly" && (week_of_month === undefined || week_of_month < 1 || week_of_month > 5)) {
      return NextResponse.json(
        { error: "Week of month (1-5) is required for monthly patterns" },
        { status: 400 }
      );
    }

    if (pattern_type === "custom") {
      if (interval_weeks === undefined || interval_weeks < 1) {
        return NextResponse.json(
          { error: "Interval weeks (>= 1) is required for custom patterns" },
          { status: 400 }
        );
      }
    }

    const admin = createAdminClient();
    const { data: newPattern, error } = await admin
      .from("service_recurring_patterns")
      .insert({
        template_id: template_id.trim(),
        pattern_type,
        day_of_week: day_of_week !== undefined ? day_of_week : null,
        week_of_month: week_of_month !== undefined ? week_of_month : null,
        interval_weeks: interval_weeks !== undefined ? interval_weeks : null,
        start_date: start_date.trim(),
        end_date: end_date?.trim() || null,
        is_active: is_active !== undefined ? is_active : true,
      } as ServiceRecurringPatternInsert)
      .select(`
        *,
        template:service_templates(id, name, description, default_time)
      `)
      .single();

    if (error) {
      console.error("Error creating pattern:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      pattern: newPattern,
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


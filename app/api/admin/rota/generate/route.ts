import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  calculateNextServiceDates,
  checkForExistingServices,
  generateServicesFromTemplate,
} from "@/lib/rota/service-generator";

/**
 * POST: Generate services from a template/pattern
 * Body: {
 *   template_id: string (required)
 *   pattern_id?: string (optional - if provided, uses pattern to calculate dates)
 *   start_date?: string (optional - defaults to today)
 *   end_date?: string (optional - defaults to 3 months from start)
 *   generate_assignments?: boolean (optional - defaults to false)
 * }
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
      pattern_id,
      start_date,
      end_date,
      // generate_assignments, // Reserved for future use
    } = body;

    if (!template_id || typeof template_id !== "string") {
      return NextResponse.json(
        { error: "Template ID is required" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // Determine date range
    const today = new Date();
    const start = start_date ? new Date(start_date) : today;
    const end = end_date
      ? new Date(end_date)
      : new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000); // Default: 3 months

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json(
        { error: "Invalid date format. Use YYYY-MM-DD" },
        { status: 400 }
      );
    }

    if (start > end) {
      return NextResponse.json(
        { error: "Start date must be before end date" },
        { status: 400 }
      );
    }

    let datesToGenerate: string[] = [];

    // If pattern_id is provided, use pattern to calculate dates
    if (pattern_id) {
      const { data: pattern, error: patternError } = await admin
        .from("service_recurring_patterns")
        .select("*")
        .eq("id", pattern_id)
        .eq("is_active", true)
        .single();

      if (patternError || !pattern) {
        return NextResponse.json(
          { error: "Pattern not found or inactive" },
          { status: 404 }
        );
      }

      if (pattern.template_id !== template_id) {
        return NextResponse.json(
          { error: "Pattern does not match template" },
          { status: 400 }
        );
      }

      // Calculate dates from pattern
      datesToGenerate = calculateNextServiceDates(
        {
          pattern_type: pattern.pattern_type as "weekly" | "bi_weekly" | "monthly" | "custom",
          day_of_week: pattern.day_of_week,
          week_of_month: pattern.week_of_month,
          interval_weeks: pattern.interval_weeks,
          start_date: pattern.start_date,
          end_date: pattern.end_date,
          last_generated_date: pattern.last_generated_date,
        },
        start,
        end
      );

      // Update last_generated_date if we generated any services
      if (datesToGenerate.length > 0) {
        const lastDate = datesToGenerate[datesToGenerate.length - 1];
        await admin
          .from("service_recurring_patterns")
          .update({ last_generated_date: lastDate })
          .eq("id", pattern_id);
      }
    } else {
      // Generate for specific date range (manual generation)
      // For now, we'll generate for each day in the range
      // In a real scenario, you might want to specify exact dates
      const dates: string[] = [];
      const current = new Date(start);
      while (current <= end) {
        dates.push(current.toISOString().split("T")[0]);
        current.setDate(current.getDate() + 1);
      }
      datesToGenerate = dates;
    }

    if (datesToGenerate.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No dates to generate",
        services: [],
        skipped: [],
      });
    }

    // Check for existing services
    const existing = await checkForExistingServices(datesToGenerate, admin);

    // Filter out dates that already have services
    const datesToCreate = datesToGenerate.filter((date) => !existing.has(date));

    if (datesToCreate.length === 0) {
      return NextResponse.json({
        success: true,
        message: "All dates already have services",
        services: [],
        skipped: Array.from(existing.values()),
      });
    }

    // Generate services
    const createdServiceIds = await generateServicesFromTemplate(
      template_id,
      datesToCreate,
      admin
    );

    // Fetch created services for response
    const { data: createdServices } = await admin
      .from("services")
      .select("id, name, date, time")
      .in("id", createdServiceIds);

    return NextResponse.json({
      success: true,
      message: `Generated ${createdServiceIds.length} service(s)`,
      services: createdServices || [],
      skipped: Array.from(existing.values()),
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


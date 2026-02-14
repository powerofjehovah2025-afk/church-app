import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { calculateNextServiceDates, generateServicesFromTemplate } from "@/lib/rota/service-generator";

/**
 * Cron job endpoint to automatically generate services from active recurring patterns
 * Runs daily to generate services for the next 30 days
 * Protected with CRON_SECRET
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    // In production, CRON_SECRET must be set
    if (process.env.NODE_ENV === "production" && !cronSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // When secret is set, require correct Bearer token
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();

    // Get all active patterns that need generation
    const today = new Date();
    const endDate = new Date();
    endDate.setDate(today.getDate() + 30); // Generate for next 30 days

    const { data: patterns, error: patternsError } = await admin
      .from("service_recurring_patterns")
      .select(`
        *,
        template:service_templates(id, name, description, default_time)
      `)
      .eq("is_active", true)
      .or(`last_generated_date.is.null,last_generated_date.lt.${today.toISOString().split("T")[0]}`);

    if (patternsError) {
      console.error("Error fetching patterns:", patternsError);
      return NextResponse.json(
        { error: "Failed to fetch patterns" },
        { status: 500 }
      );
    }

    if (!patterns || patterns.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No active patterns found or all patterns are up to date",
        generated: 0,
      });
    }

    let totalGenerated = 0;
    const results: Array<{ patternId: string; patternName: string; generated: number; error?: string }> = [];

    // Process each pattern
    for (const pattern of patterns) {
      try {
        if (!pattern.template) {
          results.push({
            patternId: pattern.id,
            patternName: "Unknown",
            generated: 0,
            error: "Template not found",
          });
          continue;
        }

        // Calculate dates for this pattern
        const dates = calculateNextServiceDates(
          {
            pattern_type: pattern.pattern_type as "weekly" | "bi_weekly" | "monthly" | "custom",
            day_of_week: pattern.day_of_week,
            week_of_month: pattern.week_of_month,
            interval_weeks: pattern.interval_weeks,
            start_date: pattern.start_date,
            end_date: pattern.end_date,
            last_generated_date: pattern.last_generated_date,
          },
          today,
          endDate
        );

        if (dates.length === 0) {
          // Update last_generated_date even if no dates to prevent repeated checks
          await admin
            .from("service_recurring_patterns")
            .update({ last_generated_date: today.toISOString().split("T")[0] })
            .eq("id", pattern.id);

          results.push({
            patternId: pattern.id,
            patternName: pattern.template.name,
            generated: 0,
          });
          continue;
        }

        // Generate services
        const serviceIds = await generateServicesFromTemplate(
          pattern.template_id,
          dates,
          admin
        );

        // Update last_generated_date
        if (serviceIds.length > 0) {
          const lastDate = dates[dates.length - 1];
          await admin
            .from("service_recurring_patterns")
            .update({ last_generated_date: lastDate })
            .eq("id", pattern.id);
        } else {
          // Update even if no services generated (to prevent repeated checks)
          await admin
            .from("service_recurring_patterns")
            .update({ last_generated_date: today.toISOString().split("T")[0] })
            .eq("id", pattern.id);
        }

        totalGenerated += serviceIds.length;
        results.push({
          patternId: pattern.id,
          patternName: pattern.template.name,
          generated: serviceIds.length,
        });
      } catch (error) {
        console.error(`Error processing pattern ${pattern.id}:`, error);
        results.push({
          patternId: pattern.id,
          patternName: pattern.template?.name || "Unknown",
          generated: 0,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Generated ${totalGenerated} service(s) from ${patterns.length} pattern(s)`,
      totalGenerated,
      results,
    });
  } catch (error) {
    console.error("Error in generate-services cron:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}


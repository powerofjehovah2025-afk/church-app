import { createAdminClient } from "@/lib/supabase/admin";
import type { ServiceInsert } from "@/types/database.types";

/**
 * Calculate the next service dates based on a recurring pattern
 * @param pattern - The recurring pattern configuration
 * @param startDate - Start date for generation (usually today or pattern start_date)
 * @param endDate - End date for generation (e.g., 3 months from now)
 * @returns Array of date strings (YYYY-MM-DD format)
 */
export function calculateNextServiceDates(
  pattern: {
    pattern_type: "weekly" | "bi_weekly" | "monthly" | "custom";
    day_of_week: number | null;
    week_of_month: number | null;
    interval_weeks: number | null;
    start_date: string;
    end_date: string | null;
    last_generated_date: string | null;
  },
  startDate: Date,
  endDate: Date
): string[] {
  const dates: string[] = [];
  const end = new Date(endDate);

  // If pattern has an end_date, don't generate beyond it
  if (pattern.end_date) {
    const patternEnd = new Date(pattern.end_date);
    if (patternEnd < end) {
      end.setTime(patternEnd.getTime());
    }
  }

  // Start from the later of: pattern start_date, provided startDate, or last_generated_date
  const start = new Date(Math.max(
    new Date(pattern.start_date).getTime(),
    startDate.getTime(),
    pattern.last_generated_date ? new Date(pattern.last_generated_date).getTime() : 0
  ));

  // For weekly patterns
  if (pattern.pattern_type === "weekly") {
    if (pattern.day_of_week === null || pattern.day_of_week === undefined) {
      return dates; // Invalid pattern
    }

    // Find the next occurrence of the day of week
    const targetDay = pattern.day_of_week;
    const current = new Date(start);
    
    // Move to the next occurrence of the target day
    while (current.getDay() !== targetDay) {
      current.setDate(current.getDate() + 1);
    }

    // If we're already past today, start from next week
    if (current < start) {
      current.setDate(current.getDate() + 7);
    }

    while (current <= end) {
      dates.push(current.toISOString().split("T")[0]);
      current.setDate(current.getDate() + 7);
    }
  }

  // For bi-weekly patterns
  else if (pattern.pattern_type === "bi_weekly") {
    if (pattern.day_of_week === null || pattern.day_of_week === undefined) {
      return dates;
    }

    const targetDay = pattern.day_of_week;
    const current = new Date(start);
    
    while (current.getDay() !== targetDay) {
      current.setDate(current.getDate() + 1);
    }

    if (current < start) {
      current.setDate(current.getDate() + 14);
    }

    while (current <= end) {
      dates.push(current.toISOString().split("T")[0]);
      current.setDate(current.getDate() + 14);
    }
  }

  // For monthly patterns (e.g., 1st Sunday of each month)
  else if (pattern.pattern_type === "monthly") {
    if (pattern.day_of_week === null || pattern.week_of_month === null) {
      return dates;
    }

    const targetDay = pattern.day_of_week;
    const targetWeek = pattern.week_of_month; // 1-5 (1st, 2nd, 3rd, 4th, 5th occurrence)
    const current = new Date(start);
    current.setDate(1); // Start from first day of month

    while (current <= end) {
      // Find the target day in this month
      const date = new Date(current.getFullYear(), current.getMonth(), 1);
      
      // Find the first occurrence of the target day
      while (date.getDay() !== targetDay) {
        date.setDate(date.getDate() + 1);
      }
      
      // Move to the target week occurrence
      date.setDate(date.getDate() + (targetWeek - 1) * 7);
      
      // Make sure we're still in the same month
      if (date.getMonth() === current.getMonth() && date >= start && date <= end) {
        dates.push(date.toISOString().split("T")[0]);
      }

      // Move to next month
      current.setMonth(current.getMonth() + 1);
    }
  }

  // For custom patterns (every N weeks)
  else if (pattern.pattern_type === "custom") {
    if (pattern.day_of_week === null || pattern.interval_weeks === null || pattern.interval_weeks < 1) {
      return dates;
    }

    const targetDay = pattern.day_of_week;
    const interval = pattern.interval_weeks;
    const current = new Date(start);
    
    while (current.getDay() !== targetDay) {
      current.setDate(current.getDate() + 1);
    }

    if (current < start) {
      current.setDate(current.getDate() + (interval * 7));
    }

    while (current <= end) {
      dates.push(current.toISOString().split("T")[0]);
      current.setDate(current.getDate() + (interval * 7));
    }
  }

  return dates;
}

/**
 * Check for existing services on the given dates
 * @param dates - Array of date strings (YYYY-MM-DD)
 * @param adminClient - Supabase admin client
 * @returns Map of date -> service (if exists)
 */
export async function checkForExistingServices(
  dates: string[],
  adminClient: ReturnType<typeof createAdminClient>
): Promise<Map<string, { id: string; name: string; date: string }>> {
  const existing = new Map<string, { id: string; name: string; date: string }>();

  if (dates.length === 0) {
    return existing;
  }

  const { data: services, error } = await adminClient
    .from("services")
    .select("id, name, date")
    .in("date", dates);

  if (error) {
    console.error("Error checking for existing services:", error);
    return existing;
  }

  if (services) {
    for (const service of services) {
      existing.set(service.date, {
        id: service.id,
        name: service.name,
        date: service.date,
      });
    }
  }

  return existing;
}

/**
 * Generate services from a template for the given dates
 * @param templateId - The service template ID
 * @param dates - Array of date strings (YYYY-MM-DD)
 * @param adminClient - Supabase admin client
 * @returns Array of created service IDs
 */
export async function generateServicesFromTemplate(
  templateId: string,
  dates: string[],
  adminClient: ReturnType<typeof createAdminClient>
): Promise<string[]> {
  // Get template details
  const { data: template, error: templateError } = await adminClient
    .from("service_templates")
    .select("id, name, description, default_time")
    .eq("id", templateId)
    .single();

  if (templateError || !template) {
    throw new Error(`Template not found: ${templateId}`);
  }

  // Check for existing services
  const existing = await checkForExistingServices(dates, adminClient);

  // Filter out dates that already have services
  const datesToCreate = dates.filter((date) => !existing.has(date));

  if (datesToCreate.length === 0) {
    return [];
  }

  // Create services
  const servicesToInsert: ServiceInsert[] = datesToCreate.map((date) => ({
    date,
    name: template.name,
    time: template.default_time || null,
  }));

  const { data: createdServices, error: createError } = await adminClient
    .from("services")
    .insert(servicesToInsert)
    .select("id");

  if (createError) {
    console.error("Error creating services:", createError);
    throw new Error(`Failed to create services: ${createError.message}`);
  }

  return (createdServices || []).map((s) => s.id);
}

/**
 * Generate service assignments for default duty types from a template
 * @param serviceId - The service ID
 * @param templateId - The service template ID
 * @param adminClient - Supabase admin client
 * @returns Array of created assignment IDs
 */
export async function generateServiceAssignments(
  serviceId: string,
  templateId: string,
  adminClient: ReturnType<typeof createAdminClient>
): Promise<string[]> {
  // Get template duty types
  const { data: templateDutyTypes, error: dutyTypesError } = await adminClient
    .from("service_template_duty_types")
    .select("duty_type_id, is_required")
    .eq("template_id", templateId);

  if (dutyTypesError) {
    console.error("Error fetching template duty types:", dutyTypesError);
    return [];
  }

  if (!templateDutyTypes || templateDutyTypes.length === 0) {
    return []; // No duty types configured for this template
  }

  // Create empty assignments (without member_id - these will be assigned later)
  // Note: service_assignments requires member_id, so we'll need to handle this differently
  // For now, we'll skip creating assignments without members
  // This can be enhanced later to allow "unassigned" slots

  return [];
}


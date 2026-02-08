import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendAssignmentNotification } from "@/lib/notifications/rota";

/**
 * Cron job endpoint for sending rota reminders
 * Should be called daily (e.g., via Vercel Cron Jobs)
 * 
 * Checks for services 14 days and 2 days away and sends reminders
 */
export async function GET(request: Request) {
  // Verify this is a cron job request (optional: add auth header check)
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  // Optional: Add secret for security
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const admin = createAdminClient();

    // Calculate dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const fourteenDaysLater = new Date(today);
    fourteenDaysLater.setDate(today.getDate() + 14);
    const fourteenDaysStr = fourteenDaysLater.toISOString().split("T")[0];

    const twoDaysLater = new Date(today);
    twoDaysLater.setDate(today.getDate() + 2);
    const twoDaysStr = twoDaysLater.toISOString().split("T")[0];

    // Fetch services 14 days and 2 days away
    const { data: services14Days, error: error14 } = await admin
      .from("services")
      .select("id, name, date, time")
      .eq("date", fourteenDaysStr);

    const { data: services2Days, error: error2 } = await admin
      .from("services")
      .select("id, name, date, time")
      .eq("date", twoDaysStr);

    if (error14 || error2) {
      console.error("Error fetching services:", error14 || error2);
      return NextResponse.json(
        { error: "Failed to fetch services" },
        { status: 500 }
      );
    }

    const allServices = [
      ...(services14Days || []).map((s) => ({ ...s, reminderType: "14-day" as const })),
      ...(services2Days || []).map((s) => ({ ...s, reminderType: "2-day" as const })),
    ];

    if (allServices.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No services requiring reminders",
        sent: 0,
      });
    }

    // Fetch assignments for these services
    const serviceIds = allServices.map((s) => s.id);
    const { data: assignments, error: assignmentsError } = await admin
      .from("service_assignments")
      .select(`
        *,
        service:services(*),
        duty_type:duty_types(*),
        member:profiles!service_assignments_member_id_fkey(id, full_name, email)
      `)
      .in("service_id", serviceIds)
      .eq("status", "confirmed"); // Only send to confirmed assignments

    if (assignmentsError) {
      console.error("Error fetching assignments:", assignmentsError);
      return NextResponse.json(
        { error: "Failed to fetch assignments" },
        { status: 500 }
      );
    }

    // Send notifications
    let sent = 0;
    let errors = 0;

    for (const assignment of assignments || []) {
      const service = allServices.find((s) => s.id === assignment.service_id);
      if (!service || !assignment.member) continue;

      const result = await sendAssignmentNotification({
        memberName: assignment.member.full_name || assignment.member.email || "Member",
        memberEmail: assignment.member.email,
        serviceName: service.name,
        serviceDate: service.date,
        serviceTime: service.time || null,
        dutyTypeName: assignment.duty_type?.name || "Duty",
        reminderType: service.reminderType,
      });

      if (result.success) {
        sent++;
      } else {
        errors++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Sent ${sent} reminders, ${errors} errors`,
      sent,
      errors,
    });
  } catch (error) {
    console.error("Unexpected error in rota reminders cron:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}



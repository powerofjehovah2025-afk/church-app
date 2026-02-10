import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  try {
    // Verify this is a cron job request (optional: add auth header check)
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    // Optional: Add secret for security
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = createAdminClient();
    const today = new Date().toISOString().split("T")[0];

    // Find all overdue follow-ups (assigned more than 48 hours ago and not contacted)
    const { data: overdueNewcomers, error: overdueError } = await admin
      .from("newcomers")
      .select(`
        id,
        full_name,
        email,
        phone,
        assigned_to,
        assigned_at,
        followup_status,
        staff:profiles!newcomers_assigned_to_fkey(id, full_name, email)
      `)
      .not("assigned_to", "is", null)
      .in("followup_status", ["not_started", "in_progress"])
      .or(`assigned_at.lt.${new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()},and(assigned_at.is.null,created_at.lt.${new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()})`);

    if (overdueError) {
      console.error("Error fetching overdue newcomers:", overdueError);
      return NextResponse.json(
        { error: "Failed to fetch overdue newcomers" },
        { status: 500 }
      );
    }

    // Find reminders that are due today and not sent
    const { data: dueReminders, error: remindersError } = await admin
      .from("followup_reminders")
      .select(`
        *,
        newcomer:newcomers(id, full_name, email, phone, followup_status),
        staff:profiles!followup_reminders_staff_id_fkey(id, full_name, email)
      `)
      .eq("reminder_date", today)
      .eq("is_sent", false);

    if (remindersError) {
      console.error("Error fetching due reminders:", remindersError);
      return NextResponse.json(
        { error: "Failed to fetch reminders" },
        { status: 500 }
      );
    }

    // Create notifications for overdue follow-ups
    const notifications = [];
    for (const newcomer of overdueNewcomers || []) {
      if (!newcomer.assigned_to) continue;

      // Check if notification already exists
      const { data: existing } = await admin
        .from("notifications")
        .select("id")
        .eq("user_id", newcomer.assigned_to)
        .eq("type", "duty_reminder")
        .like("message", `%${newcomer.full_name}%`)
        .eq("is_read", false)
        .limit(1);

      if (existing && existing.length > 0) {
        continue; // Skip if notification already exists
      }

      const hoursSinceAssignment = newcomer.assigned_at
        ? (Date.now() - new Date(newcomer.assigned_at).getTime()) / (1000 * 60 * 60)
        : (Date.now() - new Date(newcomer.created_at || Date.now()).getTime()) / (1000 * 60 * 60);

      const daysOverdue = Math.floor(hoursSinceAssignment / 24);

      notifications.push({
        user_id: newcomer.assigned_to,
        type: "duty_reminder",
        title: `Overdue Follow-up: ${newcomer.full_name}`,
        message: `${newcomer.full_name} was assigned to you ${daysOverdue} day${daysOverdue !== 1 ? "s" : ""} ago and hasn't been contacted yet.`,
        link: "/dashboard",
        is_read: false,
      });
    }

    // Create notifications for due reminders
    for (const reminder of dueReminders || []) {
      if (!reminder.staff_id) continue;

      notifications.push({
        user_id: reminder.staff_id,
        type: "duty_reminder",
        title: `Follow-up Reminder: ${reminder.newcomer?.full_name || "Newcomer"}`,
        message: `Reminder: Follow up with ${reminder.newcomer?.full_name || "assigned newcomer"} today.`,
        link: "/dashboard",
        is_read: false,
      });

      // Mark reminder as sent
      await admin
        .from("followup_reminders")
        .update({
          is_sent: true,
          sent_at: new Date().toISOString(),
        })
        .eq("id", reminder.id);
    }

    // Insert all notifications
    if (notifications.length > 0) {
      const { error: notifyError } = await admin
        .from("notifications")
        .insert(notifications);

      if (notifyError) {
        console.error("Error creating notifications:", notifyError);
      }
    }

    return NextResponse.json({
      success: true,
      overdueCount: overdueNewcomers?.length || 0,
      remindersCount: dueReminders?.length || 0,
      notificationsCreated: notifications.length,
    });
  } catch (error) {
    console.error("Error in GET /api/cron/followup-reminders:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

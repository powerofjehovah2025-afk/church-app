import { createAdminClient } from "@/lib/supabase/admin";
import { generateFollowupAssignmentEmail } from "@/lib/emails/followup-assignment";
import { generateFollowupReminderEmail } from "@/lib/emails/followup-reminder";
import { sendEmail } from "@/lib/emails/send";

/**
 * Send follow-up assignment notification
 * This creates a notification in the database and can be extended to send emails
 */
export async function sendFollowupAssignmentNotification(data: {
  staffId: string;
  staffEmail: string | null;
  staffName: string | null;
  newcomerId: string;
  newcomerName: string;
  newcomerEmail: string | null;
  newcomerPhone: string | null;
  dashboardUrl?: string;
}) {
  try {
    const admin = createAdminClient();
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const dashboardUrl = data.dashboardUrl || `${baseUrl}/dashboard`;

    // Create notification in database
    const { error: notifyError } = await admin.from("notifications").insert({
      user_id: data.staffId,
      type: "duty_reminder",
      title: `New Follow-up Assignment: ${data.newcomerName}`,
      message: `You have been assigned to follow up with ${data.newcomerName}. Please contact them within 48 hours.`,
      link: dashboardUrl,
      is_read: false,
    });

    if (notifyError) {
      console.error("Error creating notification:", notifyError);
    }

    // Send email when staff has an email address (uses Resend when RESEND_API_KEY is set)
    if (data.staffEmail) {
      const emailContent = generateFollowupAssignmentEmail({
        staffName: data.staffName || data.staffEmail,
        newcomerName: data.newcomerName,
        newcomerEmail: data.newcomerEmail,
        newcomerPhone: data.newcomerPhone,
        dashboardUrl,
      });
      await sendEmail({
        to: data.staffEmail,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
      });
    }

    return { success: true };
  } catch (error) {
    console.error("Error sending follow-up assignment notification:", error);
    return { success: false, error };
  }
}

/**
 * Send follow-up reminder notification
 */
export async function sendFollowupReminderNotification(data: {
  staffId: string;
  staffEmail: string | null;
  staffName: string | null;
  newcomerId: string;
  newcomerName: string;
  newcomerEmail: string | null;
  newcomerPhone: string | null;
  daysOverdue: number;
  dashboardUrl?: string;
}) {
  try {
    const admin = createAdminClient();
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const dashboardUrl = data.dashboardUrl || `${baseUrl}/dashboard`;

    // Create notification in database
    const { error: notifyError } = await admin.from("notifications").insert({
      user_id: data.staffId,
      type: "duty_reminder",
      title: `Overdue Follow-up: ${data.newcomerName}`,
      message: `${data.newcomerName} was assigned to you ${data.daysOverdue} day${data.daysOverdue !== 1 ? "s" : ""} ago and hasn't been contacted yet.`,
      link: dashboardUrl,
      is_read: false,
    });

    if (notifyError) {
      console.error("Error creating notification:", notifyError);
    }

    // Send email when staff has an email address (uses Resend when RESEND_API_KEY is set)
    if (data.staffEmail) {
      const emailContent = generateFollowupReminderEmail({
        staffName: data.staffName || data.staffEmail,
        newcomerName: data.newcomerName,
        newcomerEmail: data.newcomerEmail,
        newcomerPhone: data.newcomerPhone,
        daysOverdue: data.daysOverdue,
        dashboardUrl,
      });
      await sendEmail({
        to: data.staffEmail,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
      });
    }

    return { success: true };
  } catch (error) {
    console.error("Error sending follow-up reminder notification:", error);
    return { success: false, error };
  }
}


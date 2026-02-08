/**
 * Rota notification service
 * Handles sending notifications for service assignments
 */

interface AssignmentNotificationData {
  memberName: string;
  memberEmail: string | null;
  serviceName: string;
  serviceDate: string;
  serviceTime: string | null;
  dutyTypeName: string;
  reminderType: "assignment" | "14-day" | "2-day";
}

/**
 * Send a notification to a member about their assignment
 * This is a placeholder - integrate with your email/SMS service
 */
export async function sendAssignmentNotification(
  data: AssignmentNotificationData
): Promise<{ success: boolean; error?: string }> {
  try {
    // TODO: Integrate with Resend (email) or Twilio (SMS/WhatsApp)
    // For now, just log the notification
    
    const subject = getNotificationSubject(data.reminderType);
    const message = getNotificationMessage(data);

    console.log("[NOTIFICATION] Sending rota notification:", {
      to: data.memberEmail,
      subject,
      message,
    });

    // Placeholder: Replace with actual email/SMS sending logic
    // Example with Resend:
    // await resend.emails.send({
    //   from: 'church@example.com',
    //   to: data.memberEmail,
    //   subject,
    //   html: message,
    // });

    return { success: true };
  } catch (error) {
    console.error("[ERROR] Failed to send notification:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

function getNotificationSubject(reminderType: "assignment" | "14-day" | "2-day"): string {
  switch (reminderType) {
    case "assignment":
      return "New Service Assignment";
    case "14-day":
      return "Reminder: Service Assignment in 14 Days";
    case "2-day":
      return "Reminder: Service Assignment in 2 Days";
    default:
      return "Service Assignment Reminder";
  }
}

function getNotificationMessage(data: AssignmentNotificationData): string {
  const dateStr = new Date(data.serviceDate).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const timeStr = data.serviceTime ? ` at ${data.serviceTime}` : "";

  let intro = "";
  switch (data.reminderType) {
    case "assignment":
      intro = `Hello ${data.memberName},\n\nYou have been assigned to serve as ${data.dutyTypeName} for the upcoming service.`;
      break;
    case "14-day":
      intro = `Hello ${data.memberName},\n\nThis is a reminder that you are scheduled to serve as ${data.dutyTypeName} in 14 days.`;
      break;
    case "2-day":
      intro = `Hello ${data.memberName},\n\nThis is a reminder that you are scheduled to serve as ${data.dutyTypeName} in 2 days.`;
      break;
  }

  return `${intro}

Service Details:
- Service: ${data.serviceName}
- Date: ${dateStr}${timeStr}
- Duty: ${data.dutyTypeName}

Please confirm your availability. If you cannot make it, please contact the admin as soon as possible.

Thank you for your service!
`;
}

/**
 * Check for assignments that need reminders and send them
 */
export async function sendRotaReminders(): Promise<{
  sent: number;
  errors: number;
}> {
  try {
    // This will be called from the cron job
    // It should fetch assignments from the database and send reminders
    // For now, return placeholder
    console.log("[NOTIFICATION] Running rota reminder check...");
    
    return { sent: 0, errors: 0 };
  } catch (error) {
    console.error("[ERROR] Failed to send rota reminders:", error);
    return { sent: 0, errors: 1 };
  }
}



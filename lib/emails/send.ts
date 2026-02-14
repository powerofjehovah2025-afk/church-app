export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface SendEmailResult {
  success: boolean;
  skipped?: boolean;
  error?: string;
}

/**
 * Send an email via Resend when RESEND_API_KEY is set.
 * If the key is missing, no-op and return success so the app does not break.
 */
export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || !apiKey.trim()) {
    return { success: true, skipped: true };
  }

  const from = process.env.RESEND_FROM_EMAIL || "Church App <onboarding@resend.dev>";

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text ?? undefined,
    });

    if (error) {
      return { success: false, error: error.message };
    }
    if (data?.id) {
      return { success: true };
    }
    return { success: false, error: "No response from email provider" };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to send email";
    return { success: false, error: message };
  }
}

/**
 * Email template for overdue follow-up reminders
 */
export function generateFollowupReminderEmail(data: {
  staffName: string;
  newcomerName: string;
  newcomerEmail: string | null;
  newcomerPhone: string | null;
  daysOverdue: number;
  dashboardUrl: string;
}) {
  const { staffName, newcomerName, newcomerEmail, newcomerPhone, daysOverdue, dashboardUrl } = data;

  const subject = `⚠️ Overdue Follow-up: ${newcomerName} (${daysOverdue} day${daysOverdue !== 1 ? 's' : ''} overdue)`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">⚠️ Overdue Follow-up</h1>
        </div>
        
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #dc2626; margin-top: 0;">Action Required</h2>
          
          <p>Hello ${staffName},</p>
          
          <p>This is a reminder that you have an overdue follow-up assignment:</p>
          
          <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ef4444;">
            <p style="margin: 0 0 10px 0;"><strong>Name:</strong> ${newcomerName}</p>
            ${newcomerEmail ? `<p style="margin: 0 0 10px 0;"><strong>Email:</strong> ${newcomerEmail}</p>` : ''}
            ${newcomerPhone ? `<p style="margin: 0 0 10px 0;"><strong>Phone:</strong> ${newcomerPhone}</p>` : ''}
            <p style="margin: 0; color: #ef4444;"><strong>Days Overdue:</strong> ${daysOverdue}</p>
          </div>
          
          <p style="color: #dc2626; font-weight: bold;">Please contact them as soon as possible.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${dashboardUrl}" style="background: #ef4444; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Update Status
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            This is an automated reminder from the RCCG POJ Essex Church Management System.
          </p>
        </div>
      </body>
    </html>
  `;

  const text = `
⚠️ Overdue Follow-up - Action Required

Hello ${staffName},

This is a reminder that you have an overdue follow-up assignment:

Name: ${newcomerName}
${newcomerEmail ? `Email: ${newcomerEmail}\n` : ''}${newcomerPhone ? `Phone: ${newcomerPhone}\n` : ''}
Days Overdue: ${daysOverdue}

Please contact them as soon as possible.

Update Status: ${dashboardUrl}

This is an automated reminder from the RCCG POJ Essex Church Management System.
  `;

  return { subject, html, text };
}


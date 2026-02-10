/**
 * Email template for when a newcomer is assigned to a staff member
 */
export function generateFollowupAssignmentEmail(data: {
  staffName: string;
  newcomerName: string;
  newcomerEmail: string | null;
  newcomerPhone: string | null;
  dashboardUrl: string;
}) {
  const { staffName, newcomerName, newcomerEmail, newcomerPhone, dashboardUrl } = data;

  const subject = `New Follow-up Assignment: ${newcomerName}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">RCCG Power of Jehovah, Essex</h1>
        </div>
        
        <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #333; margin-top: 0;">New Follow-up Assignment</h2>
          
          <p>Hello ${staffName},</p>
          
          <p>You have been assigned to follow up with a new member:</p>
          
          <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #667eea;">
            <p style="margin: 0 0 10px 0;"><strong>Name:</strong> ${newcomerName}</p>
            ${newcomerEmail ? `<p style="margin: 0 0 10px 0;"><strong>Email:</strong> ${newcomerEmail}</p>` : ''}
            ${newcomerPhone ? `<p style="margin: 0;"><strong>Phone:</strong> ${newcomerPhone}</p>` : ''}
          </div>
          
          <p>Please reach out to them within 48 hours to welcome them and see how we can support them.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${dashboardUrl}" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              View Dashboard
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            This is an automated notification from the RCCG POJ Essex Church Management System.
          </p>
        </div>
      </body>
    </html>
  `;

  const text = `
RCCG Power of Jehovah, Essex
New Follow-up Assignment

Hello ${staffName},

You have been assigned to follow up with a new member:

Name: ${newcomerName}
${newcomerEmail ? `Email: ${newcomerEmail}\n` : ''}${newcomerPhone ? `Phone: ${newcomerPhone}\n` : ''}

Please reach out to them within 48 hours to welcome them and see how we can support them.

View Dashboard: ${dashboardUrl}

This is an automated notification from the RCCG POJ Essex Church Management System.
  `;

  return { subject, html, text };
}


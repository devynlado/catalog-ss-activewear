// Email template for internal team notification when a contact form is submitted

interface ContactNotificationProps {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  message: string;
  service?: string;
}

export function generateContactNotificationHtml(props: ContactNotificationProps): string {
  const { name, email, phone, company, message, service } = props;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Contact Form Submission</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f1f5f9; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 32px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">💬 New Contact Form Submission</h1>
            </td>
          </tr>
          
          <!-- Contact Info -->
          <tr>
            <td style="padding: 32px;">
              <h2 style="margin: 0 0 16px; color: #0f172a; font-size: 18px; font-weight: 600;">Contact Information</h2>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 8px 0; color: #64748b; width: 100px;">Name:</td>
                  <td style="padding: 8px 0;"><strong>${name}</strong></td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b;">Email:</td>
                  <td style="padding: 8px 0;"><a href="mailto:${email}" style="color: #2563eb;">${email}</a></td>
                </tr>
                ${phone ? `
                <tr>
                  <td style="padding: 8px 0; color: #64748b;">Phone:</td>
                  <td style="padding: 8px 0;"><a href="tel:${phone}" style="color: #2563eb;">${phone}</a></td>
                </tr>
                ` : ''}
                ${company ? `
                <tr>
                  <td style="padding: 8px 0; color: #64748b;">Company:</td>
                  <td style="padding: 8px 0;"><strong>${company}</strong></td>
                </tr>
                ` : ''}
                ${service ? `
                <tr>
                  <td style="padding: 8px 0; color: #64748b;">Interested In:</td>
                  <td style="padding: 8px 0;"><strong style="color: #2563eb;">${service}</strong></td>
                </tr>
                ` : ''}
              </table>
            </td>
          </tr>
          
          <!-- Message -->
          <tr>
            <td style="padding: 0 32px 32px;">
              <h2 style="margin: 0 0 16px; color: #0f172a; font-size: 18px; font-weight: 600;">Message</h2>
              <p style="margin: 0; padding: 16px; background-color: #f8fafc; border-radius: 8px; color: #475569; line-height: 1.6; white-space: pre-wrap;">${message}</p>
            </td>
          </tr>
          
          <!-- CTA -->
          <tr>
            <td style="padding: 0 32px 32px; text-align: center;">
              <a href="mailto:${email}?subject=Re: Your inquiry to Garment Decor" style="display: inline-block; padding: 14px 32px; background-color: #2563eb; color: #ffffff; text-decoration: none; font-weight: 600; border-radius: 8px;">Reply to ${name}</a>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #f8fafc; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0; color: #64748b; font-size: 12px;">This message was submitted via the contact form on garmentdecor.com</p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

export function generateContactNotificationText(props: ContactNotificationProps): string {
  const { name, email, phone, company, message, service } = props;

  return `
NEW CONTACT FORM SUBMISSION
============================

CONTACT INFORMATION
-------------------
Name: ${name}
Email: ${email}
${phone ? `Phone: ${phone}` : ''}
${company ? `Company: ${company}` : ''}
${service ? `Interested In: ${service}` : ''}

MESSAGE
-------
${message}

---
Reply to: ${email}
  `.trim();
}

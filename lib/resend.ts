import { Resend } from 'resend';

/** Lazy Resend client so build can succeed without RESEND_API_KEY (only created at request time). */
function getResend(): Resend {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    throw new Error('Missing API key. Set RESEND_API_KEY in your environment.');
  }
  return new Resend(key);
}

const FROM_EMAIL = 'Garment Decor <noreply@garmentdecor.com>';

// Email template wrapper with Soft Craft design
function emailWrapper(content: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Garment Decor</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #fafaf9;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fafaf9; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; border: 1px solid #e7e5e4; overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #070131 0%, #1a1852 100%); padding: 32px 40px; text-align: center;">
              <img src="https://www.garmentdecor.com/logo-white.png" alt="Garment Decor" width="180" style="display: inline-block;" />
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #fafaf9; padding: 24px 40px; border-top: 1px solid #e7e5e4;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="text-align: center;">
                    <p style="margin: 0 0 8px 0; font-size: 14px; color: #57534e;">
                      Garment Decor • Custom Screen Printing & Embroidery
                    </p>
                    <p style="margin: 0 0 8px 0; font-size: 12px; color: #78716c;">
                      4778 W. Mission Blvd, Montclair CA 91762
                    </p>
                    <p style="margin: 0; font-size: 12px; color: #78716c;">
                      <a href="tel:8559427636" style="color: #EE8935; text-decoration: none;">(855) 942-7636</a>
                      &nbsp;•&nbsp;
                      <a href="https://www.garmentdecor.com" style="color: #EE8935; text-decoration: none;">garmentdecor.com</a>
                    </p>
                  </td>
                </tr>
              </table>
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

// Application Received Email
export async function sendApplicationReceivedEmail(to: string, companyName: string) {
  const content = `
    <div style="text-align: center; margin-bottom: 32px;">
      <div style="display: inline-block; width: 64px; height: 64px; background-color: #fef3c7; border-radius: 50%; line-height: 64px;">
        <span style="font-size: 32px;">📋</span>
      </div>
    </div>
    <h1 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 700; color: #070131; text-align: center;">
      Application Received
    </h1>
    <p style="margin: 0 0 24px 0; font-size: 16px; color: #57534e; text-align: center; line-height: 1.6;">
      Thank you for applying for trade pricing for <strong>${companyName}</strong>. We've received your application and our team is reviewing it.
    </p>
    <div style="background-color: #fafaf9; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
      <h2 style="margin: 0 0 12px 0; font-size: 14px; font-weight: 600; color: #070131; text-transform: uppercase; letter-spacing: 0.5px;">
        What happens next?
      </h2>
      <ul style="margin: 0; padding: 0 0 0 20px; color: #57534e; font-size: 14px; line-height: 1.8;">
        <li>Our team will verify your business credentials</li>
        <li>We'll review your ASI/PPAI membership (if applicable)</li>
        <li>You'll receive a decision within 1-2 business days</li>
      </ul>
    </div>
    <p style="margin: 0; font-size: 14px; color: #78716c; text-align: center;">
      Questions? Reply to this email or call us at <a href="tel:8559427636" style="color: #EE8935; text-decoration: none;">(855) 942-7636</a>
    </p>
  `;

  try {
    const resend = getResend();
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: 'Trade Pricing Application Received - Garment Decor',
      html: emailWrapper(content),
    });

    if (error) {
      console.error('Failed to send application received email:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Failed to send application received email:', error);
    return { success: false, error };
  }
}

// Application Approved Email
export async function sendApplicationApprovedEmail(to: string, companyName: string) {
  const content = `
    <div style="text-align: center; margin-bottom: 32px;">
      <div style="display: inline-block; width: 64px; height: 64px; background-color: #dcfce7; border-radius: 50%; line-height: 64px;">
        <span style="font-size: 32px;">✅</span>
      </div>
    </div>
    <h1 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 700; color: #070131; text-align: center;">
      Welcome to Trade Pricing!
    </h1>
    <p style="margin: 0 0 24px 0; font-size: 16px; color: #57534e; text-align: center; line-height: 1.6;">
      Great news! Your trade pricing application for <strong>${companyName}</strong> has been approved. You now have access to wholesale distributor pricing.
    </p>
    <div style="background: linear-gradient(135deg, #fef7ed 0%, #fff7ed 100%); border: 1px solid #fed7aa; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
      <h2 style="margin: 0 0 12px 0; font-size: 14px; font-weight: 600; color: #070131; text-transform: uppercase; letter-spacing: 0.5px;">
        Your Trade Account Benefits
      </h2>
      <ul style="margin: 0; padding: 0 0 0 20px; color: #57534e; font-size: 14px; line-height: 1.8;">
        <li><strong>Wholesale pricing</strong> on all products</li>
        <li><strong>Dedicated account representative</strong></li>
        <li><strong>Priority quote turnaround</strong></li>
        <li><strong>Volume discounts</strong> on large orders</li>
      </ul>
    </div>
    <div style="text-align: center; margin-bottom: 24px;">
      <a href="https://www.garmentdecor.com/dashboard" style="display: inline-block; background-color: #EE8935; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px;">
        Go to Dashboard
      </a>
    </div>
    <p style="margin: 0; font-size: 14px; color: #78716c; text-align: center;">
      Ready to place your first order? <a href="https://www.garmentdecor.com/catalog" style="color: #EE8935; text-decoration: none;">Browse our catalog</a> or contact your rep.
    </p>
  `;

  try {
    const resend = getResend();
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: '🎉 Trade Pricing Approved - Welcome to Garment Decor',
      html: emailWrapper(content),
    });

    if (error) {
      console.error('Failed to send application approved email:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Failed to send application approved email:', error);
    return { success: false, error };
  }
}

// Application Needs More Info Email (softer language for "denied")
export async function sendApplicationDeniedEmail(to: string, companyName: string, reason?: string) {
  const reasonBlock = reason 
    ? `
      <div style="background-color: #fafaf9; border: 1px solid #e7e5e4; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
        <h2 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #070131;">
          Additional details:
        </h2>
        <p style="margin: 0; font-size: 14px; color: #57534e; line-height: 1.6;">
          ${reason}
        </p>
      </div>
    `
    : '';

  const content = `
    <div style="text-align: center; margin-bottom: 32px;">
      <div style="display: inline-block; width: 64px; height: 64px; background-color: #fef3c7; border-radius: 50%; line-height: 64px;">
        <span style="font-size: 32px;">💬</span>
      </div>
    </div>
    <h1 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 700; color: #070131; text-align: center;">
      Let's Connect
    </h1>
    <p style="margin: 0 0 24px 0; font-size: 16px; color: #57534e; text-align: center; line-height: 1.6;">
      Thank you for your interest in trade pricing for <strong>${companyName}</strong>. We need a bit more information to complete your application.
    </p>
    ${reasonBlock}
    <div style="background-color: #fafaf9; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
      <h2 style="margin: 0 0 12px 0; font-size: 14px; font-weight: 600; color: #070131;">
        We're here to help:
      </h2>
      <ul style="margin: 0; padding: 0 0 0 20px; color: #57534e; font-size: 14px; line-height: 1.8;">
        <li>Have additional documentation? Send it our way</li>
        <li>Questions about requirements? We'll walk you through it</li>
        <li>Prefer a quick call? We're happy to chat</li>
      </ul>
    </div>
    <div style="text-align: center; margin-bottom: 24px;">
      <a href="https://www.garmentdecor.com/contact" style="display: inline-block; background-color: #EE8935; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px;">
        Talk to Our Team
      </a>
    </div>
    <p style="margin: 0; font-size: 14px; color: #78716c; text-align: center;">
      Call us anytime at <a href="tel:8559427636" style="color: #EE8935; text-decoration: none;">(855) 942-7636</a> — we're happy to help!
    </p>
  `;

  try {
    const resend = getResend();
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: 'Let\'s Connect About Your Trade Application - Garment Decor',
      html: emailWrapper(content),
    });

    if (error) {
      console.error('Failed to send application denied email:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Failed to send application denied email:', error);
    return { success: false, error };
  }
}

// New Message Notification Email
export async function sendNewMessageEmail(
  to: string, 
  senderName: string, 
  messagePreview: string,
  isCustomer: boolean
) {
  const dashboardLink = isCustomer 
    ? 'https://www.garmentdecor.com/dashboard/messages'
    : 'https://www.garmentdecor.com/dashboard/rep/messages';

  const content = `
    <div style="text-align: center; margin-bottom: 32px;">
      <div style="display: inline-block; width: 64px; height: 64px; background-color: #dbeafe; border-radius: 50%; line-height: 64px;">
        <span style="font-size: 32px;">💬</span>
      </div>
    </div>
    <h1 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 700; color: #070131; text-align: center;">
      New Message from ${senderName}
    </h1>
    <div style="background-color: #fafaf9; border: 1px solid #e7e5e4; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
      <p style="margin: 0; font-size: 14px; color: #57534e; line-height: 1.6; font-style: italic;">
        "${messagePreview.length > 200 ? messagePreview.substring(0, 200) + '...' : messagePreview}"
      </p>
    </div>
    <div style="text-align: center; margin-bottom: 24px;">
      <a href="${dashboardLink}" style="display: inline-block; background-color: #EE8935; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px;">
        View Message
      </a>
    </div>
    <p style="margin: 0; font-size: 14px; color: #78716c; text-align: center;">
      Reply directly from your dashboard to continue the conversation.
    </p>
  `;

  try {
    const resend = getResend();
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `New message from ${senderName} - Garment Decor`,
      html: emailWrapper(content),
    });

    if (error) {
      console.error('Failed to send new message email:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Failed to send new message email:', error);
    return { success: false, error };
  }
}

// Quote Status Change Email
export async function sendQuoteStatusEmail(
  to: string, 
  quoteId: string, 
  newStatus: string,
  customerName: string
) {
  const statusMessages: Record<string, { title: string; description: string; emoji: string }> = {
    contacted: {
      title: 'We\'re Working on Your Quote',
      description: 'Our team has received your quote request and is preparing your pricing.',
      emoji: '📞',
    },
    quoted: {
      title: 'Your Quote is Ready!',
      description: 'Great news! We\'ve finished preparing your quote with detailed pricing.',
      emoji: '📋',
    },
    converted: {
      title: 'Order Confirmed',
      description: 'Thank you for your order! We\'re excited to get started on your project.',
      emoji: '🎉',
    },
  };

  const status = statusMessages[newStatus];
  if (!status) return { success: false, error: 'Unknown status' };

  const content = `
    <div style="text-align: center; margin-bottom: 32px;">
      <div style="display: inline-block; width: 64px; height: 64px; background-color: #fef3c7; border-radius: 50%; line-height: 64px;">
        <span style="font-size: 32px;">${status.emoji}</span>
      </div>
    </div>
    <h1 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 700; color: #070131; text-align: center;">
      ${status.title}
    </h1>
    <p style="margin: 0 0 8px 0; font-size: 14px; color: #78716c; text-align: center;">
      Quote #${quoteId}
    </p>
    <p style="margin: 0 0 24px 0; font-size: 16px; color: #57534e; text-align: center; line-height: 1.6;">
      Hi ${customerName.split(' ')[0]}, ${status.description}
    </p>
    <div style="text-align: center; margin-bottom: 24px;">
      <a href="https://www.garmentdecor.com/dashboard/quotes" style="display: inline-block; background-color: #EE8935; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px;">
        View Quote Details
      </a>
    </div>
    <p style="margin: 0; font-size: 14px; color: #78716c; text-align: center;">
      Questions? Reply to this email or contact your account rep.
    </p>
  `;

  try {
    const resend = getResend();
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `${status.emoji} ${status.title} - Quote #${quoteId}`,
      html: emailWrapper(content),
    });

    if (error) {
      console.error('Failed to send quote status email:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Failed to send quote status email:', error);
    return { success: false, error };
  }
}

// Sales Rep Assignment Email
export async function sendRepAssignmentEmail(
  to: string, 
  customerName: string,
  repName: string,
  repEmail: string,
  repPhone?: string | null,
  calendlyUrl?: string | null
) {
  const contactBlock = `
    <div style="background-color: #fafaf9; border: 1px solid #e7e5e4; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
      <h2 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: #070131;">
        Your Account Manager
      </h2>
      <p style="margin: 0 0 8px 0; font-size: 18px; font-weight: 600; color: #070131;">
        ${repName}
      </p>
      <p style="margin: 0 0 4px 0; font-size: 14px; color: #57534e;">
        <a href="mailto:${repEmail}" style="color: #EE8935; text-decoration: none;">${repEmail}</a>
      </p>
      ${repPhone ? `
        <p style="margin: 0; font-size: 14px; color: #57534e;">
          <a href="tel:${repPhone}" style="color: #EE8935; text-decoration: none;">${repPhone}</a>
        </p>
      ` : ''}
    </div>
  `;

  const content = `
    <div style="text-align: center; margin-bottom: 32px;">
      <div style="display: inline-block; width: 64px; height: 64px; background-color: #dcfce7; border-radius: 50%; line-height: 64px;">
        <span style="font-size: 32px;">👋</span>
      </div>
    </div>
    <h1 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 700; color: #070131; text-align: center;">
      Meet Your Dedicated Rep
    </h1>
    <p style="margin: 0 0 24px 0; font-size: 16px; color: #57534e; text-align: center; line-height: 1.6;">
      Hi ${customerName.split(' ')[0]}, we've assigned you a dedicated account manager who will be your go-to contact for quotes, orders, and any questions.
    </p>
    ${contactBlock}
    ${calendlyUrl ? `
      <div style="text-align: center; margin-bottom: 24px;">
        <a href="${calendlyUrl}" style="display: inline-block; background-color: #EE8935; color: #ffffff; font-size: 16px; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px;">
          Schedule a Call
        </a>
      </div>
    ` : ''}
    <p style="margin: 0; font-size: 14px; color: #78716c; text-align: center;">
      ${repName.split(' ')[0]} is here to help with pricing, timelines, and making sure your project is a success.
    </p>
  `;

  try {
    const resend = getResend();
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject: `Meet ${repName}, Your Dedicated Account Manager - Garment Decor`,
      html: emailWrapper(content),
    });

    if (error) {
      console.error('Failed to send rep assignment email:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Failed to send rep assignment email:', error);
    return { success: false, error };
  }
}

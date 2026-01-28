import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

/**
 * Resend Webhook Handler
 * 
 * Receives webhook events from Resend for email tracking:
 * - email.sent
 * - email.delivered
 * - email.opened
 * - email.clicked
 * - email.bounced
 * - email.complained
 * 
 * Setup in Resend Dashboard:
 * 1. Go to https://resend.com/webhooks
 * 2. Add endpoint: https://www.garmentdecor.com/api/webhooks/resend
 * 3. Select events: email.opened, email.clicked, email.bounced, email.delivered
 */

// Resend webhook event types
type ResendEventType = 
  | 'email.sent'
  | 'email.delivered'
  | 'email.delivery_delayed'
  | 'email.opened'
  | 'email.clicked'
  | 'email.bounced'
  | 'email.complained';

interface ResendWebhookPayload {
  type: ResendEventType;
  created_at: string;
  data: {
    email_id: string;
    from: string;
    to: string[];
    subject: string;
    created_at: string;
    // For click events
    click?: {
      link: string;
      timestamp: string;
    };
    // For bounce events
    bounce?: {
      message: string;
      timestamp: string;
    };
  };
}

export async function POST(request: NextRequest) {
  try {
    const payload: ResendWebhookPayload = await request.json();
    
    console.log(`[Resend Webhook] Received event: ${payload.type}`);
    
    const { type, data } = payload;
    const recipientEmail = data.to[0]?.toLowerCase();
    
    if (!recipientEmail) {
      console.log('[Resend Webhook] No recipient email found');
      return NextResponse.json({ received: true });
    }

    const supabase = createServerSupabaseClient() as any;

    // Handle different event types
    switch (type) {
      case 'email.opened': {
        // Update email_opened_at for the most recent exit capture with this email
        const { error } = await supabase
          .from('exit_captures')
          .update({ email_opened_at: new Date().toISOString() })
          .eq('email', recipientEmail)
          .is('email_opened_at', null)
          .not('email_sent_at', 'is', null)
          .order('email_sent_at', { ascending: false })
          .limit(1);
        
        if (error) {
          console.error('[Resend Webhook] Error updating email_opened_at:', error);
        } else {
          console.log(`[Resend Webhook] Marked email opened for ${recipientEmail}`);
        }
        break;
      }

      case 'email.clicked': {
        // Log click event - could extend to track specific links
        const link = payload.data.click?.link || 'unknown';
        console.log(`[Resend Webhook] Email clicked by ${recipientEmail}: ${link}`);
        
        // If they clicked the recovery link, it will be tracked via the recovery endpoint
        // But we can still log this for analytics
        break;
      }

      case 'email.bounced': {
        // Log bounce for monitoring
        const bounceMessage = payload.data.bounce?.message || 'Unknown bounce reason';
        console.error(`[Resend Webhook] Email bounced for ${recipientEmail}: ${bounceMessage}`);
        
        // Could extend to mark the email as bounced in the database
        // or add to a blocklist for future sends
        break;
      }

      case 'email.delivered': {
        console.log(`[Resend Webhook] Email delivered to ${recipientEmail}`);
        break;
      }

      case 'email.complained': {
        // User marked as spam - important to track
        console.error(`[Resend Webhook] SPAM COMPLAINT from ${recipientEmail}`);
        // Could add to a suppression list
        break;
      }

      default:
        console.log(`[Resend Webhook] Unhandled event type: ${type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[Resend Webhook] Error processing webhook:', error);
    
    // Return 200 anyway to prevent Resend from retrying
    // (we don't want to get hammered with retries for parse errors)
    return NextResponse.json({ received: true, error: 'Processing error' });
  }
}

// Resend may send a GET request to verify the endpoint
export async function GET() {
  return NextResponse.json({ 
    status: 'ok', 
    endpoint: 'Resend webhook handler',
    events: ['email.opened', 'email.clicked', 'email.bounced', 'email.delivered', 'email.complained']
  });
}

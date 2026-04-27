import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import {
  generateCheckoutLeadNotificationHtml,
  generateCheckoutLeadNotificationText,
  getCheckoutLeadSubject,
  CheckoutLeadNotificationProps,
} from '@/lib/emails/checkout-lead-notification';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

const NOTIFICATION_THRESHOLD = 100; // Only email team for carts >= $100

interface CaptureLeadRequest {
  email: string;
  phone: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  cartItems: Array<{
    sku: string;
    styleName: string;
    brandName: string;
    colorName: string;
    sizeName: string;
    quantity: number;
    unitPrice: number;
  }>;
  cartTotal: number;
  itemCount: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: CaptureLeadRequest = await request.json();
    const { email, phone, firstName, lastName, company, cartItems, cartTotal, itemCount } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    const supabase = getSupabase();
    const customerName = [firstName, lastName].filter(Boolean).join(' ') || '';

    // Upsert by email — insert new or update existing lead's cart data
    const { data: lead, error: upsertError } = await supabase
      .from('checkout_leads')
      .upsert(
        {
          email: email.toLowerCase().trim(),
          phone: phone || null,
          customer_name: customerName || null,
          company: company || null,
          cart_items: cartItems,
          cart_total: cartTotal,
          item_count: itemCount,
          source_url: request.headers.get('referer') || null,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'email',
          ignoreDuplicates: false,
        }
      )
      .select('id, created_at, updated_at, notified_at, status')
      .single();

    if (upsertError) {
      console.error('Error upserting checkout lead:', upsertError);
      return NextResponse.json({ ok: true }); // Silent fail for the client
    }

    // Determine if this is a brand-new lead (created_at ~= updated_at, within 2 seconds)
    const isNew = lead &&
      !lead.notified_at &&
      lead.status === 'new' &&
      Math.abs(new Date(lead.created_at).getTime() - new Date(lead.updated_at).getTime()) < 2000;

    // Send team notification only for new leads with cart value >= threshold
    if (isNew && cartTotal >= NOTIFICATION_THRESHOLD) {
      try {
        const resend = getResend();
        const notificationProps: CheckoutLeadNotificationProps = {
          email,
          phone,
          customerName,
          company: company || undefined,
          cartItems,
          cartTotal,
          itemCount,
          createdAt: new Date().toLocaleString('en-US', {
            timeZone: 'America/Los_Angeles',
            dateStyle: 'short',
            timeStyle: 'short',
          }),
        };

        await resend.emails.send({
          from: 'Garment Decor Leads <orders@garmentdecor.com>',
          to: process.env.TEAM_EMAIL || 'team@garmentdecor.com',
          subject: getCheckoutLeadSubject(cartTotal, itemCount),
          html: generateCheckoutLeadNotificationHtml(notificationProps),
          text: generateCheckoutLeadNotificationText(notificationProps),
        });

        // Mark as notified
        await supabase
          .from('checkout_leads')
          .update({ notified_at: new Date().toISOString() })
          .eq('id', lead.id);
      } catch (emailErr) {
        console.error('Failed to send lead notification email:', emailErr);
        // Don't fail the response
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Error in capture-lead:', err);
    // Always return 200 to avoid blocking checkout
    return NextResponse.json({ ok: true });
  }
}

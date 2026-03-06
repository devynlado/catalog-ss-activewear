import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import {
  generateOrderNotificationHtml,
  generateOrderNotificationText,
  getOrderNotificationSubject,
  OrderNotificationProps,
} from '@/lib/emails/order-notification';
import { LOGO_URLS } from '@/lib/emails/components';

// Lazy initialization to avoid build-time errors
function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: NextRequest) {
  const resend = getResend();
  const supabase = getSupabase();
  try {
    const { orderId, paymentIntentId } = await request.json();

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Fetch order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      console.error('Error fetching order:', orderError);
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items = Array.isArray(order.items) ? order.items : [];
    const shippingAddress = order.shipping_address as {
      firstName?: string;
      lastName?: string;
      company?: string;
      address?: string;
      apartment?: string;
      city?: string;
      state?: string;
      zipCode?: string;
    } | null;

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.garmentdecor.com';

    // Generate items HTML for customer email
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const itemsHtml = items.map((item: any) => `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
          <strong>${item.brandName} ${item.styleName}</strong><br>
          <span style="color: #6b7280; font-size: 14px;">${item.colorName} / ${item.sizeName}</span><br>
          <span style="color: #6b7280; font-size: 14px;">Qty: ${item.quantity} × $${(item.discountedPrice ?? item.unitPrice)?.toFixed(2)}</span>
        </td>
        <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600;">
          $${((item.discountedPrice ?? item.unitPrice) * item.quantity).toFixed(2)}
        </td>
      </tr>
    `).join('');

    // Format shipping address for customer email
    const formattedAddress = shippingAddress 
      ? `${shippingAddress.firstName || ''} ${shippingAddress.lastName || ''}<br>
         ${shippingAddress.company ? shippingAddress.company + '<br>' : ''}
         ${shippingAddress.address || ''}<br>
         ${shippingAddress.apartment ? shippingAddress.apartment + '<br>' : ''}
         ${shippingAddress.city || ''}, ${shippingAddress.state || ''} ${shippingAddress.zipCode || ''}`
      : 'Address not available';

    // Send customer confirmation email (with PNG logo instead of SVG)
    const { error: customerSendError } = await resend.emails.send({
      from: 'Garment Decor <orders@garmentdecor.com>',
      to: order.customer_email,
      subject: `Order Confirmed - ${order.order_number}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px;">
          
          <div style="text-align: center; margin-bottom: 32px;">
            <img src="${LOGO_URLS.wordmarkDark}" alt="Garment Decor" style="height: 40px; max-width: 180px;">
          </div>

          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 32px;">
            <div style="font-size: 48px; margin-bottom: 8px;">✓</div>
            <h1 style="margin: 0; font-size: 24px; color: #166534;">Order Confirmed!</h1>
            <p style="margin: 8px 0 0; color: #15803d;">Thank you for your order</p>
          </div>

          <div style="background: #f8fafc; border-radius: 8px; padding: 16px; margin-bottom: 24px; text-align: center;">
            <p style="margin: 0; color: #64748b; font-size: 14px;">Order Number</p>
            <p style="margin: 4px 0 0; font-size: 20px; font-weight: 700; color: #0f172a;">${order.order_number}</p>
          </div>

          <h2 style="font-size: 18px; margin-bottom: 16px; color: #0f172a;">Order Summary</h2>
          
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
            ${itemsHtml}
          </table>

          <div style="border-top: 2px solid #e5e7eb; padding-top: 16px; margin-bottom: 24px;">
            <table style="width: 100%;">
              <tr>
                <td style="padding: 4px 0; color: #64748b;">Subtotal</td>
                <td style="padding: 4px 0; text-align: right;">$${order.subtotal?.toFixed(2)}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0; color: #64748b;">Shipping</td>
                <td style="padding: 4px 0; text-align: right;">${order.shipping_cost === 0 ? 'Free' : '$' + order.shipping_cost?.toFixed(2)}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0; color: #64748b;">Tax</td>
                <td style="padding: 4px 0; text-align: right;">$${order.tax_amount?.toFixed(2)}</td>
              </tr>
              <tr>
                <td style="padding: 12px 0 4px; font-weight: 700; font-size: 18px;">Total</td>
                <td style="padding: 12px 0 4px; text-align: right; font-weight: 700; font-size: 18px; color: #ea580c;">$${order.total?.toFixed(2)}</td>
              </tr>
            </table>
          </div>

          <h2 style="font-size: 18px; margin-bottom: 16px; color: #0f172a;">Shipping To</h2>
          <div style="background: #f8fafc; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
            <p style="margin: 0; color: #475569;">${formattedAddress}</p>
          </div>

          <h2 style="font-size: 18px; margin-bottom: 16px; color: #0f172a;">What's Next?</h2>
          <div style="background: #f8fafc; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
            <p style="margin: 0 0 8px; color: #475569;">
              <strong>1. Order Processing</strong> — We're preparing your items for shipment (within 24 hours)
            </p>
            <p style="margin: 0 0 8px; color: #475569;">
              <strong>2. Shipping</strong> — Your order will ship within 1-2 business days and you'll receive tracking info via email
            </p>
            <p style="margin: 0; color: #475569;">
              <strong>3. Delivery</strong> — Expected delivery in 3-5 business days
            </p>
          </div>

          <div style="text-align: center; padding: 20px; background: #f8fafc; border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 24px;">
            <p style="margin: 0 0 4px; font-weight: 600; color: #334155;">Did you know?</p>
            <p style="margin: 0 0 12px; color: #64748b; font-size: 14px;">
              We also offer screen printing, embroidery, and custom decoration services.
            </p>
            <a href="${siteUrl}/services" style="color: #ea580c; text-decoration: none; font-weight: 600; font-size: 14px;">
              Learn more →
            </a>
          </div>

          <div style="text-align: center; color: #64748b; font-size: 14px; border-top: 1px solid #e5e7eb; padding-top: 24px;">
            <p style="margin: 0 0 8px;">Questions? We're here to help!</p>
            <p style="margin: 0;">
              <a href="tel:+18559427636" style="color: #ea580c; text-decoration: none;">(855) 942-7636</a>
              &nbsp;•&nbsp;
              <a href="mailto:support@garmentdecor.com" style="color: #ea580c; text-decoration: none;">support@garmentdecor.com</a>
            </p>
          </div>

        </body>
        </html>
      `,
    });

    if (!customerSendError) {
      await supabase.from('order_activities').insert({
        order_id: orderId,
        activity_type: 'email_sent',
        details: {
          email_type: 'order_confirmation',
          subject: `Order Confirmed - ${order.order_number}`,
          recipient: order.customer_email,
        },
      });
    }

    // Build props for the new purchaser-friendly notification email
    const notificationProps: OrderNotificationProps = {
      orderNumber: order.order_number,
      customerName: order.customer_name || order.customer_email,
      customerEmail: order.customer_email,
      customerPhone: order.customer_phone || undefined,
      company: order.company || undefined,
      items: items.map((item: any) => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
        sku: item.sku || '',
        styleId: item.styleId,
        styleName: item.styleName || '',
        brandName: item.brandName || '',
        colorName: item.colorName || '',
        colorCode: item.colorCode,
        sizeName: item.sizeName || '',
        quantity: item.quantity || 1,
        unitPrice: item.unitPrice || 0,
        discountedPrice: item.discountedPrice,
      })),
      subtotal: order.subtotal || 0,
      shippingCost: order.shipping_cost || 0,
      taxAmount: order.tax_amount || 0,
      total: order.total || 0,
      shippingMethod: order.shipping_method || 'economy',
      shippingAddress: shippingAddress || {},
      poNumber: order.metadata?.po_number || order.po_number || undefined,
      notes: order.notes || undefined,
      paymentIntentId: paymentIntentId || order.stripe_payment_intent_id || undefined,
      createdAt: new Date().toLocaleString('en-US', {
        timeZone: 'America/Los_Angeles',
        dateStyle: 'full',
        timeStyle: 'short',
      }),
    };

    // Send purchaser-friendly team notification
    await resend.emails.send({
      from: 'Garment Decor Orders <orders@garmentdecor.com>',
      to: process.env.TEAM_EMAIL || 'team@garmentdecor.com',
      subject: getOrderNotificationSubject(order.order_number, order.total || 0),
      html: generateOrderNotificationHtml(notificationProps),
      text: generateOrderNotificationText(notificationProps),
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error sending order confirmation:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}

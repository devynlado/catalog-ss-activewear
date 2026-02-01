import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

const resend = new Resend(process.env.RESEND_API_KEY);

// Use service role for fetching order details
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { orderId } = await request.json();

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

    const items = Array.isArray(order.items) ? order.items : [];
    const shippingAddress = order.shipping_address as {
      firstName?: string;
      lastName?: string;
      address1?: string;
      address2?: string;
      city?: string;
      state?: string;
      zipCode?: string;
    } | null;

    // Generate items HTML
    const itemsHtml = items.map((item: any) => `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">
          <strong>${item.brandName} ${item.styleName}</strong><br>
          <span style="color: #6b7280; font-size: 14px;">${item.colorName} / ${item.sizeName}</span><br>
          <span style="color: #6b7280; font-size: 14px;">Qty: ${item.quantity} × $${item.unitPrice?.toFixed(2)}</span>
        </td>
        <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600;">
          $${(item.unitPrice * item.quantity).toFixed(2)}
        </td>
      </tr>
    `).join('');

    // Format shipping address
    const formattedAddress = shippingAddress 
      ? `${shippingAddress.firstName || ''} ${shippingAddress.lastName || ''}<br>
         ${shippingAddress.address1 || ''}<br>
         ${shippingAddress.address2 ? shippingAddress.address2 + '<br>' : ''}
         ${shippingAddress.city || ''}, ${shippingAddress.state || ''} ${shippingAddress.zipCode || ''}`
      : 'Address not available';

    // Send customer confirmation email
    await resend.emails.send({
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
            <img src="${process.env.NEXT_PUBLIC_SITE_URL}/images/brand/logo.svg" alt="Garment Decor" style="height: 40px;">
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
              <strong>1. Order Processing</strong> - We're preparing your order (within 24 hours)
            </p>
            <p style="margin: 0 0 8px; color: #475569;">
              <strong>2. Shipping</strong> - Your order will ship within 1-2 business days
            </p>
            <p style="margin: 0; color: #475569;">
              <strong>3. Delivery</strong> - Expected delivery in 3-5 business days
            </p>
          </div>

          <div style="text-align: center; padding: 24px; background: #fef3c7; border-radius: 8px; margin-bottom: 24px;">
            <p style="margin: 0 0 8px; font-weight: 600; color: #92400e;">Need these decorated next time?</p>
            <p style="margin: 0 0 16px; color: #a16207; font-size: 14px;">
              We offer screen printing, embroidery, and more!
            </p>
            <a href="${process.env.NEXT_PUBLIC_SITE_URL}/services" style="display: inline-block; background: #ea580c; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
              Explore Our Services
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

    // Send team notification
    await resend.emails.send({
      from: 'Garment Decor Orders <orders@garmentdecor.com>',
      to: process.env.TEAM_EMAIL || 'team@garmentdecor.com',
      subject: `🎉 New Order - ${order.order_number} - $${order.total?.toFixed(2)}`,
      html: `
        <h2>New Order Received!</h2>
        <p><strong>Order:</strong> ${order.order_number}</p>
        <p><strong>Customer:</strong> ${order.customer_name || order.customer_email}</p>
        <p><strong>Email:</strong> ${order.customer_email}</p>
        <p><strong>Total:</strong> $${order.total?.toFixed(2)}</p>
        <p><strong>Items:</strong> ${items.length}</p>
        ${order.po_number ? `<p><strong>PO Number:</strong> ${order.po_number}</p>` : ''}
      `,
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

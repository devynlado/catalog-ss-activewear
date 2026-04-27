import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import jsPDF from 'jspdf';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

interface OrderItem {
  brandName?: string;
  styleName?: string;
  sku?: string;
  colorName?: string;
  sizeName?: string;
  quantity?: number;
  unitPrice?: number;
  discountedPrice?: number;
}

interface ShippingAddress {
  firstName?: string;
  lastName?: string;
  company?: string;
  address?: string;
  apartment?: string;
  city?: string;
  state?: string;
  zipCode?: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  const { orderNumber } = await params;
  const supabase = getSupabase();

  try {
    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .eq('order_number', orderNumber)
      .single();

    if (error || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const items: OrderItem[] = Array.isArray(order.items) ? order.items : [];
    const shipping = (order.shipping_address || {}) as ShippingAddress;

    const doc = new jsPDF({ unit: 'pt', format: 'letter' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 50;
    const contentWidth = pageWidth - margin * 2;
    let y = 50;

    // --- Header ---
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42); // navy-800
    doc.text('INVOICE', margin, y);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text('Garment Decor', pageWidth - margin, y - 10, { align: 'right' });
    doc.text('4778 W. Mission Blvd', pageWidth - margin, y + 4, { align: 'right' });
    doc.text('Montclair, CA 91762', pageWidth - margin, y + 18, { align: 'right' });
    doc.text('(855) 942-7636', pageWidth - margin, y + 32, { align: 'right' });
    doc.text('info@garmentdecor.com', pageWidth - margin, y + 46, { align: 'right' });

    y += 70;

    // Divider
    doc.setDrawColor(231, 229, 228); // stone-200
    doc.setLineWidth(1);
    doc.line(margin, y, pageWidth - margin, y);
    y += 24;

    // --- Order Info ---
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('Order Number:', margin, y);
    doc.setFont('helvetica', 'normal');
    doc.text(order.order_number, margin + 90, y);

    doc.setFont('helvetica', 'bold');
    doc.text('Date:', margin + 260, y);
    doc.setFont('helvetica', 'normal');
    const orderDate = new Date(order.created_at).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    doc.text(orderDate, margin + 290, y);

    y += 18;

    if (order.po_number) {
      doc.setFont('helvetica', 'bold');
      doc.text('PO Number:', margin, y);
      doc.setFont('helvetica', 'normal');
      doc.text(order.po_number, margin + 90, y);
      y += 18;
    }

    y += 12;

    // --- Bill To / Ship To ---
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text('BILL TO', margin, y);
    doc.text('SHIP TO', margin + 260, y);

    y += 16;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);

    const customerName = order.customer_name || order.customer_email;
    doc.text(customerName, margin, y);
    const shipName = `${shipping.firstName || ''} ${shipping.lastName || ''}`.trim();
    doc.text(shipName || customerName, margin + 260, y);
    y += 14;

    if (order.company) {
      doc.text(order.company, margin, y);
      y += 14;
    }

    doc.text(order.customer_email, margin, y);
    if (shipping.address) {
      const aptStr = shipping.apartment ? `, ${shipping.apartment}` : '';
      doc.text(`${shipping.address}${aptStr}`, margin + 260, y);
    }
    y += 14;

    if (order.customer_phone) {
      doc.text(order.customer_phone, margin, y);
    }
    if (shipping.city) {
      doc.text(
        `${shipping.city}, ${shipping.state || ''} ${shipping.zipCode || ''}`,
        margin + 260,
        y
      );
    }
    y += 30;

    // --- Items Table ---
    // Table header
    const colProduct = margin;
    const colSku = margin + 200;
    const colQty = margin + 310;
    const colPrice = margin + 370;
    const colTotal = pageWidth - margin;

    doc.setFillColor(248, 250, 252); // slate-50
    doc.rect(margin, y - 4, contentWidth, 20, 'F');

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139);
    doc.text('PRODUCT', colProduct + 8, y + 10);
    doc.text('SKU', colSku, y + 10);
    doc.text('QTY', colQty, y + 10, { align: 'center' });
    doc.text('PRICE', colPrice, y + 10, { align: 'right' });
    doc.text('TOTAL', colTotal - 8, y + 10, { align: 'right' });

    y += 24;

    // Table rows
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(9);

    for (const item of items) {
      // Check if we need a new page
      if (y > 680) {
        doc.addPage();
        y = 50;
      }

      const price = item.discountedPrice ?? item.unitPrice ?? 0;
      const qty = item.quantity || 1;
      const lineTotal = price * qty;
      const productName = `${item.brandName || ''} ${item.styleName || ''}`.trim();
      const colorSize = `${item.colorName || ''} / ${item.sizeName || ''}`;

      doc.setFont('helvetica', 'bold');
      doc.text(productName || 'Product', colProduct + 8, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(colorSize, colProduct + 8, y + 12);
      doc.setTextColor(15, 23, 42);

      doc.text(item.sku || '', colSku, y);
      doc.text(String(qty), colQty, y, { align: 'center' });
      doc.text(`$${price.toFixed(2)}`, colPrice, y, { align: 'right' });
      doc.setFont('helvetica', 'bold');
      doc.text(`$${lineTotal.toFixed(2)}`, colTotal - 8, y, { align: 'right' });
      doc.setFont('helvetica', 'normal');

      y += 28;

      // Light divider between rows
      doc.setDrawColor(245, 245, 244); // stone-100
      doc.line(margin, y - 6, pageWidth - margin, y - 6);
    }

    y += 10;

    // --- Totals ---
    const totalsX = margin + 310;

    doc.setDrawColor(231, 229, 228);
    doc.setLineWidth(1);
    doc.line(totalsX, y, pageWidth - margin, y);
    y += 18;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Subtotal', totalsX, y);
    doc.setTextColor(15, 23, 42);
    doc.text(`$${Number(order.subtotal || 0).toFixed(2)}`, colTotal - 8, y, { align: 'right' });
    y += 18;

    doc.setTextColor(100, 116, 139);
    doc.text('Shipping', totalsX, y);
    doc.setTextColor(15, 23, 42);
    const shippingCost = Number(order.shipping_cost || 0);
    doc.text(shippingCost === 0 ? 'FREE' : `$${shippingCost.toFixed(2)}`, colTotal - 8, y, { align: 'right' });
    y += 18;

    doc.setTextColor(100, 116, 139);
    doc.text('Tax', totalsX, y);
    doc.setTextColor(15, 23, 42);
    doc.text(`$${Number(order.tax_amount || 0).toFixed(2)}`, colTotal - 8, y, { align: 'right' });
    y += 24;

    doc.setDrawColor(15, 23, 42);
    doc.setLineWidth(1.5);
    doc.line(totalsX, y - 6, pageWidth - margin, y - 6);

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('Total', totalsX, y + 8);
    doc.text(`$${Number(order.total || 0).toFixed(2)}`, colTotal - 8, y + 8, { align: 'right' });

    y += 50;

    // --- Footer ---
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text('Thank you for your business!', pageWidth / 2, y, { align: 'center' });
    doc.text('Garment Decor • garmentdecor.com • (855) 942-7636', pageWidth / 2, y + 14, { align: 'center' });

    // Generate PDF buffer
    const pdfOutput = doc.output('arraybuffer');

    return new NextResponse(pdfOutput, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Invoice-${orderNumber}.pdf"`,
      },
    });
  } catch (err) {
    console.error('Error generating invoice:', err);
    return NextResponse.json({ error: 'Failed to generate invoice' }, { status: 500 });
  }
}

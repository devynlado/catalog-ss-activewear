import { NextRequest, NextResponse } from 'next/server';
import { QuoteSubmission } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body: QuoteSubmission = await request.json();

    // Validate required fields
    if (!body.items || body.items.length === 0) {
      return NextResponse.json(
        { error: 'Quote must contain at least one item' },
        { status: 400 }
      );
    }

    if (!body.contact?.email || !body.contact?.name) {
      return NextResponse.json(
        { error: 'Contact name and email are required' },
        { status: 400 }
      );
    }

    // Calculate totals
    const subtotal = body.items.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0
    );
    const totalItems = body.items.reduce(
      (sum, item) => sum + item.quantity,
      0
    );

    // Format the quote for email/logging
    const quoteData = {
      submittedAt: new Date().toISOString(),
      contact: body.contact,
      items: body.items.map((item) => ({
        styleName: item.styleName,
        brandName: item.brandName,
        color: item.colorName,
        size: item.sizeName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineTotal: item.unitPrice * item.quantity,
      })),
      summary: {
        totalItems,
        subtotal,
      },
    };

    // Log the quote (in production, you'd send an email or save to database)
    console.log('=== NEW QUOTE SUBMISSION ===');
    console.log(JSON.stringify(quoteData, null, 2));
    console.log('============================');

    // In production, you would:
    // 1. Send email to QUOTE_EMAIL_TO using a service like SendGrid, Resend, etc.
    // 2. Save to database
    // 3. Send confirmation email to customer

    // For now, we'll simulate success
    // TODO: Implement actual email sending
    // const emailTo = process.env.QUOTE_EMAIL_TO;
    // await sendQuoteEmail(emailTo, quoteData);

    return NextResponse.json({
      success: true,
      message: 'Quote submitted successfully',
      quoteId: `QT-${Date.now()}`,
      summary: {
        totalItems,
        subtotal,
      },
    });
  } catch (error) {
    console.error('Error submitting quote:', error);
    return NextResponse.json(
      { error: 'Failed to submit quote' },
      { status: 500 }
    );
  }
}

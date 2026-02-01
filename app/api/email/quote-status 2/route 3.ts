import { NextRequest, NextResponse } from 'next/server';
import { sendQuoteStatusEmail } from '@/lib/resend';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, quoteId, newStatus, customerName } = body;

    if (!to || !quoteId || !newStatus || !customerName) {
      return NextResponse.json(
        { error: 'Missing required fields: to, quoteId, newStatus, customerName' },
        { status: 400 }
      );
    }

    const result = await sendQuoteStatusEmail(to, quoteId, newStatus, customerName);

    if (result.success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
  } catch (error) {
    console.error('Quote status email API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

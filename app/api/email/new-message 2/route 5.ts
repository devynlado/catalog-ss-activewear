import { NextRequest, NextResponse } from 'next/server';
import { sendNewMessageEmail } from '@/lib/resend';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, senderName, messagePreview, isCustomer } = body;

    if (!to || !senderName || !messagePreview) {
      return NextResponse.json(
        { error: 'Missing required fields: to, senderName, messagePreview' },
        { status: 400 }
      );
    }

    const result = await sendNewMessageEmail(to, senderName, messagePreview, isCustomer ?? true);

    if (result.success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
  } catch (error) {
    console.error('New message email API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

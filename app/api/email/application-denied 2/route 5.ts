import { NextResponse } from 'next/server';
import { sendApplicationDeniedEmail } from '@/lib/resend';

export async function POST(request: Request) {
  try {
    const { email, companyName, reason } = await request.json();

    if (!email || !companyName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const result = await sendApplicationDeniedEmail(email, companyName, reason);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Email API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

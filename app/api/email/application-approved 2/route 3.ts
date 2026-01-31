import { NextResponse } from 'next/server';
import { sendApplicationApprovedEmail } from '@/lib/resend';

export async function POST(request: Request) {
  try {
    const { email, companyName } = await request.json();

    if (!email || !companyName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const result = await sendApplicationApprovedEmail(email, companyName);

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

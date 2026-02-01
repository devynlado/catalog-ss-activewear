import { NextRequest, NextResponse } from 'next/server';
import { sendRepAssignmentEmail } from '@/lib/resend';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, customerName, repName, repEmail, repPhone, calendlyUrl } = body;

    if (!to || !customerName || !repName || !repEmail) {
      return NextResponse.json(
        { error: 'Missing required fields: to, customerName, repName, repEmail' },
        { status: 400 }
      );
    }

    const result = await sendRepAssignmentEmail(
      to, 
      customerName, 
      repName, 
      repEmail, 
      repPhone, 
      calendlyUrl
    );

    if (result.success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
  } catch (error) {
    console.error('Rep assignment email API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

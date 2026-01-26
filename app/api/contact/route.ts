import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { 
  generateContactNotificationHtml, 
  generateContactNotificationText 
} from '@/lib/emails/contact-notification';
import { createServerSupabaseClient } from '@/lib/supabase';

// Initialize Resend lazily to avoid module-level errors
function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  message: string;
  service?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ContactFormData = await request.json();

    // Validate required fields
    if (!body.name?.trim()) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    if (!body.email?.trim()) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    if (!body.message?.trim()) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Send notification email to team
    const resend = getResend();
    const teamEmail = process.env.QUOTE_EMAIL_TO || 'info@garmentdecor.com';
    
    await resend.emails.send({
      from: 'Garment Decor <info@garmentdecor.com>',
      to: teamEmail,
      subject: `New Contact: ${body.name}${body.service ? ` - ${body.service}` : ''}`,
      html: generateContactNotificationHtml({
        name: body.name,
        email: body.email,
        phone: body.phone,
        company: body.company,
        message: body.message,
        service: body.service,
      }),
      text: generateContactNotificationText({
        name: body.name,
        email: body.email,
        phone: body.phone,
        company: body.company,
        message: body.message,
        service: body.service,
      }),
      replyTo: body.email,
    });

    // Save to Supabase
    try {
      const supabase = createServerSupabaseClient();
      await supabase.from('contacts').insert({
        name: body.name,
        email: body.email,
        phone: body.phone || null,
        company: body.company || null,
        service: body.service || null,
        message: body.message,
        status: 'new',
      });
      console.log(`Contact saved to Supabase for ${body.email}`);
    } catch (dbError) {
      // Log but don't fail - email was already sent
      console.error('Failed to save contact to Supabase:', dbError);
    }

    // Log success for monitoring
    console.log(`Contact form submitted by ${body.email}`);

    return NextResponse.json({
      success: true,
      message: 'Message sent successfully',
    });
  } catch (error) {
    console.error('Error submitting contact form:', error);
    
    return NextResponse.json(
      { error: 'Failed to send message. Please try again or call us at (855) 942-7636.' },
      { status: 500 }
    );
  }
}

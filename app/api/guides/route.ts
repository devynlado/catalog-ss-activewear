import { NextRequest, NextResponse } from 'next/server';

type GuideType = 'screen-printing' | 'embroidery';

interface GuideRequest {
  email: string;
  guide: GuideType;
}

export async function POST(request: NextRequest) {
  console.log('[GUIDES API] Request received');
  
  try {
    const body: GuideRequest = await request.json();
    console.log('[GUIDES API] Body:', body);

    // Validate email
    if (!body.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
      return NextResponse.json(
        { error: 'Please provide a valid email address' },
        { status: 400 }
      );
    }

    // Validate guide type
    if (!body.guide || !['screen-printing', 'embroidery'].includes(body.guide)) {
      return NextResponse.json(
        { error: 'Please specify a valid guide type' },
        { status: 400 }
      );
    }

    // Try to send email via Resend
    let emailSent = false;
    try {
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);
      
      const guideConfig = {
        'screen-printing': {
          subject: 'Your Screen Printing Prep Guide - Garment Decor',
        },
        'embroidery': {
          subject: 'Your Embroidery Prep Guide - Garment Decor',
        },
      };

      const config = guideConfig[body.guide];

      // Dynamically import email templates
      let htmlContent: string;
      let textContent: string;
      
      if (body.guide === 'screen-printing') {
        const { generateScreenPrintingGuideHtml, generateScreenPrintingGuideText } = 
          await import('@/lib/emails/screen-printing-guide');
        htmlContent = generateScreenPrintingGuideHtml();
        textContent = generateScreenPrintingGuideText();
      } else {
        const { generateEmbroideryGuideHtml, generateEmbroideryGuideText } = 
          await import('@/lib/emails/embroidery-guide');
        htmlContent = generateEmbroideryGuideHtml();
        textContent = generateEmbroideryGuideText();
      }

      await resend.emails.send({
        from: 'Garment Decor <guides@garmentdecor.com>',
        to: body.email,
        subject: config.subject,
        html: htmlContent,
        text: textContent,
      });
      
      emailSent = true;
      console.log(`[GUIDES API] Email sent to ${body.email}`);
    } catch (emailError) {
      console.error('[GUIDES API] Email error:', emailError);
    }

    // Try to save to Supabase
    try {
      const { createServerSupabaseClient } = await import('@/lib/supabase');
      // Cast to any to bypass strict Supabase table typing
      const supabase = createServerSupabaseClient() as any;
      
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { data: existing } = await supabase
        .from('exit_captures')
        .select('id')
        .eq('email', body.email)
        .eq('page_url', `/resources/${body.guide}-guide`)
        .gte('created_at', twentyFourHoursAgo)
        .limit(1);

      if (!existing || existing.length === 0) {
        await supabase.from('exit_captures').insert({
          email: body.email,
          page_url: `/resources/${body.guide}-guide`,
          source: `${body.guide}-guide-download`,
        });
      }
      
      console.log(`[GUIDES API] Saved to Supabase: ${body.email}`);
    } catch (dbError) {
      console.error('[GUIDES API] Supabase error:', dbError);
    }

    // Send team notification
    try {
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);
      const teamEmail = process.env.QUOTE_EMAIL_TO || 'info@garmentdecor.com';
      const serviceName = body.guide === 'screen-printing' ? 'Screen Printing' : 'Embroidery';
      
      await resend.emails.send({
        from: 'Garment Decor <guides@garmentdecor.com>',
        to: teamEmail,
        subject: `New ${serviceName} Guide Download - ${body.email}`,
        text: `New guide download:\n\nEmail: ${body.email}\nGuide: ${serviceName}\nTime: ${new Date().toLocaleString()}`,
        html: `<div style="font-family: sans-serif; padding: 20px;">
          <h2>New Guide Download</h2>
          <p><strong>Email:</strong> ${body.email}</p>
          <p><strong>Guide:</strong> ${serviceName}</p>
          <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
        </div>`,
      });
      console.log('[GUIDES API] Team notification sent');
    } catch (teamError) {
      console.error('[GUIDES API] Team notification error:', teamError);
    }

    return NextResponse.json({
      success: true,
      message: emailSent 
        ? 'Guide sent successfully! Check your inbox.' 
        : 'Guide unlocked! (Email delivery may be delayed)',
    });
  } catch (error) {
    console.error('[GUIDES API] Error:', error);
    
    return NextResponse.json(
      { error: 'Failed to send guide. Please try again.' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';

interface CartItemSummary {
  name: string;
  color: string;
  size: string;
  quantity: number;
  sku: string;
}

interface DecorationQuoteRequest {
  decorationType: 'screen-print' | 'embroidery';
  description: string;
  email: string;
  phone?: string;
  totalUnits: number;
  cartItems: CartItemSummary[];
  artworkFileName?: string;
}

export async function POST(request: Request) {
  try {
    const body: DecorationQuoteRequest = await request.json();

    const {
      decorationType,
      description,
      email,
      phone,
      totalUnits,
      cartItems,
      artworkFileName,
    } = body;

    // Validate required fields
    if (!decorationType || !description || !email || !cartItems?.length) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Format cart items for email/notification
    const itemsList = cartItems.map(item => 
      `• ${item.name} - ${item.color} (${item.size}) × ${item.quantity}`
    ).join('\n');

    const decorationTypeLabel = decorationType === 'screen-print' 
      ? 'Screen Printing' 
      : 'Embroidery';

    // Build the quote message
    const quoteMessage = `
=== Custom Decoration Quote Request ===

Type: ${decorationTypeLabel}
Total Pieces: ${totalUnits}
Email: ${email}
Phone: ${phone || 'Not provided'}
Artwork: ${artworkFileName || 'None uploaded'}

Description:
${description}

Cart Items:
${itemsList}

================================
    `.trim();

    console.log('Decoration Quote Request:', quoteMessage);

    // TODO: In production, you would:
    // 1. Send an email notification to the sales team
    // 2. Create a quote record in the database
    // 3. Send a confirmation email to the customer
    
    // For now, we'll just log and return success
    // You can integrate with your existing email/notification system

    // Example: Send to your contact form endpoint or email service
    // await sendEmail({
    //   to: 'sales@garmentdecor.com',
    //   subject: `New ${decorationTypeLabel} Quote Request - ${totalUnits} pieces`,
    //   body: quoteMessage,
    //   replyTo: email,
    // });

    return NextResponse.json({
      success: true,
      message: 'Quote request submitted successfully',
    });

  } catch (error) {
    console.error('Error processing decoration quote:', error);
    return NextResponse.json(
      { error: 'Failed to submit quote request' },
      { status: 500 }
    );
  }
}

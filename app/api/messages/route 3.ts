import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, getServerProfile } from '@/lib/supabase-server';
import { sendNewMessageEmail } from '@/lib/resend';

// GET: Fetch messages for a conversation
export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const recipientId = searchParams.get('recipient_id');
    const quoteId = searchParams.get('quote_id');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!recipientId) {
      return NextResponse.json(
        { error: 'recipient_id is required' },
        { status: 400 }
      );
    }

    // Build query for conversation between current user and recipient
    let query = supabase
      .from('messages')
      .select(`
        *,
        sender:sender_id (
          id,
          full_name,
          avatar_url
        ),
        recipient:recipient_id (
          id,
          full_name,
          avatar_url
        )
      `)
      .or(`and(sender_id.eq.${user.id},recipient_id.eq.${recipientId}),and(sender_id.eq.${recipientId},recipient_id.eq.${user.id})`)
      .order('created_at', { ascending: true })
      .limit(limit);

    // Optionally filter by quote
    if (quoteId) {
      query = query.eq('quote_id', quoteId);
    }

    const { data: messages, error } = await query;

    if (error) {
      console.error('Error fetching messages:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Transform messages to include is_own flag
    const transformedMessages = messages?.map(msg => ({
      id: msg.id,
      content: msg.content,
      sender_id: msg.sender_id,
      sender_name: msg.sender?.full_name || 'Unknown',
      sender_avatar: msg.sender?.avatar_url,
      recipient_id: msg.recipient_id,
      quote_id: msg.quote_id,
      read_at: msg.read_at,
      created_at: msg.created_at,
      is_own: msg.sender_id === user.id,
    }));

    return NextResponse.json({ messages: transformedMessages });

  } catch (error) {
    console.error('Messages fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Send a new message
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { recipient_id, content, quote_id } = body;

    if (!recipient_id || !content) {
      return NextResponse.json(
        { error: 'recipient_id and content are required' },
        { status: 400 }
      );
    }

    // Get sender profile
    const { profile: senderProfile } = await getServerProfile();

    // Validate recipient exists and get their info
    const { data: recipient } = await supabase
      .from('profiles')
      .select('id, full_name, email, role')
      .eq('id', recipient_id)
      .single();

    if (!recipient) {
      return NextResponse.json(
        { error: 'Recipient not found' },
        { status: 404 }
      );
    }

    // Insert message
    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        sender_id: user.id,
        recipient_id,
        content: content.trim(),
        quote_id: quote_id || null,
      })
      .select(`
        *,
        sender:sender_id (
          id,
          full_name,
          avatar_url
        )
      `)
      .single();

    if (error) {
      console.error('Error sending message:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Send email notification (non-blocking)
    const senderName = senderProfile?.full_name || 'Someone';
    const isRecipientCustomer = recipient.role === 'customer';
    
    sendNewMessageEmail(
      recipient.email,
      senderName,
      content.trim(),
      isRecipientCustomer
    ).catch(err => console.error('Failed to send message notification email:', err));

    return NextResponse.json({
      message: {
        id: message.id,
        content: message.content,
        sender_id: message.sender_id,
        sender_name: message.sender?.full_name || 'Unknown',
        sender_avatar: message.sender?.avatar_url,
        recipient_id: message.recipient_id,
        quote_id: message.quote_id,
        created_at: message.created_at,
        is_own: true,
      }
    });

  } catch (error) {
    console.error('Message send error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

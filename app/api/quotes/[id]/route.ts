import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, getServerProfile } from '@/lib/supabase-server';
import { sendQuoteStatusEmail, sendRepAssignmentEmail } from '@/lib/resend';
import { logAdminActivity, type AdminAuditActor } from '@/lib/admin-audit';

const QUOTE_STATUS_LABELS: Record<string, string> = {
  new: 'New',
  contacted: 'Contacted',
  quoted: 'Quoted',
  converted: 'Converted',
  closed: 'Closed',
};

// GET: Fetch single quote with details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { profile } = await getServerProfile();
    
    // Only admins and sales reps can access
    if (!profile || !['admin', 'sales_rep'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: quote, error } = await supabase
      .from('quotes')
      .select(`
        *,
        customer:customer_id (
          id,
          full_name,
          email,
          phone,
          company,
          avatar_url,
          customer_type,
          verification_status
        ),
        assigned_rep:assigned_sales_rep_id (
          id,
          full_name,
          email,
          phone,
          avatar_url,
          calendly_url
        )
      `)
      .eq('id', params.id)
      .single();

    if (error || !quote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
    }

    return NextResponse.json({ quote });

  } catch (error) {
    console.error('Quote fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH: Update quote (status, notes, assignment)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { profile } = await getServerProfile();
    
    // Only admins and sales reps can update
    if (!profile || !['admin', 'sales_rep'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { status, admin_notes, assigned_sales_rep_id } = body;

    // Get current quote state for activity logging (including customer info for emails)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: currentQuote } = await supabase
      .from('quotes')
      .select(`
        status, 
        admin_notes, 
        assigned_sales_rep_id,
        quote_id,
        customer_email,
        customer_name,
        customer_id
      `)
      .eq('id', params.id)
      .single() as { data: any };

    if (!currentQuote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
    }

    // Build update object
    const updates: Record<string, any> = {};
    const activities: any[] = [];

    if (status && status !== currentQuote.status) {
      updates.status = status;
      activities.push({
        quote_id: params.id,
        user_id: user.id,
        activity_type: 'status_change',
        details: { from: currentQuote.status, to: status },
      });
    }

    if (admin_notes !== undefined && admin_notes !== currentQuote.admin_notes) {
      updates.admin_notes = admin_notes;
      activities.push({
        quote_id: params.id,
        user_id: user.id,
        activity_type: 'note',
        details: { content: admin_notes },
      });
    }

    if (assigned_sales_rep_id !== undefined && assigned_sales_rep_id !== currentQuote.assigned_sales_rep_id) {
      updates.assigned_sales_rep_id = assigned_sales_rep_id || null;
      activities.push({
        quote_id: params.id,
        user_id: user.id,
        activity_type: 'assignment',
        details: { 
          from_rep_id: currentQuote.assigned_sales_rep_id, 
          to_rep_id: assigned_sales_rep_id || null 
        },
      });
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ message: 'No changes to update' });
    }

    // Update quote
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: quote, error } = await (supabase as any)
      .from('quotes')
      .update(updates)
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating quote:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Log activities
    if (activities.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('quote_activities').insert(activities);
    }

    // Audit log: emit human-readable summaries for staff actions
    const auditActor: AdminAuditActor = {
      id: profile.id,
      full_name: profile.full_name,
      role: profile.role as 'admin' | 'sales_rep',
    };
    if (status && status !== currentQuote.status) {
      const fromLabel = QUOTE_STATUS_LABELS[currentQuote.status] ?? currentQuote.status;
      const toLabel = QUOTE_STATUS_LABELS[status] ?? status;
      await logAdminActivity(request, {
        action: 'quote.status_changed',
        resourceType: 'quote',
        resourceId: currentQuote.quote_id ?? params.id,
        summary: `changed a quote status from ${fromLabel} to ${toLabel}`,
        actor: auditActor,
      });
    }
    if (admin_notes !== undefined && admin_notes !== currentQuote.admin_notes) {
      await logAdminActivity(request, {
        action: 'quote.note_updated',
        resourceType: 'quote',
        resourceId: currentQuote.quote_id ?? params.id,
        summary: 'updated the internal note on a quote',
        actor: auditActor,
      });
    }
    if (assigned_sales_rep_id !== undefined && assigned_sales_rep_id !== currentQuote.assigned_sales_rep_id) {
      await logAdminActivity(request, {
        action: assigned_sales_rep_id ? 'quote.assigned' : 'quote.unassigned',
        resourceType: 'quote',
        resourceId: currentQuote.quote_id ?? params.id,
        summary: assigned_sales_rep_id
          ? 'assigned a sales rep to a quote'
          : 'removed the sales rep assignment from a quote',
        actor: auditActor,
      });
    }

    // Send email notifications (non-blocking)
    const customerEmail = currentQuote.customer_email;
    const customerName = currentQuote.customer_name || 'Customer';

    // Status change email
    if (status && status !== currentQuote.status && customerEmail) {
      sendQuoteStatusEmail(
        customerEmail,
        currentQuote.quote_id,
        status,
        customerName
      ).catch(err => console.error('Failed to send quote status email:', err));
    }

    // Rep assignment email (only if assigning a new rep, not removing)
    if (assigned_sales_rep_id && assigned_sales_rep_id !== currentQuote.assigned_sales_rep_id && customerEmail) {
      // Get rep details
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: repData } = await supabase
        .from('profiles')
        .select('full_name, email, phone, calendly_url')
        .eq('id', assigned_sales_rep_id)
        .single() as { data: any };

      if (repData) {
        sendRepAssignmentEmail(
          customerEmail,
          customerName,
          repData.full_name || 'Your Account Manager',
          repData.email,
          repData.phone,
          repData.calendly_url
        ).catch(err => console.error('Failed to send rep assignment email:', err));
      }
    }

    return NextResponse.json({ quote });

  } catch (error) {
    console.error('Quote update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

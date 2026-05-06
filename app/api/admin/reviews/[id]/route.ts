import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';
import { logAdminActivity } from '@/lib/admin-audit';

function getServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * PATCH /api/admin/reviews/[id]
 * Approve or reject a review, optionally add admin response
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const serviceSupabase = getServiceSupabase();

  const { data: profile } = await serviceSupabase
    .from('profiles')
    .select('id, full_name, role')
    .eq('id', user.id)
    .single();

  if (!profile || !['admin', 'sales_rep'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  const auditActor = {
    id: profile.id as string,
    full_name: (profile.full_name as string | null) ?? null,
    role: profile.role as 'admin' | 'sales_rep',
  };

  const body = await request.json();
  const { status, adminResponse } = body as {
    status?: 'approved' | 'rejected';
    adminResponse?: string;
  };

  if (!status && adminResponse === undefined) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
  }

  // Fetch the review first
  const { data: review, error: fetchError } = await serviceSupabase
    .from('reviews')
    .select('id, style_id, status, customer_email, reward_coupon_id')
    .eq('id', id)
    .single();

  if (fetchError || !review) {
    return NextResponse.json({ error: 'Review not found' }, { status: 404 });
  }

  const updates: Record<string, unknown> = {};
  if (status) updates.status = status;
  if (adminResponse !== undefined) updates.admin_response = adminResponse;

  const { error: updateError } = await serviceSupabase
    .from('reviews')
    .update(updates)
    .eq('id', id);

  if (updateError) {
    console.error('[Admin Reviews] Update error:', updateError);
    return NextResponse.json({ error: 'Failed to update review' }, { status: 500 });
  }

  // If status changed to approved or rejected, recalculate product aggregates
  if (status && status !== review.status) {
    const { error: rpcError } = await serviceSupabase
      .rpc('recalculate_review_aggregates', { p_style_id: review.style_id });

    if (rpcError) {
      // Fallback: manual calculation
      const { data } = await serviceSupabase
        .from('reviews')
        .select('rating')
        .eq('style_id', review.style_id)
        .eq('status', 'approved');

      if (data && data.length > 0) {
        const avg = data.reduce((s, r) => s + r.rating, 0) / data.length;
        await serviceSupabase
          .from('products')
          .update({ avg_rating: Math.round(avg * 100) / 100, review_count: data.length })
          .eq('style_id', review.style_id);
      } else {
        await serviceSupabase
          .from('products')
          .update({ avg_rating: null, review_count: 0 })
          .eq('style_id', review.style_id);
      }
    }
  }

  if (status && status !== review.status) {
    await logAdminActivity(request, {
      action: status === 'approved' ? 'review.approved' : 'review.rejected',
      resourceType: 'review',
      resourceId: id,
      summary: status === 'approved' ? 'approved a customer review' : 'rejected a customer review',
      actor: auditActor,
    });
  } else if (adminResponse !== undefined) {
    await logAdminActivity(request, {
      action: 'review.responded',
      resourceType: 'review',
      resourceId: id,
      summary: 'replied to a customer review',
      actor: auditActor,
    });
  }

  return NextResponse.json({ success: true, status: status || review.status });
}

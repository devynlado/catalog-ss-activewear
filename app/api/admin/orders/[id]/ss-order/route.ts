import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, getServerProfile } from '@/lib/supabase-server';
import { placeSSOrder } from '@/lib/ss-activewear-orders';
import { createClient } from '@supabase/supabase-js';
import { logAdminActivity } from '@/lib/admin-audit';

function getServiceSupabase() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!key) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key);
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { profile } = await getServerProfile();
  if (!profile || !['admin', 'sales_rep'].includes(profile.role)) {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  try {
    const serviceSupabase = getServiceSupabase();
    const result = await placeSSOrder(params.id, serviceSupabase);

    if (result.success) {
      await logAdminActivity(request, {
        action: 'order.ss_placed',
        resourceType: 'order',
        resourceId: params.id,
        summary: 'placed an SS Activewear supplier order',
        actor: {
          id: profile.id,
          full_name: profile.full_name,
          role: profile.role as 'admin' | 'sales_rep',
        },
      });
    }

    const httpStatus = result.success ? 200 : 422;
    return NextResponse.json(result, { status: httpStatus });
  } catch (error) {
    console.error('[SS Order] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to place SS order' },
      { status: 500 }
    );
  }
}

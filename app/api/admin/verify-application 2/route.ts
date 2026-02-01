import { NextResponse } from 'next/server';
import { createSupabaseServerClient, getServerProfile } from '@/lib/supabase-server';

export async function POST(request: Request) {
  try {
    const { applicationId, action, reason } = await request.json();

    if (!applicationId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!['approve', 'deny'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }

    // Verify admin access
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { profile } = await getServerProfile();
    
    if (!profile || profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Get the applicant's info for email
    const { data: applicant, error: fetchError } = await supabase
      .from('profiles')
      .select('email, company')
      .eq('id', applicationId)
      .single();

    if (fetchError || !applicant) {
      console.error('Failed to fetch applicant:', fetchError);
      return NextResponse.json(
        { error: 'Applicant not found' },
        { status: 404 }
      );
    }

    // Update the profile
    const updateData = action === 'approve'
      ? {
          customer_type: 'distributor',
          verification_status: 'approved',
          verified_at: new Date().toISOString(),
          verified_by: user.id,
        }
      : {
          verification_status: 'denied',
          verification_notes: reason || null,
          verified_at: new Date().toISOString(),
          verified_by: user.id,
        };

    const { error: updateError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', applicationId);

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update application' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      applicant: {
        email: applicant.email,
        company: applicant.company,
      }
    });
  } catch (error) {
    console.error('Verification API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getOrderSession } from '@/lib/order-session';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024;
const BUCKET = 'chat-attachments';

export async function POST(request: NextRequest) {
  const session = await getOrderSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { fileName, contentType } = body as { fileName: string; contentType: string };

  if (!fileName || !contentType) {
    return NextResponse.json({ error: 'fileName and contentType are required' }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(contentType)) {
    return NextResponse.json({ error: 'Only JPEG, PNG, or WebP images are allowed.' }, { status: 400 });
  }

  const ext = fileName.split('.').pop()?.toLowerCase() || 'jpg';
  const safeEmail = session.email.replace(/[^a-z0-9]/gi, '_');
  const safePath = `chat/${safeEmail}/${crypto.randomUUID()}.${ext}`;

  const supabase = getSupabase();

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUploadUrl(safePath);

  if (error) {
    console.error('[Chat Upload] Signed URL error:', error);
    return NextResponse.json({ error: 'Failed to create upload URL' }, { status: 500 });
  }

  const { data: publicUrlData } = supabase.storage.from(BUCKET).getPublicUrl(safePath);

  return NextResponse.json({
    signedUrl: data.signedUrl,
    token: data.token,
    path: safePath,
    publicUrl: publicUrlData.publicUrl,
    maxSize: MAX_SIZE,
  });
}

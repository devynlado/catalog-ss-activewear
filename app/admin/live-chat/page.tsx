import Link from 'next/link';
import { ArrowLeft, Zap } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { createSupabaseServerClient, getServerProfile } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import { LiveChatArchive, type LiveChatConversation } from './LiveChatArchive';

export const metadata = {
  title: 'Live Chat Leads | Admin',
  description: 'Archived LiveChat.com conversations and transcripts',
};

export default async function LiveChatArchivePage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { profile } = await getServerProfile();
  if (!profile || profile.role !== 'admin') {
    redirect('/dashboard');
  }

  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
  );

  const { data: conversations } = await db
    .from('live_chat_conversations')
    .select(
      'id, chat_id, customer_name, customer_email, customer_question, source_url, referrer, status, started_at, ended_at, message_count, created_at',
    )
    .order('created_at', { ascending: false })
    .limit(200);

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link
            href="/admin"
            className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-brand-600 transition-colors mb-3"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <Zap className="h-7 w-7 text-brand-500" />
            <div>
              <h1 className="text-2xl font-bold text-navy-800">Live Chat Leads</h1>
              <p className="text-sm text-slate-500">
                Archived LiveChat.com conversations from the public website
              </p>
            </div>
          </div>
        </div>

        <LiveChatArchive conversations={(conversations || []) as LiveChatConversation[]} />
      </div>
    </div>
  );
}

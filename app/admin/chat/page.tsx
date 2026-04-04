import Link from 'next/link';
import { ArrowLeft, MessageCircle } from 'lucide-react';
import { createSupabaseServerClient, getServerProfile } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import { ChatDashboard } from './ChatDashboard';

export const metadata = {
  title: 'Customer Chat | Admin',
  description: 'View and reply to customer chat messages',
};

export default async function AdminChatPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { profile } = await getServerProfile();
  if (!profile || !['admin', 'sales_rep'].includes(profile.role)) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link
            href="/admin/orders"
            className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-brand-600 transition-colors mb-3"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Orders
          </Link>
          <div className="flex items-center gap-3">
            <MessageCircle className="h-7 w-7 text-brand-500" />
            <div>
              <h1 className="text-2xl font-bold text-navy-800">Customer Chat</h1>
              <p className="text-sm text-slate-500">View and reply to all customer messages</p>
            </div>
          </div>
        </div>

        <ChatDashboard />
      </div>
    </div>
  );
}

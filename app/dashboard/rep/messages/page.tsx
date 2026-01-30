import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, MessageSquare, Search } from 'lucide-react';
import { createSupabaseServerClient, getServerProfile } from '@/lib/supabase-server';
import { RepConversationList } from './RepConversationList';

export const metadata = {
  title: 'Messages',
  description: 'View messages from your customers',
};

export default async function RepMessagesPage() {
  const supabase = await createSupabaseServerClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login');
  }

  const { profile } = await getServerProfile();
  
  // Security: Only sales reps can access
  if (!profile || profile.role !== 'sales_rep') {
    redirect('/dashboard');
  }

  // Get unique conversations (customers who have messaged this rep or been messaged by this rep)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: sentMessages } = await supabase
    .from('messages')
    .select('recipient_id')
    .eq('sender_id', user.id) as { data: any[] | null };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: receivedMessages } = await supabase
    .from('messages')
    .select('sender_id')
    .eq('recipient_id', user.id) as { data: any[] | null };

  // Get unique customer IDs
  const customerIds = new Set<string>();
  sentMessages?.forEach(m => customerIds.add(m.recipient_id));
  receivedMessages?.forEach(m => customerIds.add(m.sender_id));

  // Also add assigned customers who haven't messaged yet
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: assignedCustomers } = await supabase
    .from('profiles')
    .select('id')
    .eq('assigned_sales_rep_id', user.id)
    .eq('role', 'customer') as { data: any[] | null };

  assignedCustomers?.forEach(c => customerIds.add(c.id));

  // Get customer profiles
  let customers: any[] = [];
  if (customerIds.size > 0) {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, email, company, avatar_url')
      .in('id', Array.from(customerIds));
    
    customers = data || [];
  }

  // Get last message and unread count for each customer
  const conversationsWithMeta = await Promise.all(
    customers.map(async (customer) => {
      // Get last message
      const { data: lastMessages } = await supabase
        .from('messages')
        .select('content, created_at, sender_id')
        .or(`and(sender_id.eq.${user.id},recipient_id.eq.${customer.id}),and(sender_id.eq.${customer.id},recipient_id.eq.${user.id})`)
        .order('created_at', { ascending: false })
        .limit(1);

      // Get unread count
      const { count: unreadCount } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('sender_id', customer.id)
        .eq('recipient_id', user.id)
        .is('read_at', null);

      return {
        ...customer,
        lastMessage: lastMessages?.[0] || null,
        unreadCount: unreadCount || 0,
      };
    })
  );

  // Sort by last message time (most recent first)
  conversationsWithMeta.sort((a, b) => {
    if (!a.lastMessage && !b.lastMessage) return 0;
    if (!a.lastMessage) return 1;
    if (!b.lastMessage) return -1;
    return new Date(b.lastMessage.created_at).getTime() - new Date(a.lastMessage.created_at).getTime();
  });

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Back link */}
        <Link 
          href="/dashboard/rep" 
          className="mb-6 inline-flex items-center text-sm text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Link>

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-navy-800 sm:text-3xl">
            Messages
          </h1>
          <p className="mt-1 text-slate-600">
            Conversations with your assigned customers.
          </p>
        </div>

        {/* Conversation List */}
        {conversationsWithMeta.length > 0 ? (
          <RepConversationList 
            conversations={conversationsWithMeta}
            currentUserId={user.id}
          />
        ) : (
          <div className="rounded-xl border border-stone-200 bg-white p-12 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-stone-100">
              <MessageSquare className="h-8 w-8 text-stone-400" />
            </div>
            <h3 className="text-lg font-semibold text-navy-800">No messages yet</h3>
            <p className="mt-1 text-sm text-slate-600">
              Messages from your assigned customers will appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

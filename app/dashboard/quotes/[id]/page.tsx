import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Palette, MapPin, Clock, CheckCircle, Phone, FileText, MessageSquare } from 'lucide-react';
import { createSupabaseServerClient, getServerProfile } from '@/lib/supabase-server';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { SalesRepCard } from '@/components/admin/SalesRepCard';
import { CustomerQuoteMessenger } from './CustomerQuoteMessenger';
import { EditableQuoteItems } from './EditableQuoteItems';

export const metadata = {
  title: 'Quote Details',
  description: 'View your quote details and chat with your rep',
};

const statusConfig = {
  new: { label: 'Submitted', variant: 'warning' as const, icon: Clock, description: 'Your quote is awaiting review' },
  contacted: { label: 'In Progress', variant: 'info' as const, icon: Phone, description: 'Our team is preparing your pricing' },
  quoted: { label: 'Quote Ready', variant: 'brand' as const, icon: FileText, description: 'Your custom pricing is ready' },
  converted: { label: 'Order Placed', variant: 'success' as const, icon: CheckCircle, description: 'Thank you for your order!' },
  closed: { label: 'Closed', variant: 'default' as const, icon: Clock, description: 'This quote has expired' },
};

const decorationLabels: Record<string, string> = {
  none: 'No Decoration',
  screen: 'Screen Print',
  jumbo: 'Jumbo Screen Print',
  embroidery: 'Embroidery',
  digital: 'Digital Print',
};

interface QuoteItem {
  id: string;
  styleName: string;
  brandName: string;
  colorName: string;
  sizeName: string;
  quantity: number;
  unitPrice: number;
  imageUrl?: string;
}

export default async function CustomerQuoteDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createSupabaseServerClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login');
  }

  const { profile } = await getServerProfile();
  
  if (!profile) {
    redirect('/login');
  }

  // Fetch quote - must belong to this user
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: quote, error } = await supabase
    .from('quotes')
    .select(`
      *,
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
    .eq('customer_id', user.id)
    .single() as { data: any; error: any };

  if (error || !quote) {
    notFound();
  }

  // Mark messages as read for this quote
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('quote_id', params.id)
    .eq('recipient_id', user.id)
    .is('read_at', null);

  // Get assigned rep (either from quote or from profile)
  const assignedRep = quote.assigned_rep || null;
  
  // If no rep on quote, check profile
  let rep = assignedRep;
  if (!rep && profile.assigned_sales_rep_id) {
    const { data: profileRep } = await supabase
      .from('profiles')
      .select('id, full_name, email, phone, avatar_url, calendly_url')
      .eq('id', profile.assigned_sales_rep_id)
      .single();
    rep = profileRep;
  }

  // Mock rep for UI preview if no real rep exists
  if (!rep) {
    rep = {
      id: 'mock-rep',
      full_name: 'Sarah Mitchell',
      email: 'sarah@garmentdecor.com',
      phone: '(855) 942-7636',
      avatar_url: null,
      calendly_url: 'https://calendly.com/garmentdecor',
      title: 'Account Manager',
      years_experience: 5,
      specialties: ['Screen Printing', 'Rush Orders', 'Corporate'],
      response_time: '< 2 hours',
    };
  }

  // Determine if quote is editable (only when status is 'new')
  const isEditable = quote.status === 'new';

  const items: QuoteItem[] = Array.isArray(quote.items) ? quote.items : [];
  const totalQuantity = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
  
  const status = statusConfig[quote.status as keyof typeof statusConfig] || statusConfig.new;
  const StatusIcon = status.icon;
  
  const createdDate = new Date(quote.created_at).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const decoration = quote.decoration;
  const decorationType = decoration?.type ? decorationLabels[decoration.type] || decoration.type : null;

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Back link */}
        <Link 
          href="/dashboard" 
          className="mb-6 inline-flex items-center text-sm text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Link>

        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-navy-800">
              Quote {quote.quote_id}
            </h1>
            <Badge variant={status.variant} className="text-sm">
              {status.label}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-slate-600">
            Submitted {createdDate}
          </p>
        </div>

        {/* Status Banner */}
        <div className={`mb-6 rounded-xl border p-4 ${
          status.variant === 'success' ? 'border-green-200 bg-green-50' :
          status.variant === 'brand' ? 'border-brand-200 bg-brand-50' :
          status.variant === 'info' ? 'border-blue-200 bg-blue-50' :
          status.variant === 'warning' ? 'border-amber-200 bg-amber-50' :
          'border-stone-200 bg-stone-50'
        }`}>
          <div className="flex items-center gap-3">
            <StatusIcon className={`h-5 w-5 ${
              status.variant === 'success' ? 'text-green-600' :
              status.variant === 'brand' ? 'text-brand-600' :
              status.variant === 'info' ? 'text-blue-600' :
              status.variant === 'warning' ? 'text-amber-600' :
              'text-slate-600'
            }`} />
            <p className="font-medium text-slate-700">{status.description}</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="space-y-6 lg:col-span-2">
            {/* Editable Items */}
            <EditableQuoteItems 
              quoteId={quote.id}
              items={items}
              isEditable={isEditable}
            />

            {/* Request Changes CTA (for locked quotes) */}
            {!isEditable && quote.status !== 'converted' && quote.status !== 'closed' && (
              <div className="rounded-xl border border-stone-200 bg-stone-50 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <MessageSquare className="h-5 w-5 text-slate-400" />
                    <p className="text-sm text-slate-600">
                      Need to make changes? Message your rep to request updates.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Decoration */}
            {decoration && decoration.type !== 'none' && (
              <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold text-navy-800">Decoration</h2>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Palette className="h-5 w-5 text-slate-400" />
                    <span className="font-medium text-slate-700">{decorationType}</span>
                    {decoration.colors && (
                      <span className="text-slate-600">
                        • {decoration.colors} color{decoration.colors !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  
                  {decoration.locations && decoration.locations.length > 0 && (
                    <div className="flex items-start gap-3">
                      <MapPin className="mt-0.5 h-5 w-5 text-slate-400" />
                      <div>
                        <span className="font-medium text-slate-700">Locations:</span>
                        <div className="mt-1 flex flex-wrap gap-2">
                          {decoration.locations.map((loc: string) => (
                            <span 
                              key={loc}
                              className="rounded-full bg-stone-100 px-3 py-1 text-sm text-slate-600"
                            >
                              {loc.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Notes */}
            {quote.notes && (
              <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
                <h2 className="mb-3 text-lg font-semibold text-navy-800">Your Notes</h2>
                <p className="whitespace-pre-wrap text-slate-600">{quote.notes}</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Sales Rep Card */}
            <SalesRepCard 
              rep={rep}
              showActions={true}
              showEnhanced={true}
            />

            {/* Messenger */}
            <CustomerQuoteMessenger 
              quoteId={quote.id}
              repId={rep.id}
              repName={rep.full_name}
              repAvatar={rep.avatar_url}
              currentUserId={user.id}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Package, Palette, MapPin, User, Building2, Mail, Phone, Calendar, BadgeCheck } from 'lucide-react';
import { createSupabaseServerClient, getServerProfile } from '@/lib/supabase-server';
import { Badge } from '@/components/ui/Badge';
import { SalesRepCard } from '@/components/admin/SalesRepCard';
import { QuoteStatusActions } from './QuoteStatusActions';
import { QuoteActivityLog } from './QuoteActivityLog';
import { QuoteMessenger } from './QuoteMessenger';

export const metadata = {
  title: 'Quote Details',
  description: 'View and manage quote details',
};

const statusConfig = {
  new: { label: 'New', variant: 'warning' as const },
  contacted: { label: 'Contacted', variant: 'info' as const },
  quoted: { label: 'Quoted', variant: 'brand' as const },
  converted: { label: 'Converted', variant: 'success' as const },
  closed: { label: 'Closed', variant: 'default' as const },
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

export default async function QuoteDetailPage({
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
  
  // Security: Only admins and sales reps can access
  if (!profile || !['admin', 'sales_rep'].includes(profile.role)) {
    redirect('/dashboard');
  }

  // Fetch quote with related data
  const { data: quoteData, error } = await supabase
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

  if (error || !quoteData) {
    notFound();
  }

  // Type assertion for quote with nested relations
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const quote = quoteData as any;

  // Get sales reps for assignment
  const { data: salesReps } = await supabase
    .from('profiles')
    .select('id, full_name, email, avatar_url, calendly_url')
    .eq('role', 'sales_rep');

  const items: QuoteItem[] = Array.isArray(quote.items) ? quote.items : [];
  const totalQuantity = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
  
  const createdDate = new Date(quote.created_at).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  const decoration = quote.decoration;
  const decorationType = decoration?.type ? decorationLabels[decoration.type] || decoration.type : null;

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Back link */}
        <Link 
          href="/admin/quotes" 
          className="mb-6 inline-flex items-center text-sm text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Quotes
        </Link>

        {/* Header */}
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-navy-800 sm:text-3xl">
                {quote.quote_id}
              </h1>
              <Badge variant={statusConfig[quote.status as keyof typeof statusConfig]?.variant || 'default'}>
                {statusConfig[quote.status as keyof typeof statusConfig]?.label || quote.status}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-slate-600">
              Submitted {createdDate}
            </p>
          </div>

          <QuoteStatusActions 
            quoteId={quote.id}
            currentStatus={quote.status}
            salesReps={salesReps || []}
            currentRepId={quote.assigned_sales_rep_id}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content - 2 columns */}
          <div className="space-y-6 lg:col-span-2">
            {/* Customer Card */}
            <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-navy-800">Customer</h2>
              
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  {quote.customer?.avatar_url ? (
                    <Image
                      src={quote.customer.avatar_url}
                      alt={quote.customer.full_name || 'Customer'}
                      width={56}
                      height={56}
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-lg font-semibold text-brand-600">
                      {(quote.customer_name || quote.customer_email)?.[0]?.toUpperCase() || '?'}
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-navy-800">
                      {quote.customer?.full_name || quote.customer_name}
                    </h3>
                    {quote.customer?.customer_type === 'distributor' && (
                      <Badge variant="brand" className="text-xs">
                        <BadgeCheck className="mr-1 h-3 w-3" />
                        Trade
                      </Badge>
                    )}
                  </div>

                  <div className="mt-2 space-y-1">
                    {(quote.customer?.company || quote.company) && (
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Building2 className="h-4 w-4 text-slate-400" />
                        {quote.customer?.company || quote.company}
                      </div>
                    )}
                    <a 
                      href={`mailto:${quote.customer?.email || quote.customer_email}`}
                      className="flex items-center gap-2 text-sm text-brand-600 hover:text-brand-700"
                    >
                      <Mail className="h-4 w-4" />
                      {quote.customer?.email || quote.customer_email}
                    </a>
                    {(quote.customer?.phone || quote.customer_phone) && (
                      <a 
                        href={`tel:${quote.customer?.phone || quote.customer_phone}`}
                        className="flex items-center gap-2 text-sm text-brand-600 hover:text-brand-700"
                      >
                        <Phone className="h-4 w-4" />
                        {quote.customer?.phone || quote.customer_phone}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Items */}
            <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-navy-800">
                Items ({items.length})
              </h2>
              
              <div className="space-y-3">
                {items.map((item, index) => (
                  <div 
                    key={item.id || index}
                    className="flex items-center gap-4 rounded-lg border border-stone-100 bg-stone-50 p-4"
                  >
                    <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-white">
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt={item.styleName || 'Product'}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <Package className="h-6 w-6 text-stone-400" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-slate-800">
                        {item.brandName} {item.styleName}
                      </p>
                      <p className="text-sm text-slate-500">
                        {item.colorName} • {item.sizeName}
                      </p>
                      <p className="text-sm text-slate-600">
                        Qty: {item.quantity} × ${item.unitPrice?.toFixed(2) || '0.00'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-navy-800">
                        ${((item.unitPrice || 0) * (item.quantity || 0)).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Subtotal */}
              <div className="mt-4 flex items-center justify-between border-t border-stone-200 pt-4">
                <span className="text-slate-600">
                  Subtotal ({totalQuantity} pcs)
                </span>
                <span className="text-xl font-bold text-navy-800">
                  ${quote.subtotal?.toLocaleString() || '0'}
                </span>
              </div>
            </div>

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

                  {decoration.stitchCount && (
                    <div className="flex items-center gap-3">
                      <span className="text-slate-600">Stitch Count: {decoration.stitchCount}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Notes */}
            {quote.notes && (
              <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
                <h2 className="mb-3 text-lg font-semibold text-navy-800">Customer Notes</h2>
                <p className="whitespace-pre-wrap text-slate-600">{quote.notes}</p>
              </div>
            )}

            {/* Activity Log */}
            <QuoteActivityLog quoteId={quote.id} />
          </div>

          {/* Sidebar - 1 column */}
          <div className="space-y-6">
            {/* Assigned Sales Rep */}
            <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-navy-800">Assigned Rep</h2>
              
              {quote.assigned_rep ? (
                <SalesRepCard 
                  rep={quote.assigned_rep}
                  showActions={true}
                />
              ) : (
                <div className="text-center py-4">
                  <User className="mx-auto h-10 w-10 text-stone-300" />
                  <p className="mt-2 text-sm text-slate-500">No rep assigned</p>
                  <p className="text-xs text-slate-400">
                    Use the dropdown above to assign
                  </p>
                </div>
              )}
            </div>

            {/* Messenger */}
            {quote.customer_id && (
              <QuoteMessenger 
                quoteId={quote.id}
                customerId={quote.customer_id}
                customerName={quote.customer?.full_name || quote.customer_name}
                customerAvatar={quote.customer?.avatar_url}
                currentUserId={user.id}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

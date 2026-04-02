import { createClient } from '@supabase/supabase-js';
import { WriteReviewClient } from './WriteReviewClient';
import Link from 'next/link';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
}

export interface ReviewProduct {
  styleId: number;
  styleName: string;
  brandName: string;
  title: string;
  colorName: string;
  imageUrl: string;
  orderId: string;
  orderNumber: string;
}

interface PageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function WriteReviewPage({ searchParams }: PageProps) {
  const { token } = await searchParams;

  if (!token) {
    return <ErrorState message="No review token provided. Please use the link from your email." />;
  }

  const supabase = getSupabase();

  const { data: invite } = await supabase
    .from('review_invites')
    .select('id, order_id, customer_email, customer_name, token')
    .eq('token', token)
    .single();

  if (!invite) {
    return <ErrorState message="This review link is invalid or has expired. Please check your email for the correct link." />;
  }

  const { data: existingReview } = await supabase
    .from('reviews')
    .select('id')
    .eq('order_id', invite.order_id)
    .ilike('customer_email', invite.customer_email)
    .limit(1)
    .maybeSingle();

  if (existingReview) {
    return <ErrorState message="You've already submitted a review for this order. Thank you!" alreadyReviewed />;
  }

  const { data: order } = await supabase
    .from('orders')
    .select('id, order_number, items, customer_email, customer_name, status')
    .eq('id', invite.order_id)
    .single();

  if (!order) {
    return <ErrorState message="The order associated with this review link could not be found." />;
  }

  const items = order.items as Array<{
    type?: string;
    styleId?: number;
    styleName?: string;
    brandName?: string;
    productTitle?: string;
    colorName?: string;
    imageUrl?: string;
  }>;

  const products: ReviewProduct[] = (Array.isArray(items) ? items : [])
    .filter(item => item.type !== 'decoration' && item.styleId)
    .reduce<ReviewProduct[]>((acc, item) => {
      if (acc.some(p => p.styleId === item.styleId)) return acc;
      acc.push({
        styleId: item.styleId!,
        styleName: item.styleName || '',
        brandName: item.brandName || '',
        title: item.productTitle || `${item.brandName || ''} ${item.styleName || ''}`.trim(),
        colorName: item.colorName || '',
        imageUrl: item.imageUrl || '',
        orderId: order.id,
        orderNumber: order.order_number,
      });
      return acc;
    }, []);

  if (products.length === 0) {
    return <ErrorState message="No products found to review for this order." />;
  }

  const customerName = invite.customer_name || order.customer_name || null;

  return (
    <WriteReviewClient
      token={token}
      products={products}
      customerName={customerName}
      orderNumber={order.order_number}
    />
  );
}

function ErrorState({ message, alreadyReviewed }: { message: string; alreadyReviewed?: boolean }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-white flex items-center justify-center px-4">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-stone-100 border border-stone-200">
          <svg className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {alreadyReviewed ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            )}
          </svg>
        </div>
        <h1 className="text-xl font-bold text-navy-800 mb-2">
          {alreadyReviewed ? 'Review Already Submitted' : 'Unable to Load Review'}
        </h1>
        <p className="text-slate-500 mb-6">{message}</p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 transition-colors"
        >
          Go to Homepage
        </Link>
      </div>
    </div>
  );
}

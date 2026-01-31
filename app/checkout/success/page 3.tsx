import { Suspense } from 'react';
import Link from 'next/link';
import { CheckCircle, Package, Truck, Home, ArrowRight, Palette } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const metadata = {
  title: 'Order Confirmed | Garment Decor',
  description: 'Your order has been confirmed and is being processed.',
};

export default function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: { order?: string };
}) {
  const orderNumber = searchParams.order || 'Unknown';

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Success Animation */}
        <div className="text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
          
          <h1 className="mt-6 text-3xl font-bold text-navy-800">
            Order Confirmed!
          </h1>
          
          <p className="mt-2 text-lg text-slate-600">
            Thank you for your order
          </p>
          
          <div className="mt-4 inline-block rounded-lg bg-stone-100 px-4 py-2">
            <p className="text-sm text-slate-500">Order Number</p>
            <p className="text-xl font-bold text-navy-800">{orderNumber}</p>
          </div>
          
          <p className="mt-4 text-sm text-slate-500">
            A confirmation email has been sent to your email address.
          </p>
        </div>

        {/* Order Timeline */}
        <div className="mt-12 rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-navy-800 mb-6">What happens next?</h2>
          
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-slate-800">Order Received</p>
                <p className="text-sm text-slate-500">Just now</p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-stone-100">
                <Package className="h-5 w-5 text-slate-400" />
              </div>
              <div>
                <p className="font-medium text-slate-600">Processing & Quality Check</p>
                <p className="text-sm text-slate-500">Within 24 hours</p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-stone-100">
                <Truck className="h-5 w-5 text-slate-400" />
              </div>
              <div>
                <p className="font-medium text-slate-600">Shipped</p>
                <p className="text-sm text-slate-500">1-2 business days</p>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-stone-100">
                <Home className="h-5 w-5 text-slate-400" />
              </div>
              <div>
                <p className="font-medium text-slate-600">Delivered</p>
                <p className="text-sm text-slate-500">3-5 business days</p>
              </div>
            </div>
          </div>
        </div>

        {/* Cross-sell: Decorated Products */}
        <div className="mt-8 rounded-xl border border-brand-200 bg-brand-50/50 p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-brand-100">
              <Palette className="h-6 w-6 text-brand-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-navy-800">Need these decorated next time?</h3>
              <p className="mt-1 text-sm text-slate-600">
                We offer screen printing, embroidery, and more. Get a custom quote for your next order.
              </p>
              <Link href="/services" className="mt-3 inline-block">
                <Button variant="secondary" size="sm">
                  Explore Our Services
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/catalog">
            <Button variant="primary" size="lg">
              Continue Shopping
            </Button>
          </Link>
          <Link href="/">
            <Button variant="secondary" size="lg">
              Back to Home
            </Button>
          </Link>
        </div>

        {/* Support */}
        <div className="mt-12 text-center">
          <p className="text-sm text-slate-500">
            Questions about your order?{' '}
            <a href="tel:+18559427636" className="font-medium text-brand-600 hover:underline">
              Call (855) 942-7636
            </a>
            {' '}or{' '}
            <a href="mailto:support@garmentdecor.com" className="font-medium text-brand-600 hover:underline">
              email us
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

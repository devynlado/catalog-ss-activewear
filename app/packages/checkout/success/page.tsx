import { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle, Mail, Clock, FileImage, ArrowRight, Phone } from 'lucide-react';
import { PackageSuccessTracker } from './PackageSuccessTracker';

export const metadata: Metadata = {
  title: 'Order Confirmed | Garment Decor',
  description: 'Your custom embroidered baseball caps order has been confirmed.',
};

interface PageProps {
  searchParams: Promise<{ order?: string }>;
}

export default async function PackageCheckoutSuccessPage({ searchParams }: PageProps) {
  const { order: orderNumber } = await searchParams;
  
  return (
    <div className="min-h-screen bg-stone-50">
      {orderNumber && <PackageSuccessTracker orderNumber={orderNumber} />}
      <main className="mx-auto max-w-2xl px-4 py-16">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-navy-900 mb-2">Order Confirmed!</h1>
          {orderNumber && (
            <p className="text-lg text-stone-600">
              Order #{orderNumber}
            </p>
          )}
        </div>
        
        {/* Order Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-navy-900 mb-4">What happens next?</h2>
          
          <div className="space-y-6">
            {/* Step 1 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center">
                <Mail className="h-5 w-5 text-brand-600" />
              </div>
              <div>
                <h3 className="font-medium text-navy-900">Confirmation Email Sent</h3>
                <p className="text-sm text-stone-600">
                  We&apos;ve sent you an email with your order details. Check your inbox!
                </p>
              </div>
            </div>
            
            {/* Step 2 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center">
                <FileImage className="h-5 w-5 text-brand-600" />
              </div>
              <div>
                <h3 className="font-medium text-navy-900">Art Team Review</h3>
                <p className="text-sm text-stone-600">
                  Our art team will create a digital mockup of your caps. If we need your logo or have questions, we&apos;ll reach out by email.
                </p>
              </div>
            </div>
            
            {/* Step 3 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-brand-600" />
              </div>
              <div>
                <h3 className="font-medium text-navy-900">Sample Approval</h3>
                <p className="text-sm text-stone-600">
                  You&apos;ll receive a mockup to approve before we start production. No surprises!
                </p>
              </div>
            </div>
            
            {/* Step 4 */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center">
                <Clock className="h-5 w-5 text-brand-600" />
              </div>
              <div>
                <h3 className="font-medium text-navy-900">Production & Shipping</h3>
                <p className="text-sm text-stone-600">
                  Once approved, your order will ship within 10 business days. We&apos;ll send tracking info when it&apos;s on the way!
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Contact Info */}
        <div className="bg-blue-50 rounded-2xl p-6 mb-8">
          <h3 className="font-semibold text-navy-900 mb-2">Questions?</h3>
          <p className="text-sm text-stone-600 mb-3">
            Our team is here to help with any questions about your order.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href="mailto:orders@garmentdecor.com"
              className="flex items-center justify-center gap-2 px-4 py-2 bg-white rounded-lg border border-blue-200 text-sm font-medium text-navy-900 hover:bg-blue-50 transition-colors"
            >
              <Mail className="h-4 w-4" />
              orders@garmentdecor.com
            </a>
            <a
              href="tel:+18885551234"
              className="flex items-center justify-center gap-2 px-4 py-2 bg-white rounded-lg border border-blue-200 text-sm font-medium text-navy-900 hover:bg-blue-50 transition-colors"
            >
              <Phone className="h-4 w-4" />
              (888) 555-1234
            </a>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/"
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-brand-500 text-white font-semibold rounded-xl hover:bg-brand-600 transition-colors"
          >
            Continue Shopping
            <ArrowRight className="h-5 w-5" />
          </Link>
          <Link
            href="/packages/embroidered-caps"
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-stone-100 text-stone-700 font-semibold rounded-xl hover:bg-stone-200 transition-colors"
          >
            Order More Caps
          </Link>
        </div>
      </main>
    </div>
  );
}

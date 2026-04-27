import { Suspense } from 'react';
import Link from 'next/link';
import { ArrowLeft, MessageSquareText } from 'lucide-react';
import { ContactLeadsClient } from './ContactLeadsClient';

export const metadata = {
  title: 'Contact Leads',
  description: 'Monitor contact form submissions and manage spam',
};

export default function ContactLeadsPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className="flex items-center gap-1 text-sm text-slate-500 hover:text-navy-800 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </Link>
          <div className="h-5 w-px bg-stone-200" />
          <div className="flex items-center gap-2">
            <MessageSquareText className="h-5 w-5 text-brand-500" />
            <h1 className="text-xl font-bold text-navy-800">Contact Leads</h1>
          </div>
        </div>
        <Link
          href="/admin/quotes"
          className="text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors"
        >
          Quote Requests &rarr;
        </Link>
      </div>

      <Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-stone-100" />}>
        <ContactLeadsClient />
      </Suspense>
    </div>
  );
}

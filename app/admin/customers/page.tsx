import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { CustomersClient } from './CustomersClient';

export const metadata = {
  title: 'Customers',
  description: 'Customer intelligence dashboard',
};

export default function CustomersPage() {
  return (
    <div className="min-h-screen bg-stone-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href="/admin"
          className="mb-6 inline-flex items-center text-sm text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Admin Dashboard
        </Link>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-navy-800 sm:text-3xl">
            Customers
          </h1>
          <p className="mt-1 text-slate-600">
            Customer intelligence — orders, revenue, reviews, and engagement.
          </p>
        </div>

        <CustomersClient />
      </div>
    </div>
  );
}

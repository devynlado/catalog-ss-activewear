'use client';

import dynamic from 'next/dynamic';

// Loading component shown while the checkout loads
function CheckoutLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin h-10 w-10 border-4 border-slate-800 border-t-transparent rounded-full mx-auto"></div>
        <p className="mt-4 text-slate-600 font-medium">Loading checkout...</p>
      </div>
    </div>
  );
}

// Dynamically import the checkout content with SSR disabled
const CheckoutContent = dynamic(
  () => import('./CheckoutContent'),
  { 
    ssr: false,
    loading: () => <CheckoutLoading />
  }
);

export default function CheckoutPage() {
  return <CheckoutContent />;
}

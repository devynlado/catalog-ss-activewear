import { getOrderSession } from '@/lib/order-session';
import { OrderSidebar } from '@/components/orders/OrderSidebar';
import { CustomerChatWidget } from '@/components/orders/CustomerChatWidget';

export const metadata = {
  title: 'My Orders | Garment Decor',
  description: 'View your order history, track shipments, and check order status.',
};

export default async function OrdersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getOrderSession();

  if (!session) {
    return (
      <div className="min-h-screen bg-stone-50">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-navy-800 sm:text-3xl">My Orders</h1>
          <p className="mt-1 text-sm text-slate-500">View your order history and track shipments</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-4">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <OrderSidebar email={session.email} customer={session.customer} />
          </div>

          {/* Main content */}
          <div className="lg:col-span-3">
            {children}
          </div>
        </div>
      </div>

      {/* Customer chat — visible on all /orders pages */}
      <CustomerChatWidget
        customerEmail={session.email}
        customerName={session.customer.name}
      />
    </div>
  );
}

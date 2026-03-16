'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  CheckCircle, 
  Package, 
  ArrowRight, 
  Mail, 
  Phone, 
  Download, 
  Truck,
  Clock,
  MapPin,
  User,
  Building2,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useCartStore } from '@/lib/cart-store';
import { formatPrice } from '@/lib/utils';
import { trackPurchase } from '@/lib/analytics';

interface GA4LineItem {
  item_id: string;
  item_name: string;
  price: number;
  quantity: number;
}

interface OrderShipment {
  warehouse: string;
  tracking_number?: string | null;
  carrier?: string | null;
  shipped_at?: string | null;
}

interface OrderDetails {
  orderNumber: string;
  email: string;
  total: number;
  itemCount: number;
  poNumber?: string;
  customerCompany?: string;
  customerName?: string;
  shippingMethod?: string;
  lineItems?: GA4LineItem[];
  shippingCost?: number;
  shipments?: OrderShipment[];
}

const WAREHOUSE_LABELS: Record<string, string> = {
  ss_activewear: 'SS Activewear',
  los_angeles_apparel: 'LA Apparel',
  as_colour: 'AS Colour',
};

// Glass card styles
const glassCard = "bg-white/70 backdrop-blur-sm border border-stone-200 rounded-2xl shadow-lg shadow-stone-200/50";

function OrderTimeline({ currentStep = 1 }: { currentStep?: number }) {
  const steps = [
    { label: 'Order Confirmed', sublabel: 'Just now', icon: CheckCircle },
    { label: 'Preparing', sublabel: 'Within 24hrs', icon: Clock },
    { label: 'Shipped', sublabel: 'Tracking emailed', icon: Truck },
    { label: 'Delivered', sublabel: '3-5 business days', icon: MapPin },
  ];

  return (
    <div className="relative">
      {/* Progress Line */}
      <div className="absolute top-4 left-0 right-0 h-0.5 bg-stone-200">
        <div 
          className="h-full bg-green-500 transition-all duration-500"
          style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
        />
      </div>
      
      {/* Steps */}
      <div className="relative flex justify-between">
        {steps.map((step, index) => {
          const isComplete = index < currentStep;
          const isCurrent = index === currentStep - 1;
          const Icon = step.icon;
          
          return (
            <div key={step.label} className="flex flex-col items-center">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors ${
                isComplete 
                  ? 'bg-green-500 border-green-500 text-white' 
                  : isCurrent
                    ? 'bg-white border-green-500 text-green-500'
                    : 'bg-white border-stone-300 text-stone-400'
              }`}>
                {isComplete ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
              </div>
              <p className={`mt-2 text-xs font-medium ${
                isComplete || isCurrent ? 'text-slate-800' : 'text-slate-500'
              }`}>
                {step.label}
              </p>
              <p className="text-[10px] text-slate-500">{step.sublabel}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const orderNumberParam = searchParams.get('order');
  const { clearCart } = useCartStore();
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Clear the cart on successful checkout
    clearCart();

    // Determine which API to call based on available params
    // New PaymentElement flow uses 'order' param, old EmbeddedCheckout uses 'session_id'
    const fetchUrl = orderNumberParam 
      ? `/api/checkout/order?order=${orderNumberParam}`
      : sessionId 
        ? `/api/checkout/session?session_id=${sessionId}`
        : null;

    if (fetchUrl) {
      console.log('[Success Page] Fetching order data from:', fetchUrl);
      fetch(fetchUrl)
        .then((res) => res.json())
        .then((data) => {
          console.log('[Success Page] Order API response:', {
            orderNumber: data.orderNumber,
            total: data.total,
            lineItemCount: data.lineItems?.length ?? 0,
            hasError: !!data.error,
          });

          if (data.orderNumber) {
            setOrderDetails(data);
            
            const purchaseValue = (data.total || 0) / 100;
            console.log('[Success Page] Calling trackPurchase — order:', data.orderNumber, 'value:', purchaseValue);

            trackPurchase({
              transactionId: data.orderNumber,
              items: (data.lineItems || []).map((item: GA4LineItem) => ({
                sku: item.item_id,
                styleId: 0,
                styleName: '',
                productTitle: item.item_name,
                brandName: '',
                colorName: '',
                colorCode: '',
                sizeName: '',
                quantity: item.quantity,
                unitPrice: item.price,
              })),
              value: purchaseValue,
              shipping: data.shippingCost || 0,
            });
          } else {
            console.warn('[Success Page] No orderNumber in API response — trackPurchase will NOT fire');
          }
        })
        .catch((err) => {
          console.error('[Success Page] Failed to fetch order data:', err);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [sessionId, orderNumberParam, clearCart]);

  // Calculate estimated delivery date
  const getDeliveryDate = () => {
    const now = new Date();
    const minDays = orderDetails?.shippingMethod === 'same_day' ? 1 : 3;
    const maxDays = orderDetails?.shippingMethod === 'same_day' ? 2 : 5;
    
    const minDate = new Date(now);
    minDate.setDate(minDate.getDate() + minDays);
    const maxDate = new Date(now);
    maxDate.setDate(maxDate.getDate() + maxDays);
    
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    return `${minDate.toLocaleDateString('en-US', options)} - ${maxDate.toLocaleDateString('en-US', options)}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-50 to-white py-12 px-4">
      {/* Grain texture overlay */}
      <div 
        className="fixed inset-0 opacity-[0.015] pointer-events-none z-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative z-10 max-w-3xl mx-auto">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-green-400 to-green-600 shadow-lg shadow-green-500/30 mb-6">
            <CheckCircle className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-navy-800 mb-2">
            Order Confirmed!
          </h1>
          <p className="text-slate-600">
            Your order has been confirmed and is being prepared for shipment.
            {orderDetails?.shipments && orderDetails.shipments.length > 1 && (
              <span className="block mt-1 text-sm">
                Your items will arrive in {orderDetails.shipments.length} separate packages. We&apos;ll send tracking for each.
              </span>
            )}
          </p>
        </div>

        {/* Order Details Card */}
        {isLoading ? (
          <div className={glassCard + " p-6 mb-6"}>
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-stone-200 rounded w-1/2"></div>
              <div className="h-6 bg-stone-200 rounded w-3/4"></div>
              <div className="h-4 bg-stone-200 rounded w-1/3"></div>
            </div>
          </div>
        ) : orderDetails ? (
          <div className={glassCard + " p-6 mb-6"}>
            {/* Order Number & Company */}
            <div className="flex items-start justify-between mb-6 pb-6 border-b border-stone-200">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-100">
                  <Package className="h-7 w-7 text-brand-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Order Number</p>
                  <p className="text-xl font-bold text-navy-800">{orderDetails.orderNumber}</p>
                </div>
              </div>
              
              {/* Download Invoice Button */}
              <Button 
                variant="secondary" 
                size="sm" 
                className="hidden sm:flex"
                onClick={() => {
                  if (orderDetails?.orderNumber) {
                    window.open(`/api/orders/${orderDetails.orderNumber}/invoice`, '_blank');
                  }
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Download Invoice
              </Button>
            </div>

            {/* Order Info Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              {orderDetails.customerCompany && (
                <div className="flex items-start gap-3">
                  <Building2 className="h-4 w-4 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-500">Company</p>
                    <p className="text-sm font-medium text-slate-800">{orderDetails.customerCompany}</p>
                  </div>
                </div>
              )}
              
              {orderDetails.customerName && (
                <div className="flex items-start gap-3">
                  <User className="h-4 w-4 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-500">Contact</p>
                    <p className="text-sm font-medium text-slate-800">{orderDetails.customerName}</p>
                  </div>
                </div>
              )}
              
              <div className="flex items-start gap-3">
                <Mail className="h-4 w-4 text-slate-400 mt-0.5" />
                <div>
                  <p className="text-xs text-slate-500">Confirmation sent to</p>
                  <p className="text-sm font-medium text-slate-800">{orderDetails.email}</p>
                </div>
              </div>
              
              {orderDetails.poNumber && (
                <div className="flex items-start gap-3">
                  <FileText className="h-4 w-4 text-slate-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-slate-500">PO Number</p>
                    <p className="text-sm font-medium text-slate-800">{orderDetails.poNumber}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Order Summary */}
            <div className="bg-stone-50/50 rounded-xl p-4 mb-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-slate-600">
                    {orderDetails.itemCount} {orderDetails.itemCount === 1 ? 'item' : 'items'} ordered
                  </p>
                  <p className="text-xs text-slate-500">Est. delivery: {getDeliveryDate()}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-500">Total charged</p>
                  <p className="text-xl font-bold text-brand-600">
                    {formatPrice(orderDetails.total / 100)}
                  </p>
                </div>
              </div>
            </div>

            {/* Download Invoice - Mobile */}
            <Button 
              variant="secondary" 
              className="w-full sm:hidden"
              onClick={() => {
                if (orderDetails?.orderNumber) {
                  window.open(`/api/orders/${orderDetails.orderNumber}/invoice`, '_blank');
                }
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              Download Invoice
            </Button>
          </div>
        ) : (
          <div className={glassCard + " p-6 mb-6"}>
            <p className="text-slate-600 text-center">
              A confirmation email will be sent to your email address shortly.
            </p>
          </div>
        )}

        {/* Order Timeline */}
        <div className={glassCard + " p-6 mb-6"}>
          <h2 className="font-semibold text-navy-800 mb-6">What happens next?</h2>
          <OrderTimeline currentStep={1} />
        </div>

        {/* Account Rep Card */}
        <div className={glassCard + " p-6 mb-6"}>
          <h2 className="font-semibold text-navy-800 mb-4">Your Account Representative</h2>
          <div className="flex items-center gap-4">
            <div className="relative h-16 w-16 rounded-2xl overflow-hidden flex-shrink-0">
              <Image
                src="/images/team/devyn-lado.png"
                alt="Devyn Lado"
                fill
                className="object-cover"
              />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-slate-800">Devyn Lado</p>
              <p className="text-sm text-slate-600">Account Manager</p>
              <div className="flex items-center gap-4 mt-2">
                <a 
                  href="tel:+18559427636" 
                  className="inline-flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-700"
                >
                  <Phone className="h-3.5 w-3.5" />
                  (855) 942-7636
                </a>
                <a 
                  href="mailto:support@garmentdecor.com" 
                  className="inline-flex items-center gap-1.5 text-sm text-brand-600 hover:text-brand-700"
                >
                  <Mail className="h-3.5 w-3.5" />
                  Email
                </a>
              </div>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-brand-50 rounded-lg">
            <p className="text-sm text-brand-800">
              <span className="font-medium">Have questions about this order?</span>
              {' '}I&apos;m here to help with order updates, bulk pricing, or any concerns.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Link href="/catalog">
            <Button size="lg" className="w-full shadow-lg shadow-brand-500/25">
              Continue Shopping
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" disabled>
              <Package className="h-4 w-4 mr-2" />
              Track Order
              <span className="ml-1 text-xs text-slate-400">(available when shipped)</span>
            </Button>
          </div>
        </div>

        {/* Support Footer */}
        <div className="mt-8 pt-6 border-t border-stone-200 text-center">
          <p className="text-sm text-slate-600 mb-3">Questions about your order?</p>
          <div className="flex justify-center gap-6">
            <a 
              href="mailto:support@garmentdecor.com" 
              className="inline-flex items-center gap-2 text-sm text-brand-600 hover:text-brand-700"
            >
              <Mail className="h-4 w-4" />
              Email Support
            </a>
            <a 
              href="tel:+18559427636" 
              className="inline-flex items-center gap-2 text-sm text-brand-600 hover:text-brand-700"
            >
              <Phone className="h-4 w-4" />
              (855) 942-7636
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-brand-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading order details...</p>
        </div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}

'use client';

import { Shield, Truck, BadgeCheck, Building2, Phone } from 'lucide-react';

interface TrustSignalProps {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  subtitle: string;
}

function TrustSignal({ icon, iconBg, title, subtitle }: TrustSignalProps) {
  return (
    <div className="flex items-center gap-3">
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconBg}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-800">{title}</p>
        <p className="text-xs text-slate-500">{subtitle}</p>
      </div>
    </div>
  );
}

/**
 * B2B-focused trust signals for checkout
 */
export function CheckoutTrustSignals() {
  return (
    <div className="bg-white/70 backdrop-blur-sm border border-stone-200 rounded-2xl p-5 shadow-lg shadow-stone-200/50">
      <div className="space-y-4">
        <TrustSignal
          icon={<Shield className="h-5 w-5 text-green-600" />}
          iconBg="bg-green-100"
          title="Enterprise-Grade Security"
          subtitle="256-bit SSL + PCI compliant"
        />
        
        <TrustSignal
          icon={<Truck className="h-5 w-5 text-brand-600" />}
          iconBg="bg-brand-100"
          title="Ships Within 24 Hours"
          subtitle="From our LA facility"
        />
        
        <TrustSignal
          icon={<BadgeCheck className="h-5 w-5 text-blue-600" />}
          iconBg="bg-blue-100"
          title="100% Satisfaction Guarantee"
          subtitle="Full refund if not satisfied"
        />
        
        <TrustSignal
          icon={<Building2 className="h-5 w-5 text-purple-600" />}
          iconBg="bg-purple-100"
          title="Trusted Since 2011"
          subtitle="500+ businesses served"
        />
      </div>

      {/* Payment Methods */}
      <div className="mt-5 pt-4 border-t border-stone-200">
        <p className="text-xs text-slate-500 mb-3">Accepted payment methods</p>
        <div className="flex items-center gap-2">
          {/* Visa */}
          <div className="h-7 w-11 rounded bg-white shadow-sm flex items-center justify-center border border-stone-200">
            <span className="text-[9px] font-bold text-[#1434CB]">VISA</span>
          </div>
          {/* Mastercard */}
          <div className="h-7 w-11 rounded bg-white shadow-sm flex items-center justify-center border border-stone-200">
            <div className="flex">
              <div className="w-2.5 h-2.5 rounded-full bg-[#EB001B] -mr-0.5"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-[#F79E1B]"></div>
            </div>
          </div>
          {/* Amex */}
          <div className="h-7 w-11 rounded bg-white shadow-sm flex items-center justify-center border border-stone-200">
            <span className="text-[9px] font-bold text-[#006FCF]">AMEX</span>
          </div>
          {/* Apple Pay */}
          <div className="h-7 w-11 rounded bg-black shadow-sm flex items-center justify-center">
            <span className="text-[8px] font-semibold text-white">Pay</span>
          </div>
          {/* Google Pay */}
          <div className="h-7 w-11 rounded bg-white shadow-sm flex items-center justify-center border border-stone-200">
            <span className="text-[8px] font-semibold text-slate-700">G Pay</span>
          </div>
        </div>
      </div>

      {/* Contact */}
      <div className="mt-4 pt-4 border-t border-stone-200">
        <a 
          href="tel:+18559427636" 
          className="flex items-center gap-2 text-sm text-brand-600 hover:text-brand-700 transition-colors"
        >
          <Phone className="h-4 w-4" />
          <span>Questions? Call (323) 555-1234</span>
        </a>
      </div>
    </div>
  );
}

/**
 * Compact trust signals for mobile or sidebar
 */
export function CompactTrustSignals() {
  return (
    <div className="flex flex-wrap gap-4 text-xs text-slate-600">
      <div className="flex items-center gap-1.5">
        <Shield className="h-3.5 w-3.5 text-green-600" />
        <span>Secure Payment</span>
      </div>
      <div className="flex items-center gap-1.5">
        <Truck className="h-3.5 w-3.5 text-brand-600" />
        <span>Ships within 24hrs</span>
      </div>
      <div className="flex items-center gap-1.5">
        <BadgeCheck className="h-3.5 w-3.5 text-blue-600" />
        <span>Satisfaction Guaranteed</span>
      </div>
    </div>
  );
}

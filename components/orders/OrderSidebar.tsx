'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Package, LogOut, Mail, Phone, Building2, MessageCircle, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CustomerInfo } from '@/lib/order-session';

interface OrderSidebarProps {
  email: string;
  customer: CustomerInfo;
}

const NAV_ITEMS = [
  { href: '/orders', label: 'My Orders', icon: Package },
  { href: '/orders/reviews', label: 'Reviews', icon: Star },
];

function getInitials(name: string | null, email: string): string {
  if (name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return parts[0].slice(0, 2).toUpperCase();
  }
  return email.slice(0, 2).toUpperCase();
}

export function OrderSidebar({ email, customer }: OrderSidebarProps) {
  const pathname = usePathname();
  const initials = getInitials(customer.name, email);

  const handleLogout = async () => {
    try {
      await fetch('/api/orders/verify', { method: 'DELETE' });
    } catch { /* ignore */ }
    window.location.href = '/orders';
  };

  return (
    <div className="space-y-4">
      {/* Customer profile card */}
      <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
        {/* Avatar + Name */}
        <div className="flex flex-col items-center text-center mb-4">
          <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-600 text-white text-lg font-bold shadow-sm">
            {initials}
          </div>
          {customer.name && (
            <h3 className="text-sm font-semibold text-navy-800">{customer.name}</h3>
          )}
          {customer.company && (
            <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
              <Building2 className="h-3 w-3" />
              {customer.company}
            </p>
          )}
        </div>

        {/* Contact details */}
        <div className="space-y-2 border-t border-stone-100 pt-3">
          <div className="flex items-center gap-2.5 text-xs text-slate-600">
            <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{email}</span>
          </div>
          {customer.phone && (
            <div className="flex items-center gap-2.5 text-xs text-slate-600">
              <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span>{customer.phone}</span>
            </div>
          )}
        </div>

        {/* Contact button */}
        <a
          href="mailto:support@garmentdecor.com"
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-stone-100 hover:border-stone-300 transition-colors"
        >
          <MessageCircle className="h-3.5 w-3.5" />
          Contact Support
        </a>
      </div>

      {/* Navigation */}
      <nav className="rounded-xl border border-stone-200 bg-white shadow-sm overflow-hidden">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/orders' && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-5 py-3 text-sm font-medium transition-colors border-l-2',
                isActive
                  ? 'border-brand-500 bg-brand-50/50 text-brand-700'
                  : 'border-transparent text-slate-600 hover:bg-stone-50 hover:text-navy-800'
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}

        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 px-5 py-3 text-sm font-medium text-slate-500 border-l-2 border-transparent hover:bg-stone-50 hover:text-red-600 transition-colors"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </nav>
    </div>
  );
}

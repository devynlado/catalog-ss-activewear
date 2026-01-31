'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronDown, ChevronUp, User, Building2, Mail, Phone, Globe, MapPin, Calendar, BadgeCheck, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { SalesRepCard, SalesRepBadge } from '@/components/admin/SalesRepCard';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';

interface SalesRep {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string | null;
  phone?: string | null;
  calendly_url?: string | null;
}

interface Customer {
  id: string;
  email: string;
  full_name?: string | null;
  avatar_url?: string | null;
  company?: string | null;
  phone?: string | null;
  customer_type: 'direct' | 'distributor';
  verification_status?: 'pending' | 'approved' | 'denied' | null;
  asi_number?: string | null;
  ppai_number?: string | null;
  business_type?: string | null;
  website?: string | null;
  billing_address_city?: string | null;
  billing_address_state?: string | null;
  created_at: string;
  assigned_rep?: SalesRep | null;
}

interface CustomerCardProps {
  customer: Customer;
  salesReps: SalesRep[];
}

export function CustomerCard({ customer, salesReps }: CustomerCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [assignedRepId, setAssignedRepId] = useState(customer.assigned_rep?.id || '');
  const [isAssigning, setIsAssigning] = useState(false);

  const initials = customer.full_name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || customer.email[0].toUpperCase();

  const joinedDate = new Date(customer.created_at).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  });

  const handleAssignRep = async (repId: string) => {
    setIsAssigning(true);
    setAssignedRepId(repId);

    try {
      const supabase = createSupabaseBrowserClient();
      
      // Type assertion needed - Supabase types may not include all profile columns
      const { error } = await (supabase
        .from('profiles') as any)
        .update({ assigned_sales_rep_id: repId || null })
        .eq('id', customer.id);

      if (error) {
        console.error('Failed to assign rep:', error);
        setAssignedRepId(customer.assigned_rep?.id || '');
      }
    } catch (err) {
      console.error('Failed to assign rep:', err);
      setAssignedRepId(customer.assigned_rep?.id || '');
    } finally {
      setIsAssigning(false);
    }
  };

  const currentRep = salesReps.find(r => r.id === assignedRepId);

  return (
    <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      {/* Main Row */}
      <div 
        className="flex cursor-pointer items-center gap-4 p-4"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          {customer.avatar_url ? (
            <Image
              src={customer.avatar_url}
              alt={customer.full_name || 'Customer'}
              width={48}
              height={48}
              className="rounded-full object-cover"
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-600">
              {initials}
            </div>
          )}
        </div>

        {/* Customer Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-semibold text-navy-800">
              {customer.full_name || customer.email}
            </h3>
            {customer.customer_type === 'distributor' && (
              <Badge variant="brand" className="text-xs">
                <BadgeCheck className="mr-1 h-3 w-3" />
                Trade
              </Badge>
            )}
          </div>
          <p className="text-sm text-slate-600">
            {customer.company || customer.email}
          </p>
          <p className="text-xs text-slate-500">Joined {joinedDate}</p>
        </div>

        {/* Assigned Rep Badge */}
        <div className="hidden sm:block" onClick={(e) => e.stopPropagation()}>
          {currentRep ? (
            <SalesRepBadge rep={currentRep} />
          ) : (
            <span className="text-sm text-slate-400">No rep assigned</span>
          )}
        </div>

        {/* Expand Icon */}
        <div className="flex-shrink-0 text-slate-400">
          {isExpanded ? (
            <ChevronUp className="h-5 w-5" />
          ) : (
            <ChevronDown className="h-5 w-5" />
          )}
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="border-t border-stone-100 bg-stone-50 p-4">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Customer Details */}
            <div>
              <h4 className="mb-3 text-sm font-semibold text-navy-800">Contact Information</h4>
              <div className="space-y-2">
                {customer.full_name && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <User className="h-4 w-4 text-slate-400" />
                    {customer.full_name}
                  </div>
                )}
                {customer.company && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Building2 className="h-4 w-4 text-slate-400" />
                    {customer.company}
                  </div>
                )}
                <a 
                  href={`mailto:${customer.email}`}
                  className="flex items-center gap-2 text-sm text-brand-600 hover:text-brand-700"
                >
                  <Mail className="h-4 w-4" />
                  {customer.email}
                </a>
                {customer.phone && (
                  <a 
                    href={`tel:${customer.phone}`}
                    className="flex items-center gap-2 text-sm text-brand-600 hover:text-brand-700"
                  >
                    <Phone className="h-4 w-4" />
                    {customer.phone}
                  </a>
                )}
                {customer.website && (
                  <a 
                    href={customer.website.startsWith('http') ? customer.website : `https://${customer.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-brand-600 hover:text-brand-700"
                  >
                    <Globe className="h-4 w-4" />
                    {customer.website}
                  </a>
                )}
                {customer.billing_address_city && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <MapPin className="h-4 w-4 text-slate-400" />
                    {customer.billing_address_city}, {customer.billing_address_state}
                  </div>
                )}
              </div>

              {/* Business Credentials */}
              {(customer.asi_number || customer.ppai_number || customer.business_type) && (
                <div className="mt-4">
                  <h4 className="mb-2 text-sm font-semibold text-navy-800">Business Info</h4>
                  <div className="flex flex-wrap gap-2">
                    {customer.business_type && (
                      <span className="rounded-full bg-stone-100 px-3 py-1 text-xs text-slate-600">
                        {customer.business_type}
                      </span>
                    )}
                    {customer.asi_number && (
                      <span className="rounded-full bg-green-50 px-3 py-1 text-xs text-green-700">
                        ASI: {customer.asi_number}
                      </span>
                    )}
                    {customer.ppai_number && (
                      <span className="rounded-full bg-green-50 px-3 py-1 text-xs text-green-700">
                        PPAI: {customer.ppai_number}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Sales Rep Assignment */}
            <div>
              <h4 className="mb-3 text-sm font-semibold text-navy-800">Assigned Sales Rep</h4>
              
              {/* Rep Selector */}
              <div className="mb-4">
                <select
                  value={assignedRepId}
                  onChange={(e) => handleAssignRep(e.target.value)}
                  disabled={isAssigning}
                  className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                >
                  <option value="">No rep assigned</option>
                  {salesReps.map((rep) => (
                    <option key={rep.id} value={rep.id}>
                      {rep.full_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Rep Card */}
              {currentRep && (
                <SalesRepCard 
                  rep={currentRep}
                  showActions={true}
                />
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mt-6 flex flex-wrap gap-2 border-t border-stone-200 pt-4">
            <a
              href={`mailto:${customer.email}`}
              className="inline-flex items-center rounded-lg border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-stone-50"
            >
              <Mail className="mr-2 h-4 w-4" />
              Email
            </a>
            {customer.phone && (
              <a
                href={`tel:${customer.phone}`}
                className="inline-flex items-center rounded-lg border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-stone-50"
              >
                <Phone className="mr-2 h-4 w-4" />
                Call
              </a>
            )}
            <button
              className="inline-flex items-center rounded-lg border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-stone-50"
            >
              <FileText className="mr-2 h-4 w-4" />
              View Quotes
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

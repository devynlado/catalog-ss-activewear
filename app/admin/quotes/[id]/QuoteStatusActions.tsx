'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, Check } from 'lucide-react';

interface SalesRep {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string | null;
  calendly_url?: string | null;
}

interface QuoteStatusActionsProps {
  quoteId: string;
  currentStatus: string;
  salesReps: SalesRep[];
  currentRepId?: string | null;
}

const statuses = [
  { id: 'new', label: 'New', color: 'bg-amber-500' },
  { id: 'contacted', label: 'Contacted', color: 'bg-blue-500' },
  { id: 'quoted', label: 'Quoted', color: 'bg-brand-500' },
  { id: 'converted', label: 'Converted', color: 'bg-green-500' },
  { id: 'closed', label: 'Closed', color: 'bg-stone-500' },
];

export function QuoteStatusActions({ 
  quoteId, 
  currentStatus, 
  salesReps,
  currentRepId 
}: QuoteStatusActionsProps) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState(currentStatus);
  const [selectedRepId, setSelectedRepId] = useState(currentRepId || '');

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === selectedStatus) {
      setShowStatusDropdown(false);
      return;
    }

    setIsUpdating(true);
    setSelectedStatus(newStatus);
    setShowStatusDropdown(false);

    try {
      const response = await fetch(`/api/quotes/${quoteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      router.refresh();
    } catch (error) {
      console.error('Status update failed:', error);
      setSelectedStatus(currentStatus);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRepChange = async (repId: string) => {
    if (repId === selectedRepId) return;

    setIsUpdating(true);
    setSelectedRepId(repId);

    try {
      const response = await fetch(`/api/quotes/${quoteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assigned_sales_rep_id: repId || null }),
      });

      if (!response.ok) {
        throw new Error('Failed to assign rep');
      }

      router.refresh();
    } catch (error) {
      console.error('Rep assignment failed:', error);
      setSelectedRepId(currentRepId || '');
    } finally {
      setIsUpdating(false);
    }
  };

  const currentStatusConfig = statuses.find(s => s.id === selectedStatus) || statuses[0];

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Status Dropdown */}
      <div className="relative">
        <button
          onClick={() => setShowStatusDropdown(!showStatusDropdown)}
          disabled={isUpdating}
          className={`flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-stone-50 disabled:opacity-50 ${
            isUpdating ? 'cursor-wait' : ''
          }`}
        >
          <span className={`h-2 w-2 rounded-full ${currentStatusConfig.color}`} />
          {currentStatusConfig.label}
          <ChevronDown className="h-4 w-4 text-slate-400" />
        </button>

        {showStatusDropdown && (
          <>
            <div 
              className="fixed inset-0 z-10" 
              onClick={() => setShowStatusDropdown(false)}
            />
            <div className="absolute right-0 z-20 mt-2 w-48 rounded-lg border border-stone-200 bg-white py-1 shadow-lg">
              {statuses.map((status) => (
                <button
                  key={status.id}
                  onClick={() => handleStatusChange(status.id)}
                  className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm hover:bg-stone-50"
                >
                  <span className={`h-2 w-2 rounded-full ${status.color}`} />
                  <span className="flex-1">{status.label}</span>
                  {status.id === selectedStatus && (
                    <Check className="h-4 w-4 text-brand-600" />
                  )}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Rep Assignment */}
      <select
        value={selectedRepId}
        onChange={(e) => handleRepChange(e.target.value)}
        disabled={isUpdating}
        className="rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:opacity-50"
      >
        <option value="">Assign rep...</option>
        {salesReps.map((rep) => (
          <option key={rep.id} value={rep.id}>
            {rep.full_name}
          </option>
        ))}
      </select>
    </div>
  );
}

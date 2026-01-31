'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface VerificationActionsProps {
  applicationId: string;
  companyName: string;
  applicantEmail: string;
}

export function VerificationActions({ applicationId, companyName, applicantEmail }: VerificationActionsProps) {
  const router = useRouter();
  const [isApproving, setIsApproving] = useState(false);
  const [isDenying, setIsDenying] = useState(false);
  const [showDenyModal, setShowDenyModal] = useState(false);
  const [denyReason, setDenyReason] = useState('');

  const handleApprove = async () => {
    if (!confirm(`Approve trade pricing for ${companyName}? They will get access to distributor pricing.`)) {
      return;
    }

    setIsApproving(true);

    try {
      // Use server API route for admin operations
      const response = await fetch('/api/admin/verify-application', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId,
          action: 'approve',
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        console.error('Approve error:', data.error);
        alert('Failed to approve application. Please try again.');
        return;
      }

      // Send approval email
      try {
        await fetch('/api/email/application-approved', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: applicantEmail,
            companyName,
          }),
        });
      } catch (emailError) {
        console.error('Failed to send approval email:', emailError);
        // Don't block - email is non-critical
      }

      // Force page reload to show updated data
      window.location.reload();
    } catch (err) {
      console.error('Approve error:', err);
      alert('Something went wrong. Please try again.');
    } finally {
      setIsApproving(false);
    }
  };

  const handleDeny = async () => {
    setIsDenying(true);

    try {
      // Use server API route for admin operations
      const response = await fetch('/api/admin/verify-application', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId,
          action: 'deny',
          reason: denyReason || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        console.error('Deny error:', data.error);
        alert('Failed to deny application. Please try again.');
        return;
      }

      // Send denial email
      try {
        await fetch('/api/email/application-denied', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: applicantEmail,
            companyName,
            reason: denyReason || undefined,
          }),
        });
      } catch (emailError) {
        console.error('Failed to send denial email:', emailError);
        // Don't block - email is non-critical
      }

      setShowDenyModal(false);
      // Force page reload to show updated data
      window.location.reload();
    } catch (err) {
      console.error('Deny error:', err);
      alert('Something went wrong. Please try again.');
    } finally {
      setIsDenying(false);
    }
  };

  return (
    <>
      <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
        <Button
          variant="primary"
          size="md"
          onClick={handleApprove}
          isLoading={isApproving}
          className="bg-green-600 hover:bg-green-700 focus:ring-green-500"
        >
          <Check className="mr-2 h-4 w-4" />
          Approve
        </Button>
        <Button
          variant="secondary"
          size="md"
          onClick={() => setShowDenyModal(true)}
          disabled={isApproving}
        >
          <X className="mr-2 h-4 w-4" />
          Deny
        </Button>
      </div>

      {/* Deny Modal */}
      {showDenyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-navy-800">
              Deny Application
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              Are you sure you want to deny {companyName}&apos;s trade pricing application?
            </p>

            <div className="mt-4">
              <label 
                htmlFor="deny-reason" 
                className="mb-1.5 block text-sm font-medium text-slate-700"
              >
                Reason (optional)
              </label>
              <textarea
                id="deny-reason"
                value={denyReason}
                onChange={(e) => setDenyReason(e.target.value)}
                placeholder="e.g., Unable to verify business license"
                rows={3}
                className="w-full rounded-lg border border-stone-200 bg-white px-4 py-2 text-sm transition-colors placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>

            <div className="mt-6 flex gap-3">
              <Button
                variant="secondary"
                size="md"
                onClick={() => setShowDenyModal(false)}
                disabled={isDenying}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="md"
                onClick={handleDeny}
                isLoading={isDenying}
                className="flex-1"
              >
                Deny Application
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

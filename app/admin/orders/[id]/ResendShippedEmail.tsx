'use client';

import { useState } from 'react';
import { Send, CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface ResendShippedEmailProps {
  orderId: string;
  customerEmail: string;
}

export function ResendShippedEmail({ orderId, customerEmail }: ResendShippedEmailProps) {
  const [isSending, setIsSending] = useState(false);
  const [result, setResult] = useState<{ sent: boolean; error?: string } | null>(null);

  const handleResend = async () => {
    if (!confirm(`Resend shipping confirmation email to ${customerEmail}?`)) return;

    setIsSending(true);
    setResult(null);

    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resend_shipped_email: true }),
      });

      const text = await response.text();
      let data: Record<string, unknown>;
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        console.error('Resend email: non-JSON response', response.status, text.slice(0, 200));
        setResult({ sent: false, error: `Server error (${response.status})` });
        return;
      }

      if (!response.ok) {
        setResult({ sent: false, error: (data.error as string) || `Request failed (${response.status})` });
        return;
      }

      const emailStatus = data.emailStatus as { sent: boolean; error?: string } | undefined;
      if (emailStatus) {
        setResult(emailStatus);
      } else {
        setResult({ sent: false, error: 'No email status returned' });
      }
    } catch (err) {
      setResult({ sent: false, error: err instanceof Error ? err.message : 'Network error' });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        onClick={handleResend}
        disabled={isSending}
        className="flex w-full items-center gap-2 rounded-lg border border-stone-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-stone-50 disabled:opacity-50"
      >
        {isSending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
        {isSending ? 'Sending...' : 'Resend Tracking Email'}
      </button>

      {result && (
        <div className={`flex items-start gap-2 rounded-lg p-2.5 text-xs ${
          result.sent
            ? 'bg-green-50 text-green-700'
            : 'bg-red-50 text-red-700'
        }`}>
          {result.sent ? (
            <CheckCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          ) : (
            <XCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          )}
          <span>
            {result.sent
              ? `Email sent to ${customerEmail}`
              : `Failed: ${result.error || 'Unknown error'}`
            }
          </span>
        </div>
      )}
    </div>
  );
}

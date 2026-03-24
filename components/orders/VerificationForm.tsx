'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Package, Mail, ArrowRight, Loader2, ShieldCheck, ArrowLeft, KeyRound } from 'lucide-react';

type Step = 'email' | 'code';

export function VerificationForm() {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const codeRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCountdown]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/orders/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Verification failed');
        return;
      }

      if (data.step === 'code_sent') {
        setStep('code');
        setResendCountdown(60);
        setTimeout(() => codeRefs.current[0]?.focus(), 100);
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCodeChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    if (value.length > 1) {
      // Handle paste of full code
      const digits = value.replace(/\D/g, '').slice(0, 6).split('');
      digits.forEach((d, i) => { if (i < 6) newCode[i] = d; });
      setCode(newCode);
      const nextFocus = Math.min(digits.length, 5);
      codeRefs.current[nextFocus]?.focus();
    } else {
      newCode[index] = value;
      setCode(newCode);
      if (value && index < 5) {
        codeRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      codeRefs.current[index - 1]?.focus();
    }
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullCode = code.join('');
    if (fullCode.length !== 6) {
      setError('Please enter the 6-digit code');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/orders/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: fullCode }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Verification failed');
        return;
      }

      if (data.step === 'verified') {
        router.refresh();
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCountdown > 0) return;
    setError('');
    setLoading(true);
    setCode(['', '', '', '', '', '']);

    try {
      const res = await fetch('/api/orders/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to resend code');
        return;
      }
      setResendCountdown(60);
      setTimeout(() => codeRefs.current[0]?.focus(), 100);
    } catch {
      setError('Failed to resend code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 border border-brand-100">
            {step === 'email' ? (
              <Package className="h-8 w-8 text-brand-600" />
            ) : (
              <KeyRound className="h-8 w-8 text-brand-600" />
            )}
          </div>
          <h1 className="text-2xl font-bold text-navy-800 sm:text-3xl">
            {step === 'email' ? 'Track Your Orders' : 'Enter Verification Code'}
          </h1>
          <p className="mt-2 text-slate-500">
            {step === 'email'
              ? 'Enter the email address you used when placing your order'
              : `We sent a 6-digit code to ${email}`}
          </p>
        </div>

        {step === 'email' ? (
          <form onSubmit={handleEmailSubmit} className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  className="w-full rounded-lg border border-stone-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-colors"
                />
              </div>
            </div>

            {error && (
              <div className="mb-4 rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !email}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending Code...
                </>
              ) : (
                <>
                  Send Verification Code
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

            <div className="mt-4 flex items-start gap-2 text-xs text-slate-400">
              <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5" />
              <p>We&apos;ll send a verification code to this email for security.</p>
            </div>
          </form>
        ) : (
          <form onSubmit={handleCodeSubmit} className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
            <div className="mb-5">
              <label className="block text-sm font-medium text-slate-700 mb-3 text-center">
                Verification Code
              </label>
              <div className="flex justify-center gap-2">
                {code.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { codeRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={i === 0 ? 6 : 1}
                    value={digit}
                    onChange={(e) => handleCodeChange(i, e.target.value)}
                    onKeyDown={(e) => handleCodeKeyDown(i, e)}
                    onFocus={(e) => e.target.select()}
                    className="h-12 w-11 rounded-lg border border-stone-200 bg-white text-center text-lg font-bold text-navy-800 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-colors"
                  />
                ))}
              </div>
            </div>

            {error && (
              <div className="mb-4 rounded-lg bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || code.join('').length !== 6}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  Verify & Access Orders
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>

            <div className="mt-4 flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => { setStep('email'); setError(''); setCode(['', '', '', '', '', '']); }}
                className="flex items-center gap-1 text-slate-500 hover:text-slate-700 transition-colors"
              >
                <ArrowLeft className="h-3 w-3" />
                Change email
              </button>
              <button
                type="button"
                onClick={handleResendCode}
                disabled={resendCountdown > 0 || loading}
                className="text-brand-600 hover:text-brand-700 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors"
              >
                {resendCountdown > 0 ? `Resend in ${resendCountdown}s` : 'Resend code'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

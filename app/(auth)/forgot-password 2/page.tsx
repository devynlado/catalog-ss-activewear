'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { resetPassword } from '@/lib/supabase-browser';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const { error: resetError } = await resetPassword(email);

      if (resetError) {
        setError(resetError.message);
        setIsLoading(false);
        return;
      }

      setIsSuccess(true);
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  // Success state
  if (isSuccess) {
    return (
      <div className="space-y-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-100">
          <svg
            className="h-6 w-6 text-brand-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-navy-800">Check your email</h1>
          <p className="mt-2 text-sm text-slate-600">
            We&apos;ve sent a password reset link to{' '}
            <span className="font-medium text-slate-900">{email}</span>
          </p>
        </div>
        <p className="text-sm text-slate-500">
          Didn&apos;t receive the email? Check your spam folder or{' '}
          <button
            onClick={() => {
              setIsSuccess(false);
              setEmail('');
            }}
            className="text-brand-600 hover:text-brand-700 font-medium"
          >
            try again
          </button>
        </p>
        <Link
          href="/login"
          className="inline-block text-sm font-medium text-navy-600 hover:text-brand-600 transition-colors"
        >
          ← Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-navy-800">Reset your password</h1>
        <p className="mt-2 text-sm text-slate-600">
          Enter your email and we&apos;ll send you a reset link
        </p>
      </div>

      {/* Error message */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Reset Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email"
          type="email"
          placeholder="you@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />

        <Button
          type="submit"
          className="w-full"
          size="lg"
          isLoading={isLoading}
        >
          Send Reset Link
        </Button>
      </form>

      {/* Back to login */}
      <p className="text-center text-sm text-slate-600">
        Remember your password?{' '}
        <Link
          href="/login"
          className="font-medium text-brand-600 hover:text-brand-700 transition-colors"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}

import Stripe from 'stripe';

// Re-export utilities for convenience in server-side code
export * from './stripe-utils';

// Server-side Stripe client - lazily initialized to avoid build-time errors
let _stripe: Stripe | null = null;

export const stripe = new Proxy({} as Stripe, {
  get(_, prop) {
    if (!_stripe) {
      if (!process.env.STRIPE_SECRET_KEY) {
        throw new Error('STRIPE_SECRET_KEY environment variable is not set');
      }
      _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: '2026-01-28.clover',
        typescript: true,
      });
    }
    return (_stripe as any)[prop];
  },
});

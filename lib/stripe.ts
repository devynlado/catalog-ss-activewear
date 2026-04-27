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
        // Pinned to the version the installed SDK's typings expect. The
        // SDK uses this string as the `Stripe-Version` request header,
        // so it should always match the typings shipped with the
        // current `stripe` package — bump together when upgrading.
        apiVersion: '2026-02-25.clover',
        typescript: true,
      });
    }
    return (_stripe as any)[prop];
  },
});

import Stripe from 'stripe';

// Re-export utilities for convenience in server-side code
export * from './stripe-utils';

// Server-side Stripe client - only use in API routes and server components
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-01-28.clover',
  typescript: true,
});

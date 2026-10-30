import { redirect } from 'next/navigation';

// The assigned-only rep views are retired in favor of the email-based client
// lookup on /dashboard/rep. Redirect any old links here.
export default function RepQuotesRedirect() {
  redirect('/dashboard/rep');
}

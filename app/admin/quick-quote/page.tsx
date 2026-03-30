import { Metadata } from 'next';
import QuickQuoteClient from './QuickQuoteClient';

export const metadata: Metadata = {
  title: 'Quick Quote | Admin',
  description: 'Generate instant pricing presentations for customers',
};

export default function QuickQuotePage() {
  return <QuickQuoteClient />;
}

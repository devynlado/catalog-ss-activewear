'use client';

import Link from 'next/link';
import { 
  CheckCircle2, 
  Clock, 
  Mail, 
  Phone,
  ArrowRight,
  FileText,
  MessageSquare,
  Package
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

interface QuoteConfirmationProps {
  quoteNumber?: string;
  email?: string;
  totalPieces: number;
  estimatedTotal: number;
}

export function QuoteConfirmation({
  quoteNumber = `QR-${Date.now().toString(36).toUpperCase()}`,
  email,
  totalPieces,
  estimatedTotal,
}: QuoteConfirmationProps) {
  return (
    <div className="max-w-2xl mx-auto text-center space-y-8">
      {/* Success Icon */}
      <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-gradient-to-br from-green-100 to-green-200 shadow-lg shadow-green-500/20">
        <CheckCircle2 className="h-10 w-10 text-green-600" />
      </div>

      {/* Main Message */}
      <div className="space-y-3">
        <h1 className="text-3xl font-bold text-slate-900">
          Quote Request Submitted!
        </h1>
        <p className="text-lg text-slate-600">
          Thank you for your request. Our team is reviewing your project now.
        </p>
      </div>

      {/* Quote Reference Card */}
      <div className="rounded-2xl border border-stone-200/80 bg-white/70 backdrop-blur-sm shadow-lg shadow-stone-200/50 overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-200/50 bg-gradient-to-r from-brand-50 to-white">
          <p className="text-sm text-slate-500">Reference Number</p>
          <p className="text-xl font-bold text-slate-900 font-mono">{quoteNumber}</p>
        </div>
        
        <div className="p-6 grid grid-cols-2 gap-4 text-left">
          <div className="p-4 rounded-xl bg-stone-50">
            <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
              <Package className="h-4 w-4" />
              Pieces
            </div>
            <p className="font-semibold text-slate-900">{totalPieces.toLocaleString()}</p>
          </div>
          <div className="p-4 rounded-xl bg-stone-50">
            <div className="flex items-center gap-2 text-slate-500 text-sm mb-1">
              <FileText className="h-4 w-4" />
              Est. Total
            </div>
            <p className="font-semibold text-brand-600">${estimatedTotal.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* What Happens Next */}
      <div className="rounded-2xl border border-stone-200/80 bg-white p-6 text-left">
        <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5 text-brand-500" />
          What Happens Next
        </h3>
        
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-shrink-0 h-8 w-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold text-sm">
              1
            </div>
            <div>
              <p className="font-medium text-slate-900">Artwork Review</p>
              <p className="text-sm text-slate-600">
                Our design team will review your artwork and prepare a digital mockup.
              </p>
            </div>
          </div>
          
          <div className="flex gap-4">
            <div className="flex-shrink-0 h-8 w-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold text-sm">
              2
            </div>
            <div>
              <p className="font-medium text-slate-900">Quote Confirmation</p>
              <p className="text-sm text-slate-600">
                We'll send you a detailed quote with final pricing within 2 business hours.
              </p>
            </div>
          </div>
          
          <div className="flex gap-4">
            <div className="flex-shrink-0 h-8 w-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 font-bold text-sm">
              3
            </div>
            <div>
              <p className="font-medium text-slate-900">Proof Approval</p>
              <p className="text-sm text-slate-600">
                Once you approve the mockup, we'll begin production. Nothing prints without your OK.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Options */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <a
          href="tel:8088457836"
          className="flex items-center justify-center gap-3 p-4 rounded-xl border border-stone-200 bg-white hover:border-brand-300 hover:bg-brand-50/50 transition-colors"
        >
          <Phone className="h-5 w-5 text-brand-500" />
          <div className="text-left">
            <p className="text-sm text-slate-500">Call Us</p>
            <p className="font-semibold text-slate-900">(808) 845-7836</p>
          </div>
        </a>
        
        <a
          href="mailto:orders@garmentdecor.com"
          className="flex items-center justify-center gap-3 p-4 rounded-xl border border-stone-200 bg-white hover:border-brand-300 hover:bg-brand-50/50 transition-colors"
        >
          <Mail className="h-5 w-5 text-brand-500" />
          <div className="text-left">
            <p className="text-sm text-slate-500">Email Us</p>
            <p className="font-semibold text-slate-900">orders@garmentdecor.com</p>
          </div>
        </a>
      </div>

      {/* Email notification */}
      {email && (
        <p className="text-sm text-slate-500">
          A confirmation email has been sent to <strong>{email}</strong>
        </p>
      )}

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
        <Link 
          href="/catalog"
          className="inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 bg-brand-600 text-white hover:bg-brand-700 focus:ring-brand-500 h-12 rounded-lg px-6 text-base w-full sm:w-auto"
        >
          <Package className="mr-2 h-4 w-4" />
          Continue Shopping
        </Link>
        <Link 
          href="/quote"
          className="inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 border border-stone-200 bg-white text-slate-900 hover:bg-stone-50 focus:ring-brand-500 h-12 rounded-lg px-6 text-base w-full sm:w-auto"
        >
          <MessageSquare className="mr-2 h-4 w-4" />
          Start Another Quote
        </Link>
      </div>

      {/* Support Note */}
      <p className="text-sm text-slate-500">
        Questions? Our team is available Monday-Friday, 8am-5pm HST.
      </p>
    </div>
  );
}

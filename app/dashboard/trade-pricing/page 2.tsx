'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, Building2, BadgeCheck, FileText } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { createSupabaseBrowserClient } from '@/lib/supabase-browser';

const businessTypes = [
  { value: '', label: 'Select your business type' },
  { value: 'promo_distributor', label: 'Promotional Products Distributor' },
  { value: 'decorator', label: 'Decorator / Print Shop' },
  { value: 'screen_printer', label: 'Screen Printer' },
  { value: 'embroiderer', label: 'Embroiderer' },
  { value: 'team_dealer', label: 'Team Dealer / Sports Apparel' },
  { value: 'brand', label: 'Clothing Brand / Private Label' },
  { value: 'corporate', label: 'Corporate Buyer' },
  { value: 'other', label: 'Other' },
];

export default function TradePricingPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    asi_number: '',
    ppai_number: '',
    business_type: '',
    company: '',
    website: '',
    billing_address_street: '',
    billing_address_city: '',
    billing_address_state: '',
    billing_address_zip: '',
    business_license: '',
    sellers_permit: '',
    tax_exempt: false,
    resale_certificate: '',
    tax_id: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validation
    if (!formData.business_type) {
      setError('Please select your business type.');
      return;
    }
    
    if (!formData.asi_number && !formData.ppai_number) {
      setError('Please provide either an ASI or PPAI number.');
      return;
    }

    if (!formData.company) {
      setError('Please provide your company name.');
      return;
    }

    if (!formData.business_license) {
      setError('Please provide your business license number.');
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = createSupabaseBrowserClient();
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError('You must be logged in to apply.');
        return;
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          asi_number: formData.asi_number || null,
          ppai_number: formData.ppai_number || null,
          business_type: formData.business_type,
          company: formData.company,
          website: formData.website || null,
          billing_address_street: formData.billing_address_street || null,
          billing_address_city: formData.billing_address_city || null,
          billing_address_state: formData.billing_address_state || null,
          billing_address_zip: formData.billing_address_zip || null,
          business_license: formData.business_license,
          sellers_permit: formData.sellers_permit || null,
          tax_exempt: formData.tax_exempt,
          resale_certificate: formData.resale_certificate || null,
          tax_id: formData.tax_id || null,
          verification_status: 'pending',
        })
        .eq('id', user.id);

      if (updateError) {
        console.error('Update error:', updateError);
        setError('Failed to submit application. Please try again.');
        return;
      }

      // Send confirmation email
      try {
        await fetch('/api/email/application-received', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: user.email,
            companyName: formData.company,
          }),
        });
      } catch (emailError) {
        console.error('Failed to send confirmation email:', emailError);
        // Don't block success - email is non-critical
      }

      setIsSuccess(true);
    } catch (err) {
      console.error('Submit error:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success state
  if (isSuccess) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-stone-50">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-stone-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-navy-800">Application Submitted!</h1>
            <p className="mt-2 text-slate-600">
              Thank you for applying for trade pricing. Our team will review your application 
              and get back to you within 1-2 business days.
            </p>
            <p className="mt-4 text-sm text-slate-500">
              We&apos;ll send you an email once your application has been reviewed.
            </p>
            <Link href="/dashboard">
              <Button variant="primary" size="lg" className="mt-6">
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Back link */}
        <Link 
          href="/dashboard" 
          className="mb-6 inline-flex items-center text-sm text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-navy-800 sm:text-3xl">
            Apply for Trade Pricing
          </h1>
          <p className="mt-2 text-slate-600">
            Get access to wholesale pricing for ASI/PPAI members and qualified businesses.
          </p>
        </div>

        {/* Benefits */}
        <div className="mb-8 rounded-xl border border-brand-200 bg-gradient-to-r from-brand-50 to-orange-50 p-6">
          <h2 className="mb-4 font-semibold text-navy-800">Trade Account Benefits</h2>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <BadgeCheck className="mt-0.5 h-5 w-5 flex-shrink-0 text-brand-600" />
              <span className="text-sm text-slate-700">Wholesale pricing on all products</span>
            </li>
            <li className="flex items-start gap-3">
              <Building2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-brand-600" />
              <span className="text-sm text-slate-700">Dedicated account representative</span>
            </li>
            <li className="flex items-start gap-3">
              <FileText className="mt-0.5 h-5 w-5 flex-shrink-0 text-brand-600" />
              <span className="text-sm text-slate-700">Priority quote turnaround</span>
            </li>
          </ul>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 font-semibold text-navy-800">Business Information</h2>
            
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Company Name"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  placeholder="Your company name"
                  required
                />

                <Input
                  label="Website"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  placeholder="yourcompany.com"
                />
              </div>

              <div className="w-full">
                <label 
                  htmlFor="business_type" 
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Business Type
                </label>
                <select
                  id="business_type"
                  name="business_type"
                  value={formData.business_type}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-stone-200 bg-white px-4 py-2 text-sm transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  required
                >
                  {businessTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Billing Address */}
              <div className="pt-2">
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Billing Address
                </label>
                <div className="space-y-3">
                  <Input
                    name="billing_address_street"
                    value={formData.billing_address_street}
                    onChange={handleChange}
                    placeholder="Street address"
                  />
                  <div className="grid gap-3 sm:grid-cols-3">
                    <Input
                      name="billing_address_city"
                      value={formData.billing_address_city}
                      onChange={handleChange}
                      placeholder="City"
                    />
                    <Input
                      name="billing_address_state"
                      value={formData.billing_address_state}
                      onChange={handleChange}
                      placeholder="State"
                    />
                    <Input
                      name="billing_address_zip"
                      value={formData.billing_address_zip}
                      onChange={handleChange}
                      placeholder="ZIP Code"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 font-semibold text-navy-800">Business Licenses & Credentials</h2>
            
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Business License Number"
                  name="business_license"
                  value={formData.business_license}
                  onChange={handleChange}
                  placeholder="Your business license #"
                  required
                />

                <Input
                  label="Seller's Permit Number"
                  name="sellers_permit"
                  value={formData.sellers_permit}
                  onChange={handleChange}
                  placeholder="Optional"
                  hint="State resale permit"
                />
              </div>

              <div className="border-t border-stone-100 pt-4">
                <p className="mb-3 text-sm text-slate-500">
                  If you&apos;re an ASI/PPAI member, provide at least one credential below.
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="ASI Number"
                    name="asi_number"
                    value={formData.asi_number}
                    onChange={handleChange}
                    placeholder="e.g., 123456"
                    hint="Advertising Specialty Institute"
                  />

                  <Input
                    label="PPAI Number"
                    name="ppai_number"
                    value={formData.ppai_number}
                    onChange={handleChange}
                    placeholder="e.g., 654321"
                    hint="Promotional Products Association"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 font-semibold text-navy-800">Tax Information</h2>
            <p className="mb-4 text-sm text-slate-500">
              Optional. Provide if you qualify for tax exemption.
            </p>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="tax_exempt"
                  name="tax_exempt"
                  checked={formData.tax_exempt}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-stone-300 text-brand-600 focus:ring-brand-500"
                />
                <label htmlFor="tax_exempt" className="text-sm text-slate-700">
                  My business is tax exempt
                </label>
              </div>

              {formData.tax_exempt && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Resale Certificate Number"
                    name="resale_certificate"
                    value={formData.resale_certificate}
                    onChange={handleChange}
                    placeholder="Certificate number"
                  />

                  <Input
                    label="Tax ID / EIN"
                    name="tax_id"
                    value={formData.tax_id}
                    onChange={handleChange}
                    placeholder="XX-XXXXXXX"
                  />
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Link href="/dashboard">
              <Button type="button" variant="secondary" size="lg" className="w-full sm:w-auto">
                Cancel
              </Button>
            </Link>
            <Button 
              type="submit" 
              variant="primary" 
              size="lg" 
              isLoading={isSubmitting}
              className="w-full sm:w-auto"
            >
              Submit Application
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

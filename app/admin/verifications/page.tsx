import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Building2, Globe, MapPin, FileCheck, BadgeCheck } from 'lucide-react';
import { createSupabaseServerClient, getServerProfile } from '@/lib/supabase-server';
import { VerificationActions } from './VerificationActions';

export const metadata = {
  title: 'Trade Pricing Verifications',
  description: 'Review and approve trade pricing applications',
};

const businessTypeLabels: Record<string, string> = {
  promo_distributor: 'Promotional Products Distributor',
  decorator: 'Decorator / Print Shop',
  screen_printer: 'Screen Printer',
  embroiderer: 'Embroiderer',
  team_dealer: 'Team Dealer / Sports Apparel',
  brand: 'Clothing Brand / Private Label',
  corporate: 'Corporate Buyer',
  other: 'Other',
};

export default async function VerificationsPage() {
  const supabase = await createSupabaseServerClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login');
  }

  const { profile } = await getServerProfile();
  
  // Security: Only admins can access this page
  if (!profile || profile.role !== 'admin') {
    redirect('/dashboard');
  }

  // Get pending verifications
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: pendingApplications } = await supabase
    .from('profiles')
    .select('*')
    .eq('verification_status', 'pending')
    .order('updated_at', { ascending: false }) as { data: any[] | null };

  // Get recent approved/denied for reference
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: recentDecisions } = await supabase
    .from('profiles')
    .select('*')
    .in('verification_status', ['approved', 'denied'])
    .order('verified_at', { ascending: false })
    .limit(10) as { data: any[] | null };

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Back link */}
        <Link 
          href="/admin" 
          className="mb-6 inline-flex items-center text-sm text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Admin Dashboard
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-navy-800 sm:text-3xl">
            Trade Pricing Verifications
          </h1>
          <p className="mt-1 text-slate-600">
            Review and approve applications for trade pricing access.
          </p>
        </div>

        {/* Pending Applications */}
        <div className="mb-8">
          <h2 className="mb-4 text-lg font-semibold text-navy-800">
            Pending Applications ({pendingApplications?.length || 0})
          </h2>
          
          {pendingApplications && pendingApplications.length > 0 ? (
            <div className="space-y-4">
              {pendingApplications.map((application) => (
                <div 
                  key={application.id} 
                  className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                    {/* Applicant Info */}
                    <div className="flex-1 space-y-4">
                      <div>
                        <h3 className="text-lg font-semibold text-navy-800">
                          {application.company || 'Unknown Company'}
                        </h3>
                        <p className="text-sm text-slate-600">
                          {application.full_name} • {application.email}
                        </p>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {/* Business Type */}
                        <div className="flex items-start gap-2">
                          <Building2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400" />
                          <div>
                            <p className="text-xs font-medium text-slate-500">Business Type</p>
                            <p className="text-sm text-slate-700">
                              {businessTypeLabels[application.business_type] || application.business_type || 'Not specified'}
                            </p>
                          </div>
                        </div>

                        {/* Website */}
                        {application.website && (
                          <div className="flex items-start gap-2">
                            <Globe className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400" />
                            <div>
                              <p className="text-xs font-medium text-slate-500">Website</p>
                              <a 
                                href={application.website} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-sm text-brand-600 hover:underline"
                              >
                                {application.website.replace(/^https?:\/\//, '')}
                              </a>
                            </div>
                          </div>
                        )}

                        {/* Address */}
                        {application.billing_address_city && (
                          <div className="flex items-start gap-2">
                            <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-slate-400" />
                            <div>
                              <p className="text-xs font-medium text-slate-500">Location</p>
                              <p className="text-sm text-slate-700">
                                {application.billing_address_city}, {application.billing_address_state} {application.billing_address_zip}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Credentials */}
                      <div className="flex flex-wrap gap-4 border-t border-stone-100 pt-4">
                        {application.business_license && (
                          <div className="flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1">
                            <FileCheck className="h-4 w-4 text-blue-600" />
                            <span className="text-xs font-medium text-blue-700">
                              Business License: {application.business_license}
                            </span>
                          </div>
                        )}
                        {application.sellers_permit && (
                          <div className="flex items-center gap-2 rounded-full bg-purple-50 px-3 py-1">
                            <FileCheck className="h-4 w-4 text-purple-600" />
                            <span className="text-xs font-medium text-purple-700">
                              Seller&apos;s Permit: {application.sellers_permit}
                            </span>
                          </div>
                        )}
                        {application.asi_number && (
                          <div className="flex items-center gap-2 rounded-full bg-green-50 px-3 py-1">
                            <BadgeCheck className="h-4 w-4 text-green-600" />
                            <span className="text-xs font-medium text-green-700">
                              ASI: {application.asi_number}
                            </span>
                          </div>
                        )}
                        {application.ppai_number && (
                          <div className="flex items-center gap-2 rounded-full bg-green-50 px-3 py-1">
                            <BadgeCheck className="h-4 w-4 text-green-600" />
                            <span className="text-xs font-medium text-green-700">
                              PPAI: {application.ppai_number}
                            </span>
                          </div>
                        )}
                        {application.tax_exempt && (
                          <div className="flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1">
                            <FileCheck className="h-4 w-4 text-amber-600" />
                            <span className="text-xs font-medium text-amber-700">
                              Tax Exempt
                            </span>
                          </div>
                        )}
                      </div>

                      <p className="text-xs text-slate-400">
                        Applied {new Date(application.updated_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>

                    {/* Actions */}
                    <VerificationActions 
                      applicationId={application.id} 
                      companyName={application.company || 'this applicant'}
                      applicantEmail={application.email}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-stone-200 bg-white p-12 text-center shadow-sm">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <BadgeCheck className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-navy-800">All caught up!</h3>
              <p className="mt-1 text-sm text-slate-600">
                No pending verification requests at this time.
              </p>
            </div>
          )}
        </div>

        {/* Recent Decisions */}
        {recentDecisions && recentDecisions.length > 0 && (
          <div>
            <h2 className="mb-4 text-lg font-semibold text-navy-800">
              Recent Decisions
            </h2>
            <div className="rounded-xl border border-stone-200 bg-white shadow-sm overflow-hidden">
              <table className="w-full">
                <thead className="bg-stone-50 border-b border-stone-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Company</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {recentDecisions.map((decision) => (
                    <tr key={decision.id}>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-slate-700">{decision.company || 'Unknown'}</p>
                        <p className="text-xs text-slate-500">{decision.email}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          decision.verification_status === 'approved' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {decision.verification_status === 'approved' ? 'Approved' : 'Denied'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-500">
                        {decision.verified_at 
                          ? new Date(decision.verified_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          : '-'
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

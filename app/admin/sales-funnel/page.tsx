import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Filter } from 'lucide-react';
import { getServerProfile } from '@/lib/supabase-server';
import { DateRangePicker } from '../analytics/DateRangePicker';
import { PageVisitorTable } from '../analytics/PageVisitorTable';
import { ProductVisitorTable } from '../analytics/ProductVisitorTable';
import { PageEngagementTable } from '../analytics/PageEngagementTable';
import { CityDemographicsTable } from '../analytics/CityDemographicsTable';
import { PathTreeDiagram } from '../analytics/PathTreeDiagram';
import { SalesBySourceSection } from '../analytics/SalesBySourceSection';
import { LeadBySourceTable } from '../analytics/LeadBySourceTable';
import { ContactCTATable } from '../analytics/ContactCTATable';

export const metadata = {
  title: 'Sales Funnel | Admin',
  description: 'Page visitor, traffic, and conversion analytics for garmentdecor.com',
};

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

interface Props {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function SalesFunnelPage({ searchParams }: Props) {
  const { profile } = await getServerProfile();

  if (!profile || profile.role !== 'admin') {
    redirect('/admin');
  }

  const params = await searchParams;
  const startDate = typeof params.startDate === 'string' ? params.startDate : daysAgo(30);
  const endDate = typeof params.endDate === 'string' ? params.endDate : today();

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href="/admin"
          className="mb-6 inline-flex items-center text-sm text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Admin Dashboard
        </Link>

        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-navy-800 sm:text-3xl">
              <Filter className="h-8 w-8 text-brand-600" />
              Sales Funnel
            </h1>
            <p className="mt-1 text-slate-600">
              Visitor, traffic, and conversion analytics for garmentdecor.com
            </p>
          </div>
          <Link
            href="/admin/analytics"
            className="inline-flex items-center gap-2 rounded-lg border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:border-brand-300 hover:bg-brand-50"
          >
            Profitability & Ad Spend
          </Link>
        </div>

        <DateRangePicker startDate={startDate} endDate={endDate} />

        <section className="mb-12">
          <h2 className="mb-4 text-lg font-semibold text-navy-800">
            Page Visitor Analytics
          </h2>
          <p className="mb-4 text-sm text-slate-600">
            Top 20 most visited pages with traffic broken down by source (GA4-style channels).
            Scroll horizontally to see all columns.
          </p>
          <PageVisitorTable startDate={startDate} endDate={endDate} />
        </section>

        <section className="mb-12">
          <h2 className="mb-4 text-lg font-semibold text-navy-800">
            Top 30 Product Pages by Visitor Source
          </h2>
          <p className="mb-4 text-sm text-slate-600">
            Most visited product pages with traffic broken down by source: Google Ads, Organic Search, Organic Social, Organic Shopping, Referral, Cross-network, and Other.
          </p>
          <ProductVisitorTable startDate={startDate} endDate={endDate} />
        </section>

        <section className="mb-12">
          <h2 className="mb-4 text-lg font-semibold text-navy-800">
            Page Engagement
          </h2>
          <p className="mb-4 text-sm text-slate-600">
            Views, active users, views per user, average engagement time, and event counts (click, form_submit, generate_lead) for key pages.
          </p>
          <PageEngagementTable startDate={startDate} endDate={endDate} />
        </section>

        <section className="mb-12">
          <h2 className="mb-4 text-lg font-semibold text-navy-800">
            Top US Cities (Demographics)
          </h2>
          <p className="mb-4 text-sm text-slate-600">
            Top 15 US cities by visitor count. New users, return users, channel breakdown (paid/organic search, organic social), average engagement time, and total revenue. Scroll horizontally if needed.
          </p>
          <CityDemographicsTable startDate={startDate} endDate={endDate} />
        </section>

        <section className="mb-12">
          <h2 className="mb-4 text-lg font-semibold text-navy-800">
            CTA to Contact
          </h2>
          <p className="mb-4 text-sm text-slate-600">
            Top 20 pages that send the most visitors to the contact page, and what those visitors do on /contact (form submissions, phone, email, and location clicks).
          </p>
          <ContactCTATable startDate={startDate} endDate={endDate} />
        </section>

        <section className="mb-12">
          <h2 className="mb-4 text-lg font-semibold text-navy-800">
            Sales by visitor source
          </h2>
          <p className="mb-4 text-sm text-slate-600">
            Ecommerce funnel by channel: products viewed, added to cart, entered checkout, and purchases. Paid search (Google Ads), organic search, organic social, organic shopping, and referrals.
          </p>
          <SalesBySourceSection startDate={startDate} endDate={endDate} />
        </section>

        <section className="mb-12">
          <h2 className="mb-4 text-lg font-semibold text-navy-800">
            Lead by Visitor Source
          </h2>
          <p className="mb-4 text-sm text-slate-600">
            Quantity and type of events and leads by visitor source (Direct, Google Ads, Organic search, Organic Social, Organic Shopping, Referral, Other). Scroll horizontally to see all columns.
          </p>
          <LeadBySourceTable startDate={startDate} endDate={endDate} />
        </section>

        <section>
          <h2 className="mb-4 text-lg font-semibold text-navy-800">
            Paths from Homepage
          </h2>
          <p className="mb-4 text-sm text-slate-600">
            Three-level tree: where visitors go after the homepage, then the next two steps. Based on sessions that started on the homepage.
          </p>
          <PathTreeDiagram startDate={startDate} endDate={endDate} />
        </section>
      </div>
    </div>
  );
}

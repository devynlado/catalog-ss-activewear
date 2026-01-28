import { Suspense } from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase';
import { ProductGrid } from '@/components/builder/ProductGrid';
import { ProductGridSkeleton } from '@/components/ui/Skeleton';
import { ArrowLeft, BookOpen } from 'lucide-react';

interface GuidePageProps {
  params: {
    slug: string;
  };
}

interface Guide {
  id: number;
  name: string;
  slug: string;
  type: string;
}

async function getGuideBySlug(slug: string): Promise<Guide | null> {
  const supabase = createServerSupabaseClient();
  
  const { data, error } = await supabase
    .from('categories')
    .select('id, name, slug, type')
    .eq('slug', slug)
    .eq('type', 'guide')
    .eq('is_active', true)
    .single();
  
  if (error || !data) {
    return null;
  }
  
  return data;
}

export async function generateMetadata({ params }: GuidePageProps): Promise<Metadata> {
  const guide = await getGuideBySlug(params.slug);
  
  if (!guide) {
    return {
      title: 'Guide Not Found | Garment Decor',
    };
  }
  
  return {
    title: `${guide.name} | Product Guide | Garment Decor`,
    description: `Browse the ${guide.name} collection. Curated blanks for custom screen printing and embroidery.`,
  };
}

export default async function GuidePage({ params }: GuidePageProps) {
  const guide = await getGuideBySlug(params.slug);
  
  if (!guide) {
    notFound();
  }
  
  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="bg-white border-b border-stone-200">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <Link 
            href="/guides" 
            className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-brand-600 transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Guides
          </Link>
          
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100">
              <BookOpen className="h-6 w-6 text-brand-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">{guide.name}</h1>
              <p className="mt-1 text-slate-600">
                Curated collection for custom decoration
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Product Grid */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Suspense fallback={<ProductGridSkeleton count={20} />}>
          <ProductGrid
            columns={4}
            categoryFilter={guide.id.toString()}
            showPricing={true}
            pageSize={24}
            showPagination={true}
          />
        </Suspense>
      </div>
    </div>
  );
}

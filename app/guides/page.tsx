import { Metadata } from 'next';
import { Suspense } from 'react';
import { createServerSupabaseClient } from '@/lib/supabase';
import { GuidesClient } from '@/components/guides/GuidesClient';

// Force dynamic rendering - this page needs Supabase at runtime
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Product Guides | Garment Decor',
  description: 'Browse our curated product guides and collections. Find the perfect blanks for screen printing and embroidery.',
};

interface GuideProduct {
  id: number;
  name: string;
  style_number: string;
  image_url?: string;
}

interface Guide {
  id: number;
  name: string;
  slug: string;
  productCount?: number;
  topProducts?: GuideProduct[];
}

// Types for Supabase query results
interface CategoryResult {
  id: number;
  name: string;
  slug: string | null;
}

interface ProductCategoryResult {
  style_id: number;
}

interface ProductResult {
  style_id: number;
  style_name: string;
  primary_image_url: string | null;
}

async function getGuides(): Promise<Guide[]> {
  const supabase = createServerSupabaseClient();
  
  const { data, error } = await supabase
    .from('categories')
    .select('id, name, slug')
    .eq('type', 'guide')
    .eq('is_active', true)
    .order('name');
  
  if (error || !data) {
    console.error('Error fetching guides:', error);
    return [];
  }
  
  const categories = data as CategoryResult[];
  
  // Get product counts and top products for each guide
  const guidesWithData: Guide[] = [];
  
  for (const guide of categories) {
    // Get count
    const { count } = await supabase
      .from('product_categories')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', guide.id);
    
    // Get top 3 products for preview
    const { data: productLinks } = await supabase
      .from('product_categories')
      .select('style_id')
      .eq('category_id', guide.id)
      .limit(3);
    
    let topProducts: GuideProduct[] = [];
    
    const links = productLinks as ProductCategoryResult[] | null;
    if (links && links.length > 0) {
      const styleIds = links.map(p => p.style_id);
      const { data: products } = await supabase
        .from('products')
        .select('style_id, style_name, primary_image_url')
        .in('style_id', styleIds)
        .limit(3);
      
      const productResults = products as ProductResult[] | null;
      if (productResults) {
        topProducts = productResults.map(p => ({
          id: p.style_id,
          name: p.style_name,
          style_number: p.style_name,
          image_url: p.primary_image_url || undefined,
        }));
      }
    }
    
    guidesWithData.push({
      id: guide.id,
      name: guide.name,
      slug: guide.slug || '',
      productCount: count || 0,
      topProducts,
    });
  }
  
  // Sort by product count (most products first) and filter out empty guides
  return guidesWithData
    .filter(g => g.productCount && g.productCount > 0)
    .sort((a, b) => (b.productCount || 0) - (a.productCount || 0));
}

// Loading fallback
function GuidesLoading() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-12 w-12 bg-slate-200 rounded-xl mb-4" />
            <div className="h-8 w-48 bg-slate-200 rounded mb-2" />
            <div className="h-4 w-64 bg-slate-200 rounded" />
          </div>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse rounded-xl border border-slate-200 bg-white p-6">
              <div className="h-5 w-3/4 bg-slate-200 rounded mb-2" />
              <div className="h-4 w-1/4 bg-slate-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default async function GuidesPage() {
  const guides = await getGuides();
  
  return (
    <Suspense fallback={<GuidesLoading />}>
      <GuidesClient guides={guides} />
    </Suspense>
  );
}

import { Metadata } from 'next';
import { Suspense } from 'react';
import { createServerSupabaseClient } from '@/lib/supabase';
import { GuidesClient } from '@/components/guides/GuidesClient';

// Cache for 5 minutes (300 seconds) instead of force-dynamic
export const revalidate = 300;

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

interface ProductCategoryWithProduct {
  category_id: number;
  style_id: number;
  products: {
    style_id: number;
    style_name: string;
    primary_image_url: string | null;
  } | null;
}

async function getGuides(): Promise<Guide[]> {
  const supabase = createServerSupabaseClient();
  
  // Query 1: Get all guide categories
  const { data: categories, error } = await supabase
    .from('categories')
    .select('id, name, slug')
    .eq('type', 'guide')
    .eq('is_active', true)
    .order('name');
  
  if (error || !categories || categories.length === 0) {
    console.error('Error fetching guides:', error);
    return [];
  }
  
  const categoryIds = (categories as CategoryResult[]).map(c => c.id);
  
  // Query 2: Get ALL product links for ALL guides in one query (with product details)
  const { data: allProductLinks } = await supabase
    .from('product_categories')
    .select(`
      category_id,
      style_id,
      products:style_id (
        style_id,
        style_name,
        primary_image_url
      )
    `)
    .in('category_id', categoryIds);
  
  // Process results: build count map and top products map
  const countMap = new Map<number, number>();
  const productMap = new Map<number, GuideProduct[]>();
  
  if (allProductLinks) {
    const links = allProductLinks as ProductCategoryWithProduct[];
    
    // Group by category
    links.forEach(link => {
      // Count
      countMap.set(link.category_id, (countMap.get(link.category_id) || 0) + 1);
      
      // Top products (limit to 3 per category)
      if (link.products) {
        const existing = productMap.get(link.category_id) || [];
        if (existing.length < 3) {
          existing.push({
            id: link.products.style_id,
            name: link.products.style_name,
            style_number: link.products.style_name,
            image_url: link.products.primary_image_url || undefined,
          });
          productMap.set(link.category_id, existing);
        }
      }
    });
  }
  
  // Build final guides array
  const guides: Guide[] = (categories as CategoryResult[]).map(cat => ({
    id: cat.id,
    name: cat.name,
    slug: cat.slug || '',
    productCount: countMap.get(cat.id) || 0,
    topProducts: productMap.get(cat.id) || [],
  }));
  
  // Sort by product count (most products first) and filter out empty guides
  return guides
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

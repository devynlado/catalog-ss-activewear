import { client } from './client';
import {
  projectListQuery,
  projectBySlugQuery,
  projectSlugsQuery,
  relatedProjectsQuery,
  categoriesQuery,
  projectArchiveFilterQuery,
} from './queries';
import { projectProductMatchesCategories } from '../portfolio-product-categories';

export interface ProjectListItem {
  _id: string;
  title: string;
  slug: string;
  shortDescription: string | null;
  category: { title: string; slug: string } | null;
  product?: string | null;
  decoration: string;
  client: string | null;
  featuredImage: string | null;
  gallery: string[];
  publishedAt: string | null;
}

export interface ProjectDetail extends ProjectListItem {
  tags: string[] | null;
  product: string | null;
  materials: string | null;
  designName: string | null;
  quantity: string | null;
  turnaround: string | null;
  longDescription: unknown[] | null;
  testimonialQuote: string | null;
  testimonialAuthor: string | null;
  testimonialCompany: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
}

export interface RelatedProject {
  _id: string;
  title: string;
  slug: string;
  shortDescription: string | null;
  category: string | null;
  decoration: string;
  featuredImage: string | null;
  gallery: string | null;
}

export interface PortfolioCategory {
  _id: string;
  title: string;
  slug: string;
}

export async function getProjects(): Promise<ProjectListItem[]> {
  if (!client) return [];
  const data = await client.fetch<ProjectListItem[]>(projectListQuery);
  return data ?? [];
}

export async function getProjectBySlug(slug: string): Promise<ProjectDetail | null> {
  if (!client) return null;
  const data = await client.fetch<ProjectDetail | null>(projectBySlugQuery, { slug });
  return data ?? null;
}

export async function getProjectSlugs(): Promise<string[]> {
  if (!client) return [];
  const data = await client.fetch<string[]>(projectSlugsQuery);
  return data ?? [];
}

export async function getRelatedProjects(
  decoration: string,
  currentSlug: string
): Promise<RelatedProject[]> {
  if (!client) return [];
  const data = await client.fetch<RelatedProject[]>(relatedProjectsQuery, {
    decoration,
    currentSlug,
  });
  return data ?? [];
}

export async function getCategories(): Promise<PortfolioCategory[]> {
  if (!client) return [];
  const data = await client.fetch<PortfolioCategory[]>(categoriesQuery);
  return data ?? [];
}

export interface ArchiveFilterParams {
  decorationSlugs?: string[];
  productCategorySlugs?: string[];
  search?: string;
  limit?: number;
}

/** Build GROQ match pattern for "contains" (case-insensitive); sanitize * and backslash. */
function buildSearchPattern(q: string): string {
  const trimmed = q.trim();
  if (!trimmed) return '';
  const sanitized = trimmed.replace(/[*\\]/g, '').toLowerCase();
  if (!sanitized) return '';
  return `*${sanitized}*`;
}

export async function getProjectsFiltered(
  params: ArchiveFilterParams
): Promise<ProjectListItem[]> {
  const { decorationSlugs, productCategorySlugs, search, limit = 9 } = params;
  const searchPattern = search ? buildSearchPattern(search) : '';
  // When filtering by product category we need to fetch more then filter in memory
  const fetchLimit =
    productCategorySlugs && productCategorySlugs.length > 0 ? 200 : limit;
  if (!client) return [];
  const data = await client.fetch<ProjectListItem[]>(projectArchiveFilterQuery, {
    limit: fetchLimit,
    decorationSlugs: decorationSlugs && decorationSlugs.length > 0 ? decorationSlugs : [],
    searchPattern: searchPattern || '',
  });
  let list = data ?? [];
  if (productCategorySlugs && productCategorySlugs.length > 0) {
    list = list.filter((p) =>
      projectProductMatchesCategories(p.product, productCategorySlugs)
    );
    list = list.slice(0, limit);
  }
  return list;
}

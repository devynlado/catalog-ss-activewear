import { client } from './client';
import {
  blogArticleListQuery,
  blogArticleBySlugQuery,
  blogArticleSlugsQuery,
  blogRelatedArticlesQuery,
  blogCategoriesQuery,
  blogArticlesByCategoryQuery,
} from './blogQueries';

export interface BlogCategory {
  _id: string;
  title: string;
  slug: string;
  articleCount: number;
}

export interface BlogArticleListItem {
  _id: string;
  title: string;
  slug: string;
  category: { title: string; slug: string } | null;
  tags: string[] | null;
  featuredImage: string | null;
  featuredImageAlt: string | null;
  author: string;
  publishedAt: string;
  excerpt: string | null;
}

export interface BlogArticleDetail {
  _id: string;
  title: string;
  slug: string;
  category: { title: string; slug: string } | null;
  tags: string[] | null;
  featuredImage: string | null;
  featuredImageAlt: string | null;
  body: unknown[];
  author: string;
  publishedAt: string;
  metaTitle: string | null;
  metaDescription: string | null;
  plainBody: string | null;
}

/**
 * Estimate reading time from plain text body.
 * Average adult reads ~238 words per minute.
 */
export function estimateReadingTime(plainText: string | null | undefined): number {
  if (!plainText) return 1;
  const words = plainText.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 238));
}

/**
 * Auto-generate meta description from article body if none is provided.
 * Trims to ~155 characters at a word boundary.
 */
export function getAutoMetaDescription(article: BlogArticleDetail): string {
  if (article.metaDescription) return article.metaDescription;
  if (!article.plainBody) return '';
  const text = article.plainBody.replace(/\s+/g, ' ').trim();
  if (text.length <= 155) return text;
  const trimmed = text.slice(0, 155);
  const lastSpace = trimmed.lastIndexOf(' ');
  return (lastSpace > 100 ? trimmed.slice(0, lastSpace) : trimmed) + '...';
}

export async function getBlogArticles(): Promise<BlogArticleListItem[]> {
  if (!client) return [];
  return (await client.fetch<BlogArticleListItem[]>(blogArticleListQuery)) ?? [];
}

export async function getBlogArticleBySlug(slug: string): Promise<BlogArticleDetail | null> {
  if (!client) return null;
  return (await client.fetch<BlogArticleDetail | null>(blogArticleBySlugQuery, { slug })) ?? null;
}

export async function getBlogArticleSlugs(): Promise<string[]> {
  if (!client) return [];
  return (await client.fetch<string[]>(blogArticleSlugsQuery)) ?? [];
}

export async function getBlogRelatedArticles(currentSlug: string): Promise<BlogArticleListItem[]> {
  if (!client) return [];
  return (
    (await client.fetch<BlogArticleListItem[]>(blogRelatedArticlesQuery, { currentSlug })) ?? []
  );
}

export async function getBlogCategories(): Promise<BlogCategory[]> {
  if (!client) return [];
  return (await client.fetch<BlogCategory[]>(blogCategoriesQuery)) ?? [];
}

export async function getBlogArticlesByCategory(
  categorySlug: string
): Promise<BlogArticleListItem[]> {
  if (!client) return [];
  return (
    (await client.fetch<BlogArticleListItem[]>(blogArticlesByCategoryQuery, { categorySlug })) ?? []
  );
}

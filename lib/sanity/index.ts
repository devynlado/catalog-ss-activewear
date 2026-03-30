export { client } from './client';
export {
  projectListQuery,
  projectBySlugQuery,
  projectSlugsQuery,
  relatedProjectsQuery,
  categoriesQuery,
} from './queries';
export {
  getProjects,
  getProjectBySlug,
  getProjectSlugs,
  getRelatedProjects,
  getCategories,
  getProjectsFiltered,
  getProjectsBySlugs,
} from './fetch';
export type { ArchiveFilterParams } from './fetch';

// Blog
export {
  getBlogArticles,
  getBlogArticleBySlug,
  getBlogArticleSlugs,
  getBlogRelatedArticles,
  getBlogCategories,
  getBlogArticlesByCategory,
  estimateReadingTime,
  getAutoMetaDescription,
} from './blogFetch';
export type {
  BlogCategory,
  BlogArticleListItem,
  BlogArticleDetail,
  BlogArticleSlugEntry,
} from './blogFetch';

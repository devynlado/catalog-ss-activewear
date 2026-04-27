import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import type { StructureBuilder } from 'sanity/structure';
import { BarChartIcon } from '@sanity/icons';
import { schemaTypes } from './sanity/schema';
import { ContentAnalyticsTool } from './sanity/tools/ContentAnalyticsTool';

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET!;

const structure = (S: StructureBuilder) =>
  S.list()
    .title('Content')
    .items([
      S.listItem()
        .title('Blog')
        .child(
          S.list()
            .title('Blog')
            .items([
              S.documentTypeListItem('blogArticle').title('Articles'),
              S.documentTypeListItem('blogCategory').title('Categories'),
            ])
        ),
      S.divider(),
      S.listItem()
        .title('Portfolio')
        .child(
          S.list()
            .title('Portfolio')
            .items([
              S.documentTypeListItem('project').title('Projects'),
              S.documentTypeListItem('portfolioCategory').title('Categories'),
            ])
        ),
    ]);

export default defineConfig({
  name: 'garment-decor',
  title: 'Garment Decor CMS',
  projectId,
  dataset,
  basePath: '/studio',
  auth: {
    loginMethod: 'token',
  },
  plugins: [structureTool({ structure })],
  tools: (prev) => [
    ...prev,
    {
      name: 'content-analytics',
      title: 'Analytics',
      icon: BarChartIcon,
      component: ContentAnalyticsTool,
    },
  ],
  schema: {
    types: schemaTypes,
  },
});

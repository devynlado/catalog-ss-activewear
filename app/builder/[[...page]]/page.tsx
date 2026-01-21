import { builder } from '@builder.io/sdk';
import { RenderBuilderContent } from '@/components/builder/RenderBuilderContent';

// Initialize Builder with your API key
builder.init(process.env.NEXT_PUBLIC_BUILDER_API_KEY || '');

interface PageProps {
  params: {
    page?: string[];
  };
}

// Generate static paths for Builder pages
export async function generateStaticParams() {
  // Only generate if Builder API key is configured
  if (!process.env.NEXT_PUBLIC_BUILDER_API_KEY) {
    return [];
  }

  try {
    // Get all pages from Builder
    const pages = await builder.getAll('page', {
      fields: 'data.url',
      options: { noTargeting: true },
    });

    return pages
      .map((page) => ({
        page: page.data?.url?.split('/').filter(Boolean) || [],
      }))
      .filter((params) => params.page.length > 0);
  } catch (error) {
    console.error('Error fetching Builder pages:', error);
    return [];
  }
}

export default async function BuilderPage({ params }: PageProps) {
  // Check if Builder is configured
  if (!process.env.NEXT_PUBLIC_BUILDER_API_KEY) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold text-slate-900">Builder.io Not Configured</h1>
          <p className="mt-2 text-slate-600">
            Add your NEXT_PUBLIC_BUILDER_API_KEY to use visual editing.
          </p>
        </div>
      </div>
    );
  }

  const urlPath = '/builder/' + (params?.page?.join('/') || '');

  // Fetch the Builder content for this page
  const content = await builder
    .get('page', {
      userAttributes: {
        urlPath,
      },
    })
    .toPromise();

  // If no Builder content exists, show placeholder
  if (!content) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold text-slate-900">Page Not Found</h1>
          <p className="mt-2 text-slate-600">
            This Builder page doesn't exist yet. Create it in Builder.io dashboard.
          </p>
        </div>
      </div>
    );
  }

  return <RenderBuilderContent content={content} />;
}

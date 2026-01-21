'use client';

import { BuilderComponent, useIsPreviewing } from '@builder.io/react';
import { BuilderContent } from '@builder.io/sdk';

// Import the registry to ensure components are registered
import '@/lib/builder-registry';

interface RenderBuilderContentProps {
  content: BuilderContent | null;
}

export function RenderBuilderContent({ content }: RenderBuilderContentProps) {
  const isPreviewing = useIsPreviewing();

  // If there's no content and we're not previewing, return null
  if (!content && !isPreviewing) {
    return null;
  }

  return (
    <BuilderComponent
      content={content || undefined}
      model="page"
    />
  );
}

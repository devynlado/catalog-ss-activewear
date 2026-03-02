'use client';

import { PortableText as PT, type PortableTextComponents } from '@portabletext/react';
import type { PortableTextBlock } from '@portabletext/types';

const components: PortableTextComponents = {
  block: {
    h2: ({ children }) => (
      <h2 className="mt-8 mb-4 text-xl font-bold text-slate-900">{children}</h2>
    ),
    h3: ({ children }) => (
      <h3 className="mt-6 mb-3 text-lg font-semibold text-slate-900">{children}</h3>
    ),
    normal: ({ children }) => <p className="mb-4 text-slate-700 leading-relaxed">{children}</p>,
  },
  list: {
    bullet: ({ children }) => <ul className="list-disc pl-6 mb-4 space-y-2 text-slate-700">{children}</ul>,
    number: ({ children }) => <ol className="list-decimal pl-6 mb-4 space-y-2 text-slate-700">{children}</ol>,
  },
  listItem: {
    bullet: ({ children }) => <li>{children}</li>,
    number: ({ children }) => <li>{children}</li>,
  },
};

interface Props {
  value: PortableTextBlock[] | null | undefined;
}

export function PortableText({ value }: Props) {
  if (!value || !Array.isArray(value) || value.length === 0) return null;
  return <PT value={value} components={components} />;
}

'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { Search, ArrowRight } from 'lucide-react';

const DEBOUNCE_MS = 300;

type Props = {
  initialQ: string;
};

export function ArchiveHeroActions({ initialQ }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(initialQ);
  const isFirstMount = useRef(true);

  useEffect(() => {
    setQ(searchParams.get('q') ?? '');
  }, [searchParams]);

  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    const t = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (q.trim()) params.set('q', q.trim());
      else params.delete('q');
      const query = params.toString();
      router.push(query ? `/portfolio/archive?${query}` : '/portfolio/archive');
    }, DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="relative w-full">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by title, client, product, materials..."
          className="w-full rounded-lg border border-stone-200 bg-stone-50 py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-stone-400 focus:border-brand-400 focus:outline-none focus:ring-1 focus:ring-brand-400"
          aria-label="Search projects"
        />
      </div>
      <Link
        href="/portfolio"
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-brand-600 transition-colors"
      >
        View all projects
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

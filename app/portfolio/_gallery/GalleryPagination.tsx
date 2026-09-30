import Link from 'next/link';

type Props = {
  basePath: string;
  currentPage: number;
  totalPages: number;
  decoration?: string;
  blank?: string;
};

function buildHref(
  basePath: string,
  params: { decoration?: string; blank?: string; page: number }
) {
  const sp = new URLSearchParams();
  if (params.decoration?.trim()) sp.set('decoration', params.decoration.trim());
  if (params.blank?.trim()) sp.set('blank', params.blank.trim());
  if (params.page > 1) sp.set('page', String(params.page));
  const qs = sp.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}

export function GalleryPagination({ basePath, currentPage, totalPages, decoration, blank }: Props) {
  if (totalPages <= 1) return null;

  return (
    <nav
      className="mt-12 flex flex-wrap items-center justify-center gap-2"
      aria-label="Gallery pagination"
    >
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
        const isCurrent = p === currentPage;
        return (
          <Link
            key={p}
            href={buildHref(basePath, { decoration, blank, page: p })}
            scroll
            className={`min-w-[2.25rem] rounded-lg px-3 py-2 text-center text-sm font-medium transition-colors ${
              isCurrent
                ? 'bg-navy-800 text-white hover:bg-navy-900'
                : 'bg-stone-100 text-slate-600 hover:bg-stone-200'
            }`}
            aria-current={isCurrent ? 'page' : undefined}
          >
            {p}
          </Link>
        );
      })}
    </nav>
  );
}

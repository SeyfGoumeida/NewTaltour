import Link from 'next/link';
import clsx from 'clsx';
import { ChevronLeft, ChevronRight } from 'lucide-react';

type Params = Record<string, string | number | undefined | null>;

export function buildHref(base: string, params: Params) {
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null && v !== '' && !(k === 'page' && Number(v) <= 1)) q.set(k, String(v));
  const s = q.toString();
  return s ? `${base}?${s}` : base;
}

const cell = 'inline-flex h-9 min-w-9 items-center justify-center rounded-xl border px-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/50';

export default function LinkPagination({ base, page, pages, params = {} }: { base: string; page: number; pages: number; params?: Params }) {
  if (pages <= 1) return null;
  const nums = Array.from(new Set([1, 2, page - 1, page, page + 1, pages - 1, pages].filter((n) => n >= 1 && n <= pages))).sort((a, b) => a - b);
  const href = (p: number) => buildHref(base, { ...params, page: p });
  return (
    <nav className="mt-10 flex flex-wrap items-center justify-center gap-1.5" aria-label="Pagination">
      {page > 1 ? (
        <Link href={href(page - 1)} className={clsx(cell, 'border-line text-soft hover:border-white/25 hover:text-white')} aria-label="Page précédente">
          <ChevronLeft className="h-4 w-4" />
        </Link>
      ) : (
        <span className={clsx(cell, 'border-line text-soft opacity-40')} aria-hidden>
          <ChevronLeft className="h-4 w-4" />
        </span>
      )}
      {nums.map((n, i) => (
        <span key={n} className="flex items-center gap-1.5">
          {i > 0 && n - nums[i - 1] > 1 && <span className="px-1 text-muted">…</span>}
          <Link
            href={href(n)}
            aria-current={n === page ? 'page' : undefined}
            className={clsx(cell, n === page ? 'border-brand-blue bg-brand-blue text-white' : 'border-line text-soft hover:border-white/25 hover:text-white')}
          >
            {n}
          </Link>
        </span>
      ))}
      {page < pages ? (
        <Link href={href(page + 1)} className={clsx(cell, 'border-line text-soft hover:border-white/25 hover:text-white')} aria-label="Page suivante">
          <ChevronRight className="h-4 w-4" />
        </Link>
      ) : (
        <span className={clsx(cell, 'border-line text-soft opacity-40')} aria-hidden>
          <ChevronRight className="h-4 w-4" />
        </span>
      )}
    </nav>
  );
}

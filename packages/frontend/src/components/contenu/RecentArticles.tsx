import Link from 'next/link';
import clsx from 'clsx';
import { Newspaper } from 'lucide-react';
import { dateFr } from '@/lib/format';

export interface ArticleLite { slug: string; titre: string; date_publication: string }

export default function RecentArticles({ items, current }: { items: ArticleLite[]; current?: string }) {
  return (
    <div className="glass p-5">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-soft">
        <Newspaper className="h-4 w-4 text-brand-cyan" /> Articles récents
      </h2>
      {items.length === 0 ? (
        <p className="text-sm text-muted">Aucun autre article.</p>
      ) : (
        <ul className="divide-y divide-line">
          {items.map((a) => (
            <li key={a.slug}>
              <Link
                href={`/actus/${a.slug}`}
                aria-current={a.slug === current ? 'page' : undefined}
                className={clsx('group block py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/50', a.slug === current && 'pointer-events-none opacity-60')}
              >
                <span className="line-clamp-2 text-sm font-medium text-white group-hover:text-brand-cyan">{a.titre}</span>
                <span className="mt-0.5 block text-xs text-muted">Le {dateFr(a.date_publication)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

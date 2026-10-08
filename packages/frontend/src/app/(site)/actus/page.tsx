import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Empty, PageHeader } from '@/components/ui';
import LinkPagination from '@/components/contenu/LinkPagination';
import RecentArticles from '@/components/contenu/RecentArticles';
import { excerpt } from '@/components/contenu/sections';
import { sapi } from '@/lib/server';
import { dateFr } from '@/lib/format';
import type { Article, Paged } from '@/lib/types';

export const metadata: Metadata = {
  title: 'Blog Taltour, location automobile Algérie',
  description: 'Le blog officiel Taltour : nouveautés, options, tourisme et visites guidées en Algérie.',
};

const byline = (a: Article) => `Le ${dateFr(a.date_publication)}${a.auteur ? ` par ${a.auteur}` : ''}`;

export default async function ActusPage(props: { searchParams: Promise<{ page?: string }> }) {
  const searchParams = await props.searchParams;
  const page = Math.max(1, parseInt(searchParams.page || '1', 10) || 1);
  const [data, recents] = await Promise.all([
    sapi<Paged<Article>>(`/articles?page=${page}`),
    page === 1 ? null : sapi<Paged<Article>>('/articles?size=5'),
  ]);
  const pages = Math.max(1, Math.ceil(data.total / data.size));
  const latest = (recents ?? data).items.slice(0, 5);
  const [first, ...rest] = data.items;

  return (
    <>
      <PageHeader eyebrow="Actus" title="BLOG OFFICIEL" highlight="TALTOUR" sub={`${data.total} articles, ${pages} page${pages > 1 ? 's' : ''}`} />
      <section className="container-x py-10 sm:py-14">
        <div className="grid gap-8 lg:grid-cols-[1fr_300px] lg:items-start">
          <div className="min-w-0">
            {!first ? (
              <Empty title="Aucun article">Revenez bientôt pour découvrir nos actualités.</Empty>
            ) : (
              <div className="grid gap-4">
                {page === 1 && (
                  <Link href={`/actus/${first.slug}`} className="glass group relative block overflow-hidden p-6 transition hover:border-white/20 sm:p-8">
                    <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-brand-blue/20 blur-3xl" />
                    <div className="relative">
                      <span className="text-xs font-semibold uppercase tracking-wider text-accent">À la une</span>
                      <h2 className="mt-3 text-2xl font-extrabold tracking-tight group-hover:text-brand-cyan sm:text-3xl">{first.titre}</h2>
                      <p className="mt-2 text-xs text-muted">{byline(first)}</p>
                      <p className="mt-4 max-w-2xl text-sm leading-relaxed text-soft">{excerpt(first.contenu, 320)}</p>
                      <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-cyan">Lire l&apos;article <ArrowRight className="h-4 w-4" /></span>
                    </div>
                  </Link>
                )}
                <div className="grid gap-4 md:grid-cols-2">
                  {(page === 1 ? rest : data.items).map((a) => (
                    <Link key={a.id} href={`/actus/${a.slug}`} className="glass group flex flex-col p-5 transition hover:-translate-y-0.5 hover:border-white/20 sm:p-6">
                      <p className="text-xs text-muted">{byline(a)}</p>
                      <h2 className="mt-2 text-lg font-bold leading-snug group-hover:text-brand-cyan">{a.titre}</h2>
                      <p className="mt-3 line-clamp-4 text-sm leading-relaxed text-muted">{excerpt(a.contenu)}</p>
                      <span className="mt-auto inline-flex items-center gap-1.5 pt-4 text-sm font-semibold text-brand-cyan">Lire la suite <ArrowRight className="h-4 w-4" /></span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
            <LinkPagination base="/actus" page={page} pages={pages} />
          </div>
          <aside className="lg:sticky lg:top-32">
            <RecentArticles items={latest} />
          </aside>
        </div>
      </section>
    </>
  );
}

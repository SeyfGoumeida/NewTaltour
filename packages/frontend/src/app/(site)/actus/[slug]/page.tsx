import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, CalendarDays, UserRound } from 'lucide-react';
import Markdown from '@/components/Markdown';
import { LinkButton } from '@/components/ui';
import RecentArticles, { ArticleLite } from '@/components/contenu/RecentArticles';
import { excerpt } from '@/components/contenu/sections';
import { sapi } from '@/lib/server';
import { dateFr } from '@/lib/format';
import type { Article } from '@/lib/types';

type Detail = Article & { recents: ArticleLite[] };

const load = (slug: string) => sapi<Detail>(`/articles/${encodeURIComponent(slug)}`, { notFoundOn404: true });

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const a = await load(params.slug);
  return { title: a.titre, description: excerpt(a.contenu, 160) };
}

export default async function ArticlePage({ params }: { params: { slug: string } }) {
  const a = await load(params.slug);
  return (
    <>
      <section className="border-b border-line bg-gradient-to-b from-ink-850/60 to-transparent">
        <div className="container-x py-10 sm:py-14">
          <nav aria-label="Fil d'Ariane" className="text-sm text-muted">
            <Link href="/actus" className="inline-flex items-center gap-1.5 hover:text-white"><ArrowLeft className="h-4 w-4" /> BLOG OFFICIEL TALTOUR</Link>
          </nav>
          <h1 className="mt-5 max-w-4xl text-3xl font-extrabold tracking-tight sm:text-5xl">{a.titre}</h1>
          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted">
            <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-4 w-4 text-brand-cyan" /> Le {dateFr(a.date_publication)}</span>
            {a.auteur && <span className="inline-flex items-center gap-1.5"><UserRound className="h-4 w-4 text-brand-cyan" /> par {a.auteur}</span>}
          </div>
        </div>
      </section>
      <section className="container-x py-10 sm:py-14">
        <div className="grid gap-8 lg:grid-cols-[1fr_300px] lg:items-start">
          <article className="glass min-w-0 p-6 sm:p-10">
            <Markdown text={a.contenu} className="prose-taltour max-w-3xl text-[15px] [&>*:last-child]:mb-0 [&>p:first-child]:text-lg [&>p:first-child]:font-semibold [&>p:first-child]:text-white" />
            <div className="mt-10 flex flex-wrap gap-2 border-t border-line pt-6">
              <LinkButton href="/">Louer mon véhicule <ArrowRight className="h-4 w-4" /></LinkButton>
              <LinkButton href="/actus" variant="secondary">Tous les articles</LinkButton>
            </div>
          </article>
          <aside className="lg:sticky lg:top-32">
            <RecentArticles items={a.recents} current={a.slug} />
          </aside>
        </div>
      </section>
    </>
  );
}

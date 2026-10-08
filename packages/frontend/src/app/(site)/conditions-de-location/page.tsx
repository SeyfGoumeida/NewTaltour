import type { Metadata } from 'next';
import { ArrowRight, FileText } from 'lucide-react';
import Markdown from '@/components/Markdown';
import { LinkButton, PageHeader } from '@/components/ui';
import Toc from '@/components/contenu/Toc';
import { splitSections } from '@/components/contenu/sections';
import { splitTitle } from '@/components/contenu/text';
import { sapi } from '@/lib/server';

interface Page { slug: string; titre: string; contenu: string; updated_at: string }

export const metadata: Metadata = {
  title: 'Conditions de location',
  description: 'Conditions générales de location : conducteur, documents, livraison et restitution, kilométrage, assurance et caution, annulation.',
};

export default async function ConditionsPage() {
  const page = await sapi<Page>('/pages/conditions-de-location', { notFoundOn404: true });
  const { intro, sections } = splitSections(page.contenu);
  const [title, highlight] = splitTitle(page.titre, 2);
  const [first, ...rest] = intro.split(/\n{2,}/);

  return (
    <>
      <PageHeader eyebrow="Infos pratiques" title={title} highlight={highlight} sub={first} />
      <section className="container-x py-10 sm:py-14">
        <div className="grid gap-8 lg:grid-cols-[280px_1fr] lg:items-start">
          <aside className="lg:sticky lg:top-32">
            <Toc sections={sections} />
          </aside>
          <div className="min-w-0 space-y-4">
            {rest.length > 0 && (
              <div className="glass flex gap-4 p-5 sm:p-6">
                <FileText className="mt-0.5 h-5 w-5 shrink-0 text-brand-cyan" />
                <Markdown text={rest.join('\n\n')} className="prose-taltour [&>p:last-child]:mb-0" />
              </div>
            )}
            {sections.map((s) => (
              <article key={s.id} id={s.id} className="glass scroll-mt-32 p-5 sm:p-7">
                <h2 className="mb-4 text-xl font-bold">{s.title}</h2>
                <Markdown text={s.body} className="prose-taltour [&>*:last-child]:mb-0" />
              </article>
            ))}
            <div className="flex flex-wrap gap-2 pt-4">
              <LinkButton href="/">Louer mon véhicule <ArrowRight className="h-4 w-4" /></LinkButton>
              <LinkButton href="/faq" variant="secondary">FAQ</LinkButton>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

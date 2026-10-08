import type { Metadata } from 'next';
import { Building, FileText, Server } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import Markdown from '@/components/Markdown';
import { PageHeader } from '@/components/ui';
import { splitSections } from '@/components/contenu/sections';
import { sapi } from '@/lib/server';

interface Page { slug: string; titre: string; contenu: string }

export const metadata: Metadata = { title: 'Taltour Automobile Algérie, Mentions légales' };

const iconFor = (t: string): LucideIcon => (/h[ée]berg/i.test(t) ? Server : /[ée]dit/i.test(t) ? Building : FileText);

export default async function MentionsPage() {
  const page = await sapi<Page>('/pages/mentions-legales', { notFoundOn404: true });
  const { intro, sections } = splitSections(page.contenu);
  const [a, ...b] = page.titre.split(/\s+/);
  return (
    <>
      <PageHeader eyebrow="Infos pratiques" title={a} highlight={b.join(' ') || undefined} />
      <section className="container-x py-10 sm:py-14">
        {intro && <Markdown text={intro} className="prose-taltour mb-6 max-w-3xl" />}
        <div className="grid gap-4 md:grid-cols-2">
          {sections.map((s) => {
            const Icon = iconFor(s.title);
            return (
              <article key={s.id} id={s.id} className="glass p-6 sm:p-8">
                <div className="mb-5 flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-brand-blue/30 bg-brand-blue/10 text-[#7EA6FF]"><Icon className="h-5 w-5" /></span>
                  <h2 className="text-xl font-bold">{s.title}</h2>
                </div>
                <Markdown text={s.body} className="prose-taltour [&>*:last-child]:mb-0" />
              </article>
            );
          })}
        </div>
      </section>
    </>
  );
}

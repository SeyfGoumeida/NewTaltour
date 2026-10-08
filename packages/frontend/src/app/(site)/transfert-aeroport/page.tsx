import type { Metadata } from 'next';
import { Check, Clock, PlaneLanding } from 'lucide-react';
import Markdown from '@/components/Markdown';
import { Eyebrow } from '@/components/ui';
import TransfertForm from '@/components/contenu/TransfertForm';
import { getSite, sapi } from '@/lib/server';

interface Page { slug: string; titre: string; contenu: string }

export const metadata: Metadata = {
  title: 'Transfert Aéroport',
  description: "Transfert de l'aéroport vers votre hôtel ou autre lieu de destination, chauffeurs disponibles 24h/7j. Demandez votre devis transfert.",
};

export default async function TransfertPage() {
  const [site, page] = await Promise.all([getSite(), sapi<Page>('/pages/transfert-aeroport', { notFoundOn404: true })]);
  const aeroports = site.villes.filter((v) => v.aeroport).map((v) => ({ id: v.id, nom: v.nom }));
  const blocks = page.contenu.replace(/\r/g, '').split(/\n{2,}/);
  const desservis = blocks.find((b) => /^a[ée]roports desservis/i.test(b.trim()));
  const list = blocks.filter((b) => b.trim().startsWith('- ')).join('\n').split('\n').map((l) => l.replace(/^-\s+/, '').trim()).filter(Boolean);
  const text = blocks.filter((b) => b !== desservis && !b.trim().startsWith('- ')).join('\n\n');
  const [titleA, ...titleB] = page.titre.split(/\s+/);

  return (
    <>
      <section className="relative overflow-hidden border-b border-line">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -right-32 -top-20 h-[420px] w-[620px] rounded-full bg-brand-cyan/10 blur-[120px]" />
          <div className="absolute -left-40 bottom-0 h-[300px] w-[500px] rounded-full bg-brand-blue/15 blur-[120px]" />
        </div>
        <div className="container-x relative py-12 sm:py-16">
          <Eyebrow>24h/7j</Eyebrow>
          <h1 className="mt-5 text-3xl font-extrabold tracking-tight sm:text-5xl">
            {titleA} <span className="text-grad">{titleB.join(' ')}</span>
          </h1>
          <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_1.15fr] lg:items-start">
            <div>
              <Markdown text={text} className="prose-taltour max-w-xl text-base [&>*:last-child]:mb-0" />
              {list.length > 0 && (
                <ul className="mt-6 grid gap-2.5">
                  {list.map((l) => (
                    <li key={l} className="flex items-center gap-2.5 text-sm text-soft">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-ok/15 text-ok"><Check className="h-3.5 w-3.5" /></span> {l}
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-8">
                <div className="mb-3 text-sm font-medium text-muted">Aéroports desservis</div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {aeroports.map((a) => (
                    <div key={a.id} className="glass-soft flex items-center gap-2.5 px-3 py-3 text-sm font-medium text-white">
                      <PlaneLanding className="h-4 w-4 shrink-0 text-brand-cyan" /> {a.nom}
                    </div>
                  ))}
                </div>
              </div>
              <div className="glass-soft mt-6 flex items-center gap-3 p-4 text-sm text-soft">
                <Clock className="h-5 w-5 shrink-0 text-accent" /> Nos chauffeurs sont disponibles 24h/7j au rendez-vous.
              </div>
            </div>
            <div id="devis" className="glass scroll-mt-32 p-6 sm:p-8">
              <h2 className="text-2xl font-extrabold tracking-tight">Devis <span className="text-grad">Transfert</span></h2>
              <p className="mb-6 mt-1 text-sm text-muted">Décrivez votre arrivée, nous vous répondons avec un prix tout inclus.</p>
              <TransfertForm aeroports={aeroports} />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

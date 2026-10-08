import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Award, CalendarCheck2, CarFront, Compass, Lock, MapPin, PlaneLanding, Sparkles, Star, Trophy, Zap } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import Markdown from '@/components/Markdown';
import { Eyebrow, LinkButton } from '@/components/ui';
import { splitSections } from '@/components/contenu/sections';
import { nombre } from '@/components/contenu/text';
import { getSite, sapi } from '@/lib/server';
import { euro } from '@/lib/format';
import type { Modele } from '@/lib/types';

interface Page { slug: string; titre: string; contenu: string }

export const metadata: Metadata = {
  title: 'Simple comme Taltour',
  description: "Louer une voiture dans toute l'Algérie : service de qualité depuis 2003, devis gratuit et immédiat, véhicules neufs, paiement sécurisé en ligne, livraison à l'aéroport.",
};

const ICONS: [RegExp, LucideIcon][] = [
  [/choisissez|faites le tour/i, Compass],
  [/qualit|depuis/i, Award],
  [/devis/i, Zap],
  [/v[ée]hicules|carte/i, CarFront],
  [/paiement|s[ée]curis/i, Lock],
  [/a[ée]roport/i, PlaneLanding],
];

const iconFor = (t: string) => ICONS.find(([r]) => r.test(t))?.[1] ?? Sparkles;

export default async function SimplePage() {
  const [site, page, modeles] = await Promise.all([
    getSite(),
    sapi<Page>('/pages/simple-comme-taltour', { notFoundOn404: true }),
    sapi<Modele[]>('/modeles'),
  ]);
  const { intro, sections } = splitSections(page.contenu);
  const [hero, ...blocks] = sections;
  const visual = modeles.find((m) => m.slug === 'chery-tiggo-7-pro') ?? modeles[0];
  const minPrix = Math.min(...modeles.flatMap((m) => m.tarifs.filter((t) => t.jours === 1).map((t) => Number(t.prix))));
  const stats = [
    { icon: CalendarCheck2, v: `${site.entreprise.depuis}`, l: 'implanté depuis' },
    { icon: Trophy, v: `${site.stats.modeles}`, l: 'modèles différents' },
    { icon: Star, v: nombre(site.stats.avis), l: 'avis clients' },
    { icon: MapPin, v: `${site.villes.length}`, l: 'villes desservies' },
  ];

  return (
    <>
      <section className="relative overflow-hidden border-b border-line">
        <div className="pointer-events-none absolute inset-0">
          {visual?.image && <img src={visual.image} alt="" className="absolute right-0 top-0 h-full w-full object-cover opacity-25 [mask-image:linear-gradient(90deg,transparent_10%,black_70%)] lg:w-[60%]" />}
          <div className="absolute inset-0 bg-gradient-to-t from-ink-900 via-ink-900/60 to-transparent" />
          <div className="absolute -left-40 top-0 h-[380px] w-[560px] rounded-full bg-brand-blue/20 blur-[120px]" />
        </div>
        <div className="container-x relative py-14 sm:py-20">
          <Eyebrow>Simple comme {site.nom}</Eyebrow>
          <h1 className="mt-6 max-w-3xl text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-6xl">
            {page.titre.replace(/\s+\S+$/, '')} <span className="text-grad">{page.titre.split(/\s+/).pop()}</span>
          </h1>
          {intro && <Markdown text={intro} className="prose-taltour mt-6 max-w-2xl" />}
          {hero && (
            <div className="mt-8 max-w-2xl">
              <h2 className="text-xl font-bold text-accent sm:text-2xl">{hero.title}</h2>
              <Markdown text={hero.body} className="prose-taltour mt-3 [&>*:last-child]:mb-0" />
            </div>
          )}
          <div className="mt-8 flex flex-wrap gap-3">
            <LinkButton href="/" size="lg">Louer mon véhicule <ArrowRight className="h-4 w-4" /></LinkButton>
            <LinkButton href="/tarifs" size="lg" variant="secondary">Voir les tarifs</LinkButton>
          </div>
        </div>
      </section>

      <section className="container-x -mt-px py-10">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.l} className="glass flex items-center gap-4 p-4 sm:p-5">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent"><s.icon className="h-5 w-5" /></span>
              <div className="min-w-0">
                <div className="font-display text-2xl font-extrabold text-white">{s.v}</div>
                <div className="text-xs text-muted">{s.l}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="container-x pb-6">
        <div className="grid gap-4 lg:grid-cols-2">
          {blocks.map((b, i) => {
            const Icon = iconFor(b.title);
            return (
              <article key={b.id} id={b.id} className={`glass scroll-mt-32 p-6 sm:p-8 ${i === blocks.length - 1 && blocks.length % 2 === 1 ? 'lg:col-span-2' : ''}`}>
                <div className="flex items-center gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-brand-blue/30 bg-brand-blue/10 text-[#7EA6FF]"><Icon className="h-6 w-6" /></span>
                  <div>
                    <span className="font-display text-xs font-bold text-muted">{String(i + 1).padStart(2, '0')}</span>
                    <h2 className="text-xl font-bold leading-snug">{b.title}</h2>
                  </div>
                </div>
                <Markdown text={b.body} className="prose-taltour mt-5 [&>*:last-child]:mb-0" />
              </article>
            );
          })}
        </div>
      </section>

      <section className="container-x mt-10">
        <div className="glass relative overflow-hidden p-8 sm:p-10">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-accent/15 blur-3xl" />
          <div className="relative grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-center">
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight">Prêt à <span className="text-grad">faire le tour ?</span></h2>
              <p className="mt-3 text-soft">
                Indiquez vos dates et lieux de location, vous obtenez sans délai nos disponibilités et nos tarifs{Number.isFinite(minPrix) ? `, à partir de ${euro(minPrix)} / jour` : ''}.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 lg:justify-end">
              <LinkButton href="/" size="lg">Louer mon véhicule <ArrowRight className="h-4 w-4" /></LinkButton>
              <Link href="/avis" className="inline-flex h-12 items-center gap-2 rounded-xl px-4 text-sm font-semibold text-brand-cyan hover:underline">
                Lire les {nombre(site.stats.avis)} avis
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

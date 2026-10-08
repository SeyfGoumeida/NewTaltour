import type { Metadata } from 'next';
import clsx from 'clsx';
import { ArrowRight, Check } from 'lucide-react';
import { Badge, LinkButton, PageHeader } from '@/components/ui';
import { OptionIcon } from '@/components/contenu/optionIcons';
import { optionPrixLabel } from '@/lib/format';
import { getSite, sapi } from '@/lib/server';
import type { Option } from '@/lib/types';

export const metadata: Metadata = {
  title: 'Options',
  description: 'Client VIP, Assurance Gold, kilométrage illimité, véhicule avec chauffeur, sièges enfant, livraison à domicile : toutes les options de location.',
};

const FEATURED = ['gold', 'vip'];

const titre = (o: Option) => o.libelle_court || o.libelle;
const sousTitre = (o: Option) => (o.libelle_court && o.libelle_court !== o.libelle ? o.libelle : null);

function PriceTag({ o, big }: { o: Option; big?: boolean }) {
  if (!o.actif) return <Badge tone="muted">Sur demande</Badge>;
  return (
    <span className={clsx('inline-flex items-baseline gap-1 rounded-lg font-display font-bold text-white', big ? 'text-2xl' : 'bg-white/[0.06] px-2.5 py-1 text-sm')}>
      {o.type_prix === 'pourcentage' && <span className={clsx('font-sans font-medium text-muted', big ? 'text-sm' : 'text-[11px]')}>+</span>}
      {optionPrixLabel(o)}
    </span>
  );
}

export default async function OptionsPage() {
  const [site, options] = await Promise.all([getSite(), sapi<Option[]>('/options')]);
  const featured = FEATURED.map((c) => options.find((o) => o.code === c)).filter(Boolean) as Option[];
  const others = [...options.filter((o) => !FEATURED.includes(o.code) && o.actif), ...options.filter((o) => !FEATURED.includes(o.code) && !o.actif)];

  return (
    <>
      <PageHeader eyebrow={`${site.nom} à la carte`} title="Nos" highlight="Options" sub="Personnalisez votre location : toutes les options s'ajoutent en un clic au moment de la réservation." />

      <section className="container-x py-10 sm:py-14">
        <div className="grid gap-4 lg:grid-cols-2">
          {featured.map((o) => {
            const gold = o.code === 'gold';
            return (
              <article
                key={o.id}
                className={clsx(
                  'glass relative overflow-hidden p-6 sm:p-8',
                  gold ? 'bg-gradient-to-br from-gold/[0.12] via-ink-850/70 to-ink-850/70' : 'bg-gradient-to-br from-brand-blue/[0.18] via-ink-850/70 to-ink-850/70',
                )}
              >
                <div className={clsx('pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full blur-3xl', gold ? 'bg-gold/15' : 'bg-brand-cyan/15')} />
                <div className="relative">
                  <div className="flex items-start justify-between gap-4">
                    <span className={clsx('flex h-14 w-14 items-center justify-center rounded-2xl border', gold ? 'border-gold/30 bg-gold/10 text-gold' : 'border-brand-cyan/30 bg-brand-cyan/10 text-brand-cyan')}>
                      <OptionIcon code={o.code} className="h-7 w-7" />
                    </span>
                    <div className="text-right">
                      <Badge tone={gold ? 'gold' : 'info'}>Recommandé</Badge>
                      <div className="mt-2"><PriceTag o={o} big /></div>
                    </div>
                  </div>
                  <h2 className="mt-6 text-2xl font-extrabold tracking-tight">{titre(o)}</h2>
                  {sousTitre(o) && <p className="mt-1 text-sm font-medium text-soft">{sousTitre(o)}</p>}
                  {o.description && <p className="mt-4 text-sm leading-relaxed text-soft">{o.description}</p>}
                  {gold && (
                    <ul className="mt-5 grid gap-2 text-sm text-soft sm:grid-cols-2">
                      <li className="flex items-center gap-2"><Check className="h-4 w-4 text-ok" /> Sans caution ni passeport</li>
                      <li className="flex items-center gap-2"><Check className="h-4 w-4 text-ok" /> Vol et incendie couverts</li>
                      <li className="flex items-center gap-2"><Check className="h-4 w-4 text-ok" /> Sinistre responsable ou pas</li>
                      <li className="flex items-center gap-2"><Check className="h-4 w-4 text-ok" /> {site.tarification.reserve_gold} € de réserve restitués</li>
                    </ul>
                  )}
                  {o.code === 'vip' && (
                    <p className="mt-5 text-sm font-semibold text-white">Prenez l&apos;option VIP et soyez tranquile !</p>
                  )}
                </div>
              </article>
            );
          })}
        </div>

        <div className="mt-12 flex items-end justify-between gap-4">
          <h2 className="text-2xl font-extrabold tracking-tight">Toutes les <span className="text-grad">options</span></h2>
          <span className="hidden text-sm text-muted sm:block">{options.filter((o) => o.actif).length} options disponibles à la réservation</span>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {others.map((o) => (
            <article key={o.id} className={clsx('glass flex flex-col p-5 sm:p-6', !o.actif && 'opacity-80')}>
              <div className="flex items-start justify-between gap-3">
                <span className={clsx('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border', o.actif ? 'border-brand-blue/30 bg-brand-blue/10 text-[#7EA6FF]' : 'border-line bg-white/[0.04] text-muted')}>
                  <OptionIcon code={o.code} className="h-5 w-5" />
                </span>
                <PriceTag o={o} />
              </div>
              <h3 className="mt-4 text-base font-semibold first-letter:uppercase">{titre(o)}</h3>
              {o.description && <p className="mt-2 text-sm leading-relaxed text-muted">{o.description}</p>}
            </article>
          ))}
        </div>

        <div className="glass mt-12 flex flex-col items-start justify-between gap-5 p-6 sm:flex-row sm:items-center sm:p-8">
          <div>
            <h2 className="text-xl font-bold">Ajoutez vos options lors de la réservation</h2>
            <p className="mt-1 text-sm text-muted">Les options marquées « Sur demande » sont à réserver auprès de notre équipe.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <LinkButton href="/">Louer mon véhicule <ArrowRight className="h-4 w-4" /></LinkButton>
            <LinkButton href="/contact" variant="secondary">Nous contacter</LinkButton>
          </div>
        </div>
      </section>
    </>
  );
}

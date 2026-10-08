'use client';

import Link from 'next/link';
import clsx from 'clsx';
import { useState } from 'react';
import { ArrowRight, ChevronDown, DoorOpen, Fuel, Gauge, LayoutList, Table2, Users, Zap } from 'lucide-react';
import { CATEGORY_FILTERS, CategoryFilter, categoryLabel, matchCategory } from '@/components/CarSpecs';
import { Badge, LinkButton, Tabs } from '@/components/ui';
import { euro } from '@/lib/format';
import type { Modele } from '@/lib/types';
import FicheTechnique from './FicheTechnique';

type View = 'fiches' | 'tableau';

const boiteLabel = (m: Modele) => (m.boite === 'automatique' ? 'Automatique' : 'Manuelle');
const carbLabel = (m: Modele) => (m.carburant === 'diesel' ? 'Diesel' : 'Essence');

function prix(m: Modele, j: number) {
  const t = m.tarifs.find((x) => x.jours === j);
  return t ? euro(t.prix) : '-';
}

function Specs({ m }: { m: Modele }) {
  const items = [
    m.places != null && { icon: <Users className="h-3.5 w-3.5" />, label: `${m.places} places` },
    m.portes != null && { icon: <DoorOpen className="h-3.5 w-3.5" />, label: `${m.portes} portes` },
    { icon: <Gauge className="h-3.5 w-3.5" />, label: boiteLabel(m) },
    { icon: <Fuel className="h-3.5 w-3.5" />, label: carbLabel(m) },
    m.puissance_ch != null && { icon: <Zap className="h-3.5 w-3.5" />, label: `${m.puissance_ch} ch` },
  ].filter(Boolean) as { icon: React.ReactNode; label: string }[];
  return (
    <ul className="flex flex-wrap gap-1.5">
      {items.map((it) => (
        <li key={it.label} className="chip">
          <span className="text-brand-cyan">{it.icon}</span> {it.label}
        </li>
      ))}
    </ul>
  );
}

function ModelCard({ m, forfaits }: { m: Modele; forfaits: number[] }) {
  const [open, setOpen] = useState(false);
  const cat = categoryLabel(m);
  const panel = `fiche-${m.slug}`;
  return (
    <article className="glass overflow-hidden p-0">
      <div className="grid gap-0 md:grid-cols-[260px_1fr] lg:grid-cols-[300px_1fr]">
        <Link href={`/modeles/${m.slug}`} className="group relative block aspect-[16/10] overflow-hidden bg-white md:aspect-auto md:h-full">
          {m.image && <img src={m.image} alt={m.nom_affiche} loading="lazy" className="h-full w-full object-contain p-3 transition duration-500 group-hover:scale-105" />}
          {cat && <Badge tone="info" className="absolute left-3 top-3 bg-ink-900/85 backdrop-blur">{cat}</Badge>}
        </Link>
        <div className="flex min-w-0 flex-col gap-4 p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-lg font-bold leading-snug text-white">{m.nom_affiche}</h3>
              <p className="mt-0.5 text-xs text-muted">{m.marque}</p>
            </div>
            <div className="text-right">
              <div className="text-[11px] uppercase tracking-wide text-muted">Basse saison 1j</div>
              <div className="font-display text-2xl font-extrabold text-white">{prix(m, 1)}</div>
            </div>
          </div>
          <Specs m={m} />
          <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-7">
            <div className="rounded-xl border border-accent/25 bg-accent/[0.07] px-3 py-2">
              <dt className="text-[11px] text-muted">Montant caution</dt>
              <dd className="mt-0.5 text-sm font-bold text-white">{euro(m.caution)}</dd>
            </div>
            {forfaits.map((j) => (
              <div key={j} className="glass-soft px-3 py-2">
                <dt className="text-[11px] text-muted">Basse saison {j}j</dt>
                <dd className="mt-0.5 text-sm font-bold text-white">{prix(m, j)}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-auto flex flex-wrap items-center gap-2">
            <LinkButton href={`/modeles/${m.slug}`} size="sm">
              Réserver <ArrowRight className="h-4 w-4" />
            </LinkButton>
            <LinkButton href={`/modeles/${m.slug}`} size="sm" variant="secondary">
              Voir la fiche
            </LinkButton>
            {m.fiche && (
              <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                aria-expanded={open}
                aria-controls={panel}
                className="ml-auto inline-flex h-9 items-center gap-1.5 rounded-xl px-3 text-sm font-medium text-brand-cyan hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/50"
              >
                Fiche technique <ChevronDown className={clsx('h-4 w-4 transition', open && 'rotate-180')} />
              </button>
            )}
          </div>
        </div>
      </div>
      {m.fiche && open && (
        <div id={panel} className="border-t border-line bg-ink-900/40 p-4 sm:p-6">
          <FicheTechnique fiche={m.fiche} />
        </div>
      )}
    </article>
  );
}

function PriceTable({ list, forfaits }: { list: Modele[]; forfaits: number[] }) {
  return (
    <div className="glass overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[920px] border-collapse text-sm">
          <caption className="sr-only">Tarifs basse saison par forfait</caption>
          <thead>
            <tr className="border-b border-line bg-white/[0.03] text-left text-xs text-muted">
              <th scope="col" className="sticky left-0 z-10 bg-ink-850 px-4 py-3 font-semibold md:static md:bg-transparent">Véhicule</th>
              <th scope="col" className="px-3 py-3 text-right font-semibold">Montant caution</th>
              {forfaits.map((j) => (
                <th key={j} scope="col" className="px-3 py-3 text-right font-semibold">
                  <span className="block text-[10px] font-medium uppercase tracking-wide text-muted/80">Basse saison</span>
                  <span className="text-white">{j}j</span>
                </th>
              ))}
              <th scope="col" className="px-4 py-3"><span className="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            {list.map((m) => {
              const cat = categoryLabel(m);
              return (
                <tr key={m.id} className="border-b border-line/70 last:border-0 hover:bg-white/[0.025]">
                  <th scope="row" className="sticky left-0 z-10 bg-ink-850 px-4 py-2.5 text-left font-normal md:static md:bg-transparent">
                    <Link href={`/modeles/${m.slug}`} className="flex items-center gap-3 hover:text-white">
                      <span className="hidden h-10 w-16 shrink-0 overflow-hidden rounded-lg bg-white sm:block">
                        {m.image && <img src={m.image} alt="" loading="lazy" className="h-full w-full object-contain" />}
                      </span>
                      <span className="min-w-0">
                        <span className="block max-w-[220px] truncate font-semibold text-white" title={m.nom_affiche}>{m.nom_affiche}</span>
                        <span className="text-xs text-muted">{[cat, carbLabel(m), boiteLabel(m)].filter(Boolean).join(' · ')}</span>
                      </span>
                    </Link>
                  </th>
                  <td className="px-3 py-2.5 text-right text-soft">{euro(m.caution)}</td>
                  {forfaits.map((j) => (
                    <td key={j} className={clsx('px-3 py-2.5 text-right tabular-nums', j === 1 ? 'font-bold text-white' : 'text-soft')}>{prix(m, j)}</td>
                  ))}
                  <td className="px-4 py-2.5 text-right">
                    <Link href={`/modeles/${m.slug}`} className="inline-flex items-center gap-1 whitespace-nowrap text-xs font-semibold text-accent hover:underline">
                      Réserver <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function TarifsView({ modeles, forfaits }: { modeles: Modele[]; forfaits: number[] }) {
  const [f, setF] = useState<CategoryFilter>('tous');
  const [view, setView] = useState<View>('fiches');
  const list = modeles.filter((m) => matchCategory(m, f));
  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <Tabs value={f} onChange={setF} items={CATEGORY_FILTERS.map((c) => ({ value: c.value, label: c.label }))} />
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted" aria-live="polite">{list.length} véhicule{list.length > 1 ? 's' : ''}</span>
          <div className="inline-flex rounded-xl border border-line bg-white/[0.03] p-1" role="group" aria-label="Affichage">
            {([
              { v: 'fiches', label: 'Fiches', icon: <LayoutList className="h-4 w-4" /> },
              { v: 'tableau', label: 'Tableau', icon: <Table2 className="h-4 w-4" /> },
            ] as const).map((b) => (
              <button
                key={b.v}
                type="button"
                onClick={() => setView(b.v)}
                aria-pressed={view === b.v}
                className={clsx(
                  'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/50',
                  view === b.v ? 'bg-white/[0.1] text-white' : 'text-muted hover:text-white',
                )}
              >
                {b.icon} {b.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      {list.length === 0 ? (
        <p className="glass py-14 text-center text-sm text-muted">Aucun véhicule dans cette catégorie.</p>
      ) : view === 'tableau' ? (
        <PriceTable list={list} forfaits={forfaits} />
      ) : (
        <div className="grid gap-4">
          {list.map((m) => (
            <ModelCard key={m.id} m={m} forfaits={forfaits} />
          ))}
        </div>
      )}
    </div>
  );
}

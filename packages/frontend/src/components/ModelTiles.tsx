'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import CarSpecs, { CATEGORY_FILTERS, CategoryFilter, categoryLabel, matchCategory } from './CarSpecs';
import { Badge, Tabs } from './ui';
import { euro } from '@/lib/format';
import type { Modele } from '@/lib/types';

export default function ModelTiles({ modeles, limit = 8 }: { modeles: Modele[]; limit?: number }) {
  const [f, setF] = useState<CategoryFilter>('tous');
  const list = modeles.filter((m) => matchCategory(m, f));
  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Tabs value={f} onChange={setF} items={CATEGORY_FILTERS.map((c) => ({ value: c.value, label: c.label }))} />
        <Link href="/tarifs" className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-cyan hover:underline">
          Tous les véhicules <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {list.slice(0, limit).map((m, i) => {
          const t1 = m.tarifs.find((t) => t.jours === 1);
          const t7 = m.tarifs.find((t) => t.jours === 7);
          const cat = categoryLabel(m);
          return (
            <Link key={m.id} href={`/modeles/${m.slug}`} className={`group overflow-hidden ${i >= 4 ? 'max-sm:hidden ' : ''} rounded-2xl border border-line bg-ink-850/70 transition hover:-translate-y-0.5 hover:border-white/20`}>
              <div className="relative aspect-[16/10] overflow-hidden bg-white">
                {m.image && <img src={m.image} alt={m.nom_affiche} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />}
                {cat && <Badge tone="info" className="absolute left-3 top-3 bg-ink-900/85 backdrop-blur">{cat}</Badge>}
              </div>
              <div className="p-4">
                <h3 className="line-clamp-1 text-sm font-semibold text-white" title={m.nom_affiche}>{m.nom_affiche}</h3>
                <CarSpecs m={m} className="mt-2" />
                <div className="mt-4 flex items-end justify-between">
                  <div>
                    <span className="font-display text-xl font-bold text-white">{euro(t1?.prix)}</span>
                    <span className="text-xs text-muted"> / jour</span>
                  </div>
                  {t7 && <span className="text-right text-[11px] leading-tight text-muted">Forfait 7 jours<br /><span className="font-semibold text-soft">{euro(t7.prix)}</span></span>}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
      {list.length === 0 && <p className="py-10 text-center text-sm text-muted">Aucun véhicule dans cette catégorie.</p>}
    </div>
  );
}

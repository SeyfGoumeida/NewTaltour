'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import clsx from 'clsx';
import { ArrowRight, CalendarDays, Car, MapPin, Tag } from 'lucide-react';
import { useSite } from './providers';
import { defaultDates } from '@/lib/format';

export interface SearchValues {
  depart: number;
  retour: number;
  date_depart: string;
  date_retour: string;
  modele?: string;
  promo?: string;
}

const HOURS = Array.from({ length: 48 }, (_, i) => `${String(Math.floor(i / 2)).padStart(2, '0')}:${i % 2 ? '30' : '00'}`);

export function searchQuery(v: SearchValues) {
  const p = new URLSearchParams({ depart: String(v.depart), retour: String(v.retour), date_depart: v.date_depart, date_retour: v.date_retour });
  if (v.modele) p.set('modele', v.modele);
  if (v.promo) p.set('promo', v.promo);
  return p.toString();
}

function Cell({ icon, label, children, className }: { icon: React.ReactNode; label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={clsx('flex min-w-0 items-center gap-3 px-4 py-3', className)}>
      <span className="shrink-0 text-slate-500">{icon}</span>
      <div className="min-w-0 flex-1">
        <span className="block text-[11px] font-medium text-slate-500">{label}</span>
        {children}
      </div>
    </div>
  );
}

export default function SearchForm({
  initial,
  modeles,
  onSearch,
  compact,
  submitLabel = 'Rechercher',
}: {
  initial?: Partial<SearchValues>;
  modeles?: { slug: string; nom: string }[];
  onSearch?: (v: SearchValues) => void;
  compact?: boolean;
  submitLabel?: string;
}) {
  const site = useSite();
  const router = useRouter();
  const first = site.villes[0]?.id ?? 1;
  const defaults = useMemo(defaultDates, []);
  const [v, setV] = useState<SearchValues>({
    depart: initial?.depart ?? first,
    retour: initial?.retour ?? initial?.depart ?? first,
    date_depart: initial?.date_depart ?? defaults.date_depart,
    date_retour: initial?.date_retour ?? defaults.date_retour,
    modele: initial?.modele ?? '',
    promo: initial?.promo ?? '',
  });
  const [retourTouched, setRetourTouched] = useState(initial?.retour !== undefined && initial.retour !== initial.depart);
  const [error, setError] = useState<string | null>(null);
  const set = (patch: Partial<SearchValues>) => setV((x) => ({ ...x, ...patch }));
  const today = new Date().toISOString().slice(0, 10);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (v.date_retour <= v.date_depart) return setError('La date de retour doit être postérieure à la date de départ');
    setError(null);
    if (onSearch) onSearch(v);
    else router.push(`/location?${searchQuery(v)}`);
  };

  const dateCell = (key: 'date_depart' | 'date_retour', label: string) => {
    const [d, h] = v[key].split('T');
    return (
      <Cell icon={<CalendarDays className="h-4 w-4" />} label={label}>
        <div className="flex items-center gap-2">
          <input type="date" required min={key === 'date_depart' ? today : d < today ? today : v.date_depart.slice(0, 10)} value={d}
            onChange={(e) => {
              const nd = `${e.target.value}T${h}`;
              if (key === 'date_depart' && nd >= v.date_retour) {
                const r = new Date(new Date(`${nd}:00Z`).getTime() + 7 * 86_400_000).toISOString().slice(0, 16);
                set({ date_depart: nd, date_retour: r });
              } else set({ [key]: nd });
            }}
            className="field-light w-[8.6rem] [color-scheme:light]" aria-label={`${label} (date)`} />
          <select value={h} onChange={(e) => set({ [key]: `${d}T${e.target.value}` })} className="field-light w-auto cursor-pointer" aria-label={`${label} (heure)`}>
            {HOURS.map((x) => <option key={x}>{x}</option>)}
          </select>
        </div>
      </Cell>
    );
  };

  const cityCell = (key: 'depart' | 'retour', label: string) => (
    <Cell icon={<MapPin className="h-4 w-4" />} label={label}>
      <select value={v[key]} className="field-light cursor-pointer" aria-label={label}
        onChange={(e) => {
          const id = Number(e.target.value);
          if (key === 'depart') set(retourTouched ? { depart: id } : { depart: id, retour: id });
          else { setRetourTouched(true); set({ retour: id }); }
        }}>
        {site.villes.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
      </select>
    </Cell>
  );

  return (
    <form onSubmit={submit} className="w-full">
      <div className="rounded-2xl bg-white text-ink-900 shadow-bar">
        <div className={clsx('grid divide-slate-200 max-lg:divide-y lg:divide-x', compact ? 'lg:grid-cols-[1fr_1fr_1.25fr_1.25fr_auto]' : 'lg:grid-cols-[1fr_1fr_1.25fr_1.25fr_auto]')}>
          {cityCell('depart', 'Ville de départ')}
          {cityCell('retour', 'Ville de retour')}
          {dateCell('date_depart', 'Date de départ')}
          {dateCell('date_retour', 'Date de retour')}
          <div className="p-2.5">
            <button type="submit" className="flex h-full min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-grad-accent px-6 font-semibold text-white shadow-glow transition hover:brightness-110">
              {submitLabel} <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
        {!compact && (
          <div className="grid border-t border-slate-200 sm:grid-cols-2 sm:divide-x sm:divide-slate-200">
            <Cell icon={<Car className="h-4 w-4" />} label="Choix du modèle">
              <select value={v.modele} onChange={(e) => set({ modele: e.target.value })} className="field-light cursor-pointer font-medium">
                <option value="">tous les modèles</option>
                {(modeles ?? []).map((m) => <option key={m.slug} value={m.slug}>{m.nom}</option>)}
              </select>
            </Cell>
            <Cell icon={<Tag className="h-4 w-4" />} label="Code de promotion" className="max-sm:border-t max-sm:border-slate-200">
              <input value={v.promo} onChange={(e) => set({ promo: e.target.value.toUpperCase() })} placeholder="Facultatif" className="field-light font-medium uppercase" />
            </Cell>
          </div>
        )}
      </div>
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
    </form>
  );
}

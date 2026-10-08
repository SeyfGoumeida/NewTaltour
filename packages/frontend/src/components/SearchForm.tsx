'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { ArrowRight, Car, ChevronDown, MapPin, Tag } from 'lucide-react';
import DateTimePicker from './DateTimePicker';
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

export function searchQuery(v: SearchValues) {
  const p = new URLSearchParams({ depart: String(v.depart), retour: String(v.retour), date_depart: v.date_depart, date_retour: v.date_retour });
  if (v.modele) p.set('modele', v.modele);
  if (v.promo) p.set('promo', v.promo);
  return p.toString();
}

const addDays = (dt: string, n: number) => new Date(new Date(`${dt}:00Z`).getTime() + n * 86_400_000).toISOString().slice(0, 16);

function SelectCell({ icon, label, value, display, onChange, children }: {
  icon: React.ReactNode; label: string; value: string | number; display: string; onChange: (v: string) => void; children: React.ReactNode;
}) {
  return (
    <label className="relative flex min-w-0 cursor-pointer items-center gap-3 px-4 py-3 focus-within:bg-slate-50">
      <span className="shrink-0 text-slate-500">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-[11px] font-medium text-slate-500">{label}</span>
        <span className="block truncate text-sm font-semibold text-ink-900">{display}</span>
      </span>
      <ChevronDown className="h-4 w-4 shrink-0 text-slate-500" />
      <select value={value} onChange={(e) => onChange(e.target.value)} aria-label={label} className="absolute inset-0 h-full w-full cursor-pointer opacity-0">
        {children}
      </select>
    </label>
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
  const set = (patch: Partial<SearchValues>) => { setError(null); setV((x) => ({ ...x, ...patch })); };
  const today = new Date().toISOString().slice(0, 10);
  const max = `${new Date().getUTCFullYear() + 2}-12-31`;
  const ville = (id: number) => site.villes.find((c) => c.id === id)?.nom ?? '';

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (v.date_retour <= v.date_depart) return setError('La date de retour doit être postérieure à la date de départ');
    if (onSearch) onSearch(v);
    else router.push(`/location?${searchQuery(v)}`);
  };

  const villes = site.villes.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>);

  return (
    <form onSubmit={submit} className="w-full">
      <div className="rounded-2xl bg-white text-ink-900 shadow-bar">
        <div className="grid divide-slate-200 max-lg:divide-y lg:grid-cols-[1fr_1fr_1.15fr_1.15fr_auto] lg:divide-x">
          <SelectCell icon={<MapPin className="h-4 w-4" />} label="Ville de départ" value={v.depart} display={ville(v.depart)}
            onChange={(x) => { const id = Number(x); set(retourTouched ? { depart: id } : { depart: id, retour: id }); }}>
            {villes}
          </SelectCell>
          <SelectCell icon={<MapPin className="h-4 w-4" />} label="Ville de retour" value={v.retour} display={ville(v.retour)}
            onChange={(x) => { setRetourTouched(true); set({ retour: Number(x) }); }}>
            {villes}
          </SelectCell>
          <DateTimePicker label="Date de départ" value={v.date_depart} min={today} max={max} rangeStart={v.date_depart} rangeEnd={v.date_retour}
            onChange={(d) => set(d >= v.date_retour ? { date_depart: d, date_retour: addDays(d, 7) } : { date_depart: d })} />
          <DateTimePicker label="Date de retour" value={v.date_retour} min={v.date_depart.slice(0, 10)} max={max} rangeStart={v.date_depart} rangeEnd={v.date_retour}
            onChange={(d) => set({ date_retour: d })} />
          <div className="p-2.5">
            <button type="submit" className="flex h-full min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-grad-accent px-6 font-semibold text-white shadow-glow transition hover:brightness-110">
              {submitLabel} <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
        {!compact && (
          <div className="grid border-t border-slate-200 max-sm:divide-y max-sm:divide-slate-200 sm:grid-cols-2 sm:divide-x sm:divide-slate-200">
            <SelectCell icon={<Car className="h-4 w-4" />} label="Choix du modèle" value={v.modele ?? ''}
              display={(modeles ?? []).find((m) => m.slug === v.modele)?.nom ?? 'tous les modèles'} onChange={(x) => set({ modele: x })}>
              <option value="">tous les modèles</option>
              {(modeles ?? []).map((m) => <option key={m.slug} value={m.slug}>{m.nom}</option>)}
            </SelectCell>
            <label className="flex min-w-0 cursor-text items-center gap-3 px-4 py-3 focus-within:bg-slate-50">
              <Tag className="h-4 w-4 shrink-0 text-slate-500" />
              <span className="min-w-0 flex-1">
                <span className="block text-[11px] font-medium text-slate-500">Code de promotion</span>
                <input value={v.promo} onChange={(e) => set({ promo: e.target.value.toUpperCase() })} placeholder="Facultatif" className="field-light font-semibold uppercase" />
              </span>
            </label>
          </div>
        )}
      </div>
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
    </form>
  );
}

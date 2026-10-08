'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import useSWR from 'swr';
import clsx from 'clsx';
import { ArrowRight, CarFront, Lightbulb, MapPin, Pencil, SlidersHorizontal, X } from 'lucide-react';
import SearchForm, { SearchValues, searchQuery } from '@/components/SearchForm';
import CarSpecs, { CATEGORY_FILTERS, CategoryFilter, categoryLabel, matchCategory } from '@/components/CarSpecs';
import { useSite } from '@/components/providers';
import { Alert, Badge, Button, Empty, LinkButton, Loading } from '@/components/ui';
import { api } from '@/lib/api';
import { dateHeure, defaultDates, euro } from '@/lib/format';
import type { SearchResult } from '@/lib/types';

type Sort = 'prix' | 'prix_desc' | 'categorie';

function Filters({ cat, setCat, boite, setBoite, places, setPlaces, max, setMax, maxBound, onReset }: {
  cat: CategoryFilter; setCat: (v: CategoryFilter) => void; boite: string; setBoite: (v: string) => void; places: string; setPlaces: (v: string) => void;
  max: number; setMax: (v: number) => void; maxBound: number; onReset: () => void;
}) {
  const opt = (active: boolean) => clsx('rounded-xl border px-3 py-2 text-sm font-medium transition', active ? 'border-brand-blue bg-brand-blue/15 text-white' : 'border-line bg-white/[0.02] text-soft hover:text-white');
  return (
    <div className="glass p-5">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-base font-semibold">Filtres</h2>
        <button onClick={onReset} className="text-xs font-medium text-brand-cyan hover:underline">Tout effacer</button>
      </div>
      <div className="mb-6">
        <div className="label">Véhicules</div>
        <div className="grid grid-cols-2 gap-2">
          {CATEGORY_FILTERS.map((c) => (
            <button key={c.value} onClick={() => setCat(c.value)} className={clsx(opt(cat === c.value), c.value === 'tous' && 'col-span-2')}>{c.label}</button>
          ))}
        </div>
      </div>
      <div className="mb-6">
        <div className="label">Boîte de vitesses</div>
        <div className="grid grid-cols-3 gap-2">
          {[['', 'Toutes'], ['automatique', 'Auto.'], ['manuelle', 'Manuelle']].map(([v, l]) => <button key={v} onClick={() => setBoite(v)} className={opt(boite === v)}>{l}</button>)}
        </div>
      </div>
      <div className="mb-6">
        <div className="label">Nombre de places</div>
        <div className="grid grid-cols-4 gap-2">
          {[['', 'Tous'], ['5', '5'], ['7', '7'], ['9', '9']].map(([v, l]) => <button key={v} onClick={() => setPlaces(v)} className={opt(places === v)}>{l}</button>)}
        </div>
      </div>
      <div>
        <div className="label flex justify-between"><span>Prix total maximum</span><span className="text-white">{euro(max)}</span></div>
        <input type="range" min={0} max={maxBound} step={10} value={max} onChange={(e) => setMax(Number(e.target.value))} className="w-full accent-[#2F6BFF]" />
      </div>
    </div>
  );
}

function ResultCard({ r, qs, highlight, remiseAge }: { r: SearchResult; qs: string; highlight?: boolean; remiseAge: Record<string, number> }) {
  const q = r.quote;
  const frais = q.frais_aller_simple + q.frais_rapatriement;
  const age = Object.entries(remiseAge).find(([, p]) => p === q.remise_age_pct)?.[0];
  const cat = categoryLabel(r);
  return (
    <article className={clsx('glass flex flex-col overflow-hidden p-0 sm:flex-row', highlight && 'ring-2 ring-accent/60')}>
      <Link href={`/modeles/${r.slug}?${qs}`} className="relative block shrink-0 bg-white sm:w-64 lg:w-72">
        {r.image && <img src={r.image} alt={r.nom_affiche} className="h-48 w-full object-cover sm:h-full" loading="lazy" />}
      </Link>
      <div className="flex flex-1 flex-col gap-4 p-5 lg:flex-row">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {cat && <Badge tone="info">{cat}</Badge>}
            <Badge tone="muted">{r.carburant}</Badge>
          </div>
          <h3 className="mt-2 text-lg font-bold">{r.nom_affiche}</h3>
          <CarSpecs m={r} className="mt-2" />
          <div className="mt-4 flex flex-wrap gap-2">
            {q.forfait_jours > 1 && <span className="chip">vous bénéficiez du forfait {q.forfait_jours} jours et +</span>}
            {q.remise_age_pct > 0 && <span className="chip border-ok/30 bg-ok/10 text-ok">remise de -{q.remise_age_pct}%{age ? ` (véhicule de ${age} ans)` : ''}</span>}
            {q.coefficient_saison > 1 && <span className="chip border-warn/30 bg-warn/10 text-warn">Haute saison</span>}
            <span className="chip">250 km / jour</span>
          </div>
          {r.villes_vehicules.length > 0 && q.frais_rapatriement > 0 && (
            <p className="mt-3 flex items-start gap-2 text-xs text-[#FCD58A]">
              <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>économisez jusqu&apos;à {euro(q.frais_rapatriement)} : louez moi à {r.villes_vehicules.slice(0, 3).join(' ou ')}</span>
            </p>
          )}
        </div>
        <div className="flex shrink-0 flex-row items-end justify-between gap-4 border-t border-line pt-4 lg:w-52 lg:flex-col lg:items-end lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
          <div className="lg:text-right">
            <div>
              {q.remise_age_pct > 0 && <span className="mr-2 text-sm text-muted line-through">{euro(q.prix_jour)}</span>}
              <span className="font-display text-2xl font-bold text-white">{euro(q.prix_jour_remise)}</span>
              <span className="text-xs text-muted"> /jour</span>
            </div>
            <div className="mt-1 text-sm font-semibold text-soft">{euro(q.total)} TTC</div>
            <div className="text-xs text-muted">{q.jours} jour{q.jours > 1 ? 's' : ''}{frais > 0 ? ` · Frais inclus: ${euro(frais)}` : ''}</div>
          </div>
          <div className="flex gap-2 lg:w-full lg:flex-col">
            <LinkButton href={`/reservation?modele=${r.id}&${qs}`} size="sm" className="lg:w-full">Réserver <ArrowRight className="h-4 w-4" /></LinkButton>
            <LinkButton href={`/modeles/${r.slug}?${qs}`} variant="outline" size="sm" className="lg:w-full">Détails</LinkButton>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function Results({ modeles }: { modeles: { slug: string; nom: string }[] }) {
  const site = useSite();
  const sp = useSearchParams();
  const router = useRouter();
  const defaults = useMemo(defaultDates, []);
  const first = site.villes[0]?.id ?? 1;
  const known = (id: number) => site.villes.some((v) => v.id === id);
  const depart = known(Number(sp.get('depart'))) ? Number(sp.get('depart')) : first;
  const retour = known(Number(sp.get('retour'))) ? Number(sp.get('retour')) : depart;
  const values: SearchValues = {
    depart,
    retour,
    date_depart: sp.get('date_depart') || defaults.date_depart,
    date_retour: sp.get('date_retour') || defaults.date_retour,
    modele: sp.get('modele') || '',
    promo: sp.get('promo') || '',
  };
  const qs = searchQuery({ ...values, modele: undefined });
  const { data, error, isLoading } = useSWR<SearchResult[]>(['recherche', site.code, qs], () =>
    api('/recherche', { query: { depart: values.depart, retour: values.retour, date_depart: values.date_depart, date_retour: values.date_retour } }));

  const [editing, setEditing] = useState(false);
  const [cat, setCat] = useState<CategoryFilter>('tous');
  const [boite, setBoite] = useState('');
  const [places, setPlaces] = useState('');
  const [sort, setSort] = useState<Sort>('prix');
  const [showFilters, setShowFilters] = useState(false);
  const maxBound = Math.ceil(Math.max(100, ...(data ?? []).map((r) => r.quote.total)) / 10) * 10;
  const [max, setMax] = useState<number | null>(null);
  const [onlyModel, setOnlyModel] = useState(true);
  const cap = max ?? maxBound;

  const list = useMemo(() => {
    let l = (data ?? []).filter((r) => matchCategory(r, cat) && (!boite || r.boite === boite) && (!places || String(r.places) === places) && r.quote.total <= cap);
    if (values.modele && onlyModel) l = l.filter((r) => r.slug === values.modele);
    l = [...l].sort((a, b) => sort === 'prix' ? a.quote.total - b.quote.total : sort === 'prix_desc' ? b.quote.total - a.quote.total : (a.categorie || 'Z').localeCompare(b.categorie || 'Z') || a.quote.total - b.quote.total);
    return l;
  }, [data, cat, boite, places, cap, sort, values.modele, onlyModel]);

  const vd = site.villes.find((v) => v.id === values.depart)?.nom;
  const vr = site.villes.find((v) => v.id === values.retour)?.nom;
  const reset = () => { setCat('tous'); setBoite(''); setPlaces(''); setMax(null); };

  return (
    <div className="container-x pb-10 pt-8">
      <div className="glass flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">{site.titre}</h1>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 text-sm text-soft">
            <MapPin className="h-4 w-4 text-brand-cyan" />
            <span className="font-semibold text-white">{vd} / {vr}</span>
            <span>du {dateHeure(values.date_depart)} au {dateHeure(values.date_retour)}</span>
          </p>
        </div>
        <Button variant="secondary" onClick={() => setEditing(!editing)}>
          {editing ? <X className="h-4 w-4" /> : <Pencil className="h-4 w-4" />} Modifier mes choix
        </Button>
      </div>
      {editing && (
        <div className="mt-4">
          <SearchForm initial={values} modeles={modeles} onSearch={(v) => { setEditing(false); router.push(`/location?${searchQuery(v)}`); }} />
        </div>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className={clsx('lg:block', showFilters ? 'block' : 'hidden')}>
          <div className="lg:sticky lg:top-28">
            <Filters cat={cat} setCat={setCat} boite={boite} setBoite={setBoite} places={places} setPlaces={setPlaces} max={cap} setMax={setMax} maxBound={maxBound} onReset={reset} />
          </div>
        </aside>
        <section>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold">{isLoading ? 'Recherche…' : `${list.length} véhicule${list.length > 1 ? 's' : ''} disponible${list.length > 1 ? 's' : ''}`}</h2>
              <span className="hidden items-center gap-1.5 text-xs text-muted sm:inline-flex"><span className="h-2 w-2 rounded-full bg-ok" /> Disponibilité en temps réel</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="lg:hidden" onClick={() => setShowFilters(!showFilters)}><SlidersHorizontal className="h-4 w-4" /> Filtres</Button>
              <label className="flex items-center gap-2 text-sm text-muted">
                Trier par
                <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="field w-auto py-2">
                  <option value="prix">Prix croissant</option>
                  <option value="prix_desc">Prix décroissant</option>
                  <option value="categorie">Catégorie</option>
                </select>
              </label>
            </div>
          </div>
          {values.modele && (
            <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-soft">
              {onlyModel ? <>Modèle choisi uniquement. <button className="link" onClick={() => setOnlyModel(false)}>Voir tous les modèles disponibles</button></>
                : <button className="link" onClick={() => setOnlyModel(true)}>Afficher uniquement le modèle choisi</button>}
            </div>
          )}
          {error && <Alert tone="danger" title="Recherche impossible">{(error as Error).message}</Alert>}
          {isLoading && <Loading label="Recherche des véhicules disponibles…" />}
          {!isLoading && !error && list.length === 0 && (
            <Empty icon={<CarFront className="h-6 w-6" />} title="Aucun véhicule disponible">
              Essayez d&apos;autres dates, une autre ville ou retirez des filtres.
              {(cat !== 'tous' || boite || places || max) && <div className="mt-4"><Button variant="secondary" size="sm" onClick={reset}>Effacer les filtres</Button></div>}
            </Empty>
          )}
          <div className="grid gap-4">
            {list.map((r) => <ResultCard key={r.id} r={r} remiseAge={site.tarification.remise_age} qs={values.promo ? `${qs}&promo=${encodeURIComponent(values.promo)}` : qs} highlight={r.slug === values.modele && !onlyModel} />)}
          </div>
        </section>
      </div>
    </div>
  );
}

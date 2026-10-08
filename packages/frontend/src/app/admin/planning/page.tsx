'use client';

import clsx from 'clsx';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { errMsg, isoDay, PageHead, qs, SearchBox, useAdmin } from '@/components/admin/kit';
import { Alert, Button, Input, Loading, Select } from '@/components/ui';
import { dateHeure, STATUT_COMMANDE } from '@/lib/format';

const DAY = 86_400_000;
const COL = 44;
const BAR: Record<string, string> = {
  en_attente: 'bg-warn/80 border-warn text-ink-950',
  confirmee: 'bg-brand-blue/85 border-[#5C8BFF] text-white',
  en_cours: 'bg-ok/80 border-ok text-ink-950',
  terminee: 'bg-white/15 border-white/25 text-soft',
};
const WD = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

const todayUtc = () => {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
};

type Plan = {
  vehicules: { id: number; immatriculation: string; annee: number; statut: string; modele_nom: string; ville: string }[];
  commandes: { reference: string; vehicule_id: number; date_depart: string; date_retour: string; statut: string; prenom: string; nom: string }[];
};

export default function PlanningPage() {
  const [start, setStart] = useState(todayUtc);
  const [days, setDays] = useState(21);
  const [ville, setVille] = useState('');
  const [term, setTerm] = useState('');
  const [LEFT, setLeft] = useState(250);
  useEffect(() => {
    const fit = () => setLeft(window.innerWidth < 640 ? 150 : 250);
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);
  const end = new Date(start.getTime() + days * DAY);
  const { data: villes } = useAdmin<any[]>('/admin/villes');
  const { data, error, isLoading } = useAdmin<Plan>(qs('/admin/planning', { du: isoDay(start), au: isoDay(end), ville }));

  const byVeh = useMemo(() => {
    const m = new Map<number, Plan['commandes']>();
    for (const c of data?.commandes || []) m.set(c.vehicule_id, [...(m.get(c.vehicule_id) || []), c]);
    return m;
  }, [data]);

  const vehs = useMemo(() => {
    const t = term.toLowerCase();
    return (data?.vehicules || []).filter((v) => !t || `${v.immatriculation} ${v.modele_nom} ${v.ville}`.toLowerCase().includes(t));
  }, [data, term]);

  const cols = Array.from({ length: days }, (_, i) => new Date(start.getTime() + i * DAY));
  const today = todayUtc().getTime();
  const shift = (n: number) => setStart(new Date(start.getTime() + n * DAY));
  const occupied = vehs.filter((v) => byVeh.has(v.id)).length;

  return (
    <div>
      <PageHead title="Planning" sub={`Occupation du parc du ${start.toLocaleDateString('fr-FR', { timeZone: 'UTC', day: 'numeric', month: 'long' })} au ${new Date(end.getTime() - DAY).toLocaleDateString('fr-FR', { timeZone: 'UTC', day: 'numeric', month: 'long', year: 'numeric' })}`}
        actions={<>
          <Button variant="secondary" size="sm" onClick={() => shift(-7)} aria-label="Semaine précédente"><ChevronLeft className="h-4 w-4" /></Button>
          <Button variant="secondary" size="sm" onClick={() => setStart(todayUtc())}>Aujourd&apos;hui</Button>
          <Button variant="secondary" size="sm" onClick={() => shift(7)} aria-label="Semaine suivante"><ChevronRight className="h-4 w-4" /></Button>
        </>} />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Input type="date" className="w-full sm:w-44" value={isoDay(start)} onChange={(e) => e.target.value && setStart(new Date(`${e.target.value}T00:00:00Z`))} />
        <Select className="w-[calc(50%-6px)] sm:w-44" value={ville} onChange={(e) => setVille(e.target.value)}>
          <option value="">Toutes les villes</option>
          {(villes || []).map((v) => <option key={v.id} value={v.id}>{v.nom}</option>)}
        </Select>
        <Select className="w-[calc(50%-6px)] sm:w-36" value={days} onChange={(e) => setDays(Number(e.target.value))}>
          {[7, 14, 21, 30, 45].map((n) => <option key={n} value={n}>{n} jours</option>)}
        </Select>
        <SearchBox value={term} onChange={setTerm} placeholder="Immatriculation, modèle…" className="w-full sm:w-64" delay={150} />
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
          {Object.entries(BAR).map(([k, c]) => <span key={k} className="flex items-center gap-1.5"><span className={clsx('h-3 w-5 rounded border', c)} />{STATUT_COMMANDE[k].label}</span>)}
          <span className="flex items-center gap-1.5"><span className="h-3 w-5 rounded border border-line bg-[repeating-linear-gradient(45deg,rgba(255,255,255,0.08)_0_4px,transparent_4px_8px)]" />Indisponible</span>
        </div>
      </div>

      {error && <Alert tone="danger" className="mb-4">{errMsg(error)}</Alert>}
      {isLoading && !data ? <Loading /> : (
        <>
          <div className="mb-2 text-xs text-muted">{vehs.length} véhicule(s) · {occupied} avec au moins une réservation sur la période</div>
          <div className="glass overflow-hidden p-0">
            <div className="max-h-[calc(100vh-300px)] overflow-auto">
              <div style={{ width: LEFT + days * COL }} className="relative">
                <div className="sticky top-0 z-20 flex border-b border-line bg-ink-800/95 backdrop-blur">
                  <div style={{ width: LEFT }} className="sticky left-0 z-10 shrink-0 border-r border-line bg-ink-800 px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted">Véhicule</div>
                  {cols.map((d) => {
                    const wd = d.getUTCDay();
                    const isToday = d.getTime() === today;
                    return (
                      <div key={d.getTime()} style={{ width: COL }} className={clsx('shrink-0 border-r border-line/50 py-1.5 text-center', (wd === 0 || wd === 6) && 'bg-white/[0.03]', isToday && 'bg-accent/15')}>
                        <div className={clsx('text-[10px]', isToday ? 'text-accent' : 'text-muted')}>{WD[wd]}</div>
                        <div className={clsx('text-xs font-semibold', isToday ? 'text-accent' : 'text-white')}>{d.getUTCDate()}</div>
                        {(d.getUTCDate() === 1 || d.getTime() === start.getTime()) && <div className="text-[9px] uppercase text-muted">{d.toLocaleDateString('fr-FR', { timeZone: 'UTC', month: 'short' })}</div>}
                      </div>
                    );
                  })}
                </div>
                {!vehs.length && <div className="px-4 py-14 text-center text-sm text-muted">Aucun véhicule</div>}
                {vehs.map((v) => {
                  const off = v.statut !== 'disponible';
                  return (
                    <div key={v.id} className={clsx('group flex h-11 border-b border-line/50 hover:bg-white/[0.025]', off && 'opacity-60')}>
                      <div style={{ width: LEFT }} className="sticky left-0 z-10 flex shrink-0 flex-col justify-center border-r border-line bg-ink-850 px-4 group-hover:bg-ink-800">
                        <div className="flex items-center gap-2"><span className="font-mono text-xs font-semibold text-white">{v.immatriculation}</span>{off && <span className="text-[10px] uppercase text-warn">{v.statut === 'maintenance' ? 'Maintenance' : 'Hors service'}</span>}</div>
                        <div className="truncate text-[11px] text-muted">{v.modele_nom} · {v.ville}</div>
                      </div>
                      <div className={clsx('relative flex-1', off && 'bg-[repeating-linear-gradient(45deg,rgba(255,255,255,0.05)_0_6px,transparent_6px_12px)]')}>
                        <div className="absolute inset-0 flex">
                          {cols.map((d) => {
                            const wd = d.getUTCDay();
                            return <div key={d.getTime()} style={{ width: COL }} className={clsx('shrink-0 border-r border-line/30', (wd === 0 || wd === 6) && 'bg-white/[0.02]', d.getTime() === today && 'bg-accent/[0.07]')} />;
                          })}
                        </div>
                        {(byVeh.get(v.id) || []).map((c) => {
                          const s = Math.max(new Date(c.date_depart).getTime(), start.getTime());
                          const e = Math.min(new Date(c.date_retour).getTime(), end.getTime());
                          if (e <= s) return null;
                          const left = ((s - start.getTime()) / DAY) * COL;
                          const width = Math.max(((e - s) / DAY) * COL, 10);
                          return (
                            <Link key={c.reference} href={`/admin/reservations/${c.reference}`}
                              title={`${c.reference} · ${c.prenom} ${c.nom}\n${dateHeure(c.date_depart)} → ${dateHeure(c.date_retour)}\n${STATUT_COMMANDE[c.statut]?.label}`}
                              style={{ left, width }}
                              className={clsx('absolute top-1.5 z-[5] flex h-8 items-center overflow-hidden whitespace-nowrap rounded-lg border px-2 text-[11px] font-semibold shadow-sm transition hover:z-[6] hover:brightness-110', BAR[c.statut] || BAR.terminee)}>
                              {width > 50 ? `${c.prenom} ${c.nom}` : ''}
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

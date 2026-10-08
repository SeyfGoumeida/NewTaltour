'use client';

import clsx from 'clsx';
import Link from 'next/link';
import { ArrowRight, CalendarCheck, Car, Clock, Euro, Mail, PlaneLanding, PlaneTakeoff, Star, TrendingDown, TrendingUp, Undo2, Wallet } from 'lucide-react';
import { CaChart, Donut, HBars } from '@/components/admin/charts';
import { errMsg, PageHead, PaiementBadge, pct, StatutBadge, Thumb, useAdmin } from '@/components/admin/kit';
import { Alert, Card, CardTitle, Loading, Stat } from '@/components/ui';
import { dateHeure, euro, MODE_PAIEMENT } from '@/lib/format';

type Dash = {
  kpi: Record<string, number>;
  ca: { mois: string; ca: number; n: number }[];
  villes: { nom: string; n: number; ca: number }[];
  modeles: { nom: string; image: string | null; n: number; ca: number }[];
  options: { libelle: string; n: number; ca: number }[];
  paiements: { mode_paiement: string; n: number }[];
  prochains: any[];
  retours: any[];
  recentes: any[];
};

function Kpi({ href, ...p }: { href?: string; label: string; value: React.ReactNode; sub?: React.ReactNode; icon?: React.ReactNode }) {
  const s = <Stat {...p} />;
  return href ? <Link href={href} className="block rounded-2xl transition hover:-translate-y-0.5 hover:brightness-110">{s}</Link> : s;
}

function ListCard({ title, href, children, empty }: { title: string; href?: string; children: React.ReactNode; empty: boolean }) {
  return (
    <Card className="p-0 sm:p-0">
      <div className="flex items-center justify-between border-b border-line px-5 py-4">
        <h3 className="text-base font-semibold">{title}</h3>
        {href && <Link href={href} className="inline-flex items-center gap-1 text-xs font-medium text-brand-cyan hover:underline">Tout voir <ArrowRight className="h-3.5 w-3.5" /></Link>}
      </div>
      {empty ? <div className="px-5 py-10 text-center text-sm text-muted">Rien à afficher</div> : <ul className="divide-y divide-line/60">{children}</ul>}
    </Card>
  );
}

function Line({ refId, title, sub, right }: { refId: string; title: React.ReactNode; sub: React.ReactNode; right: React.ReactNode }) {
  return (
    <li>
      <Link href={`/admin/reservations/${refId}`} className="flex items-center gap-3 px-5 py-3 transition hover:bg-white/[0.035]">
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium text-white">{title}</div>
          <div className="truncate text-xs text-muted">{sub}</div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">{right}</div>
      </Link>
    </li>
  );
}

export default function Dashboard() {
  const { data, error, isLoading } = useAdmin<Dash>('/admin/dashboard', { refreshInterval: 60_000 });
  if (error) return <Alert tone="danger">{errMsg(error)}</Alert>;
  if (isLoading || !data) return <Loading />;
  const k = data.kpi;
  const evo = k.ca_mois_precedent ? ((k.ca_mois - k.ca_mois_precedent) / k.ca_mois_precedent) * 100 : null;
  const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6">
      <PageHead title="Tableau de bord" sub={<span className="capitalize">{today}</span>} />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6">
        <div className="col-span-2 glass relative overflow-hidden p-5">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-accent/20 blur-3xl" />
          <div className="relative flex items-center justify-between text-xs font-medium text-muted">CA du mois <Euro className="h-4 w-4 text-accent" /></div>
          <div className="relative mt-2 font-display text-3xl font-extrabold text-white">{euro(k.ca_mois)}</div>
          <div className="relative mt-1 flex items-center gap-2 text-xs text-muted">
            {evo !== null && (
              <span className={clsx('inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-semibold', evo >= 0 ? 'bg-ok/15 text-ok' : 'bg-danger/15 text-danger')}>
                {evo >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}{pct(evo)}
              </span>
            )}
            vs {euro(k.ca_mois_precedent)} le mois précédent
          </div>
        </div>
        <Kpi href="/admin/reservations" label="Réservations du mois" value={k.reservations_mois} icon={<CalendarCheck className="h-4 w-4" />} />
        <Kpi href="/admin/reservations?statut=en_attente" label="En attente" value={<span className={k.en_attente ? 'text-warn' : ''}>{k.en_attente}</span>} sub="à confirmer" icon={<Clock className="h-4 w-4" />} />
        <Kpi href="/admin/reservations?statut=en_cours" label="Locations en cours" value={k.en_cours} icon={<Car className="h-4 w-4" />} />
        <Kpi href="/admin/planning" label="Départs" value={<>{k.departs_aujourdhui} <span className="text-base font-semibold text-muted">/ {k.departs_demain}</span></>} sub="aujourd'hui / demain" icon={<PlaneTakeoff className="h-4 w-4" />} />
        <Kpi href="/admin/planning" label="Retours aujourd'hui" value={k.retours_aujourdhui} icon={<Undo2 className="h-4 w-4" />} />
        <Kpi href="/admin/flotte" label="Véhicules loués" value={<>{k.vehicules_loues} <span className="text-base font-semibold text-muted">/ {k.vehicules}</span></>} sub={`${k.vehicules_indisponibles} indisponible${k.vehicules_indisponibles > 1 ? 's' : ''} · ${k.vehicules ? Math.round((k.vehicules_loues / k.vehicules) * 100) : 0} % d'occupation`} icon={<Car className="h-4 w-4" />} />
        <Kpi href="/admin/reservations?statut_paiement=acompte" label="Reste à encaisser" value={euro(k.reste_a_encaisser)} sub="réservations actives" icon={<Wallet className="h-4 w-4" />} />
        <Kpi href="/admin/messages" label="Messages non lus" value={<span className={k.messages_non_lus ? 'text-accent' : ''}>{k.messages_non_lus}</span>} icon={<Mail className="h-4 w-4" />} />
        <Kpi href="/admin/transferts" label="Transferts nouveaux" value={k.transferts_nouveaux} icon={<PlaneLanding className="h-4 w-4" />} />
        <Kpi href="/admin/avis" label="Note moyenne (90 j)" value={<span className="text-gold">{k.note_90j != null ? Number(k.note_90j).toLocaleString('fr-FR') : '—'}<span className="text-base text-muted"> / 5</span></span>} sub={`${k.clients} clients inscrits`} icon={<Star className="h-4 w-4" />} />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardTitle action={<span className="flex items-center gap-3 text-xs text-muted"><span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-accent" />CA</span><span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-brand-blue/60" />Réservations</span></span>}>
            Chiffre d&apos;affaires, 12 derniers mois
          </CardTitle>
          <CaChart data={data.ca} />
        </Card>
        <Card>
          <CardTitle>Modes de paiement</CardTitle>
          <Donut data={data.paiements.map((p) => ({ name: MODE_PAIEMENT[p.mode_paiement]?.replace(' (PayPal + espèces)', '') || p.mode_paiement, value: p.n }))} />
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardTitle>Réservations par ville de départ</CardTitle>
          <HBars data={data.villes} fmt={(v) => `${v}`} />
        </Card>
        <Card>
          <CardTitle>Top modèles</CardTitle>
          <ul className="space-y-2.5">
            {data.modeles.map((m, i) => {
              const max = data.modeles[0]?.n || 1;
              return (
                <li key={m.nom} className="flex items-center gap-3">
                  <span className="w-4 text-xs font-bold text-muted">{i + 1}</span>
                  <Thumb src={m.image} className="h-8 w-12" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm text-white">{m.nom}</div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/[0.06]"><div className="h-full rounded-full bg-gradient-to-r from-brand-blue to-brand-cyan" style={{ width: `${(m.n / max) * 100}%` }} /></div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-white">{m.n}</div>
                    <div className="text-[11px] text-muted">{euro(m.ca)}</div>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
        <Card>
          <CardTitle>Options les plus vendues</CardTitle>
          <HBars data={data.options.map((o) => ({ nom: o.libelle, n: o.n, ca: o.ca }))} name="Ventes" color="#FF6B1A" />
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <ListCard title="Prochains départs" href="/admin/reservations?tri=depart_asc" empty={!data.prochains.length}>
          {data.prochains.map((c) => (
            <Line key={c.reference} refId={c.reference} title={<>{c.prenom} {c.nom} <span className="text-muted">· {c.reference}</span></>}
              sub={`${c.modele_nom} · ${c.ville_depart}${c.immatriculation ? ` · ${c.immatriculation}` : ' · véhicule à affecter'}`}
              right={<><span className="text-xs font-semibold text-white">{dateHeure(c.date_depart)}</span><StatutBadge statut={c.statut} /></>} />
          ))}
        </ListCard>
        <ListCard title="Retours en cours" href="/admin/reservations?statut=en_cours" empty={!data.retours.length}>
          {data.retours.map((c) => (
            <Line key={c.reference} refId={c.reference} title={<>{c.prenom} {c.nom} <span className="text-muted">· {c.reference}</span></>}
              sub={`${c.modele_nom} · retour ${c.ville_retour}${c.immatriculation ? ` · ${c.immatriculation}` : ''}`}
              right={<span className="text-xs font-semibold text-white">{dateHeure(c.date_retour)}</span>} />
          ))}
        </ListCard>
        <ListCard title="Dernières réservations" href="/admin/reservations" empty={!data.recentes.length}>
          {data.recentes.map((c) => (
            <Line key={c.reference} refId={c.reference} title={<>{c.prenom} {c.nom} <span className="text-muted">· {c.reference}</span></>}
              sub={`${c.modele_nom} · ${dateHeure(c.created_at)}`}
              right={<><span className="text-sm font-semibold text-white">{euro(c.montant_total)}</span><PaiementBadge statut={c.statut_paiement} /></>} />
          ))}
        </ListCard>
      </div>
    </div>
  );
}

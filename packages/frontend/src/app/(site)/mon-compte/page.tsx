'use client';

import Link from 'next/link';
import { ArrowRight, BadgePercent, CalendarCheck2, CalendarDays, CheckCircle2, Clock, MapPin, Wallet } from 'lucide-react';
import { useAuth, useSite } from '@/components/providers';
import { Alert, Badge, Card, CardTitle, LinkButton, Loading, Stat } from '@/components/ui';
import BookingCard, { CarThumb } from '@/components/compte/BookingCard';
import { useApi } from '@/components/compte/hooks';
import { dateLong, euro, heureFr, STATUT_COMMANDE } from '@/lib/format';
import { n, type CommandeItem, type Resume } from '@/components/compte/lib';

export default function Dashboard() {
  const { user } = useAuth();
  const site = useSite();
  const { data, error } = useApi<Resume>('/compte/resume');
  const { data: commandes } = useApi<CommandeItem[]>('/compte/commandes');

  if (error) return <Alert tone="danger">{error.message}</Alert>;
  if (!data) return <Loading />;

  const p = data.prochaine;
  const avisAttendus = (commandes ?? []).filter((c) => c.statut === 'terminee' && !c.avis_laisse);
  const recentes = (commandes ?? []).slice(0, 3);

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted">Espace client</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">Bonjour <span className="text-grad">{user?.prenom}</span></h1>
        </div>
        <LinkButton href="/">Réserver un véhicule <ArrowRight className="h-4 w-4" /></LinkButton>
      </div>

      {data.fidelite && (
        <div className="glass relative overflow-hidden border-accent/30 bg-gradient-to-r from-accent/15 via-accent/5 to-transparent p-5 sm:p-6">
          <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-accent/20 blur-3xl" />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-grad-accent text-white shadow-glow"><BadgePercent className="h-6 w-6" /></span>
              <div>
                <div className="font-display text-lg font-bold text-white">-{site.tarification.remise_fidelite_pct}% sur votre prochaine réservation</div>
                <div className="text-sm text-soft">Merci pour votre fidélité ! La remise est appliquée automatiquement lorsque vous êtes connecté.</div>
              </div>
            </div>
            <LinkButton href="/" variant="secondary" className="shrink-0">J&apos;en profite</LinkButton>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <Stat label="Réservations" value={data.reservations} icon={<CalendarDays className="h-4 w-4" />} />
        <Stat label="À venir" value={data.a_venir} icon={<Clock className="h-4 w-4" />} />
        <Stat label="Terminées" value={data.terminees} icon={<CheckCircle2 className="h-4 w-4" />} />
        <Stat label="Solde avoir" value={euro(data.avoir)} icon={<Wallet className="h-4 w-4" />} sub={n(data.avoir) > 0 ? <Link href="/mon-compte/avoirs" className="link">Voir mes avoirs</Link> : undefined} />
      </div>

      {p ? (
        <div className="glass overflow-hidden">
          <div className="grid md:grid-cols-[300px_minmax(0,1fr)]">
            <div className="relative">
              <CarThumb src={p.modele_image} alt={p.modele_nom} className="aspect-[16/10] h-full w-full rounded-none md:aspect-auto md:min-h-[220px]" />
              <span className="absolute left-3 top-3 rounded-lg bg-ink-950/80 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur">Prochaine réservation</span>
            </div>
            <div className="p-5 sm:p-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs text-muted">{p.reference}</span>
                {STATUT_COMMANDE[p.statut] && <Badge tone={STATUT_COMMANDE[p.statut].tone}>{STATUT_COMMANDE[p.statut].label}</Badge>}
              </div>
              <h2 className="mt-2 text-xl font-bold sm:text-2xl">{p.modele_nom}</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="glass-soft p-3">
                  <div className="text-xs text-muted">Départ</div>
                  <div className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-white"><MapPin className="h-4 w-4 text-brand-cyan" /> {p.ville_depart}</div>
                  <div className="mt-0.5 text-sm text-soft">{dateLong(p.date_depart)} à {heureFr(p.date_depart)}</div>
                </div>
                <div className="glass-soft p-3">
                  <div className="text-xs text-muted">Restitution</div>
                  <div className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-white"><MapPin className="h-4 w-4 text-brand-cyan" /> {p.ville_retour}</div>
                  <div className="mt-0.5 text-sm text-soft">{dateLong(p.date_retour)} à {heureFr(p.date_retour)}</div>
                </div>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <LinkButton href={`/mon-compte/reservations/${p.reference}`} variant="blue">Voir les détails <ArrowRight className="h-4 w-4" /></LinkButton>
                <LinkButton href={`/mon-compte/reservations/${p.reference}/contrat`} variant="secondary">Télécharger mon contrat</LinkButton>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <Card className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-brand-blue/30 bg-brand-blue/10 text-[#7EA6FF]"><CalendarCheck2 className="h-6 w-6" /></span>
            <div>
              <div className="font-semibold text-white">Aucune réservation à venir</div>
              <div className="text-sm text-muted">Descendez de l&apos;avion, notre agent vous attend !</div>
            </div>
          </div>
          <LinkButton href="/">Réserver un véhicule</LinkButton>
        </Card>
      )}

      {avisAttendus.length > 0 && (
        <Alert tone="warn" title="Votre avis nous intéresse">
          {avisAttendus.length === 1 ? 'Une location terminée attend votre avis : ' : `${avisAttendus.length} locations terminées attendent votre avis : `}
          {avisAttendus.map((c, i) => (
            <span key={c.reference}>{i > 0 && ', '}<Link href={`/mon-compte/reservations/${c.reference}#avis`} className="font-semibold underline underline-offset-2">{c.reference}</Link></span>
          ))}
        </Alert>
      )}

      {recentes.length > 0 && (
        <div>
          <CardTitle action={<Link href="/mon-compte/reservations" className="link text-sm">Toutes mes réservations</Link>}>Dernières réservations</CardTitle>
          <div className="grid gap-3">
            {recentes.map((c) => <BookingCard key={c.reference} c={c} />)}
          </div>
        </div>
      )}
    </div>
  );
}

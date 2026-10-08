import Link from 'next/link';
import { ArrowRight, CalendarDays, Car, MapPin, Star } from 'lucide-react';
import { Badge } from '@/components/ui';
import { dateFr, euro, heureFr, STATUT_COMMANDE, STATUT_PAIEMENT } from '@/lib/format';
import type { CommandeItem } from './lib';

export function CarThumb({ src, alt, className = '' }: { src: string | null; alt: string; className?: string }) {
  return (
    <div className={`relative flex items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-ink-700 to-ink-850 ${className}`}>
      {src ? <img src={src} alt={alt} className="h-full w-full object-cover" /> : <Car className="h-8 w-8 text-muted" />}
    </div>
  );
}

export function StatusBadges({ statut, statut_paiement }: { statut: string; statut_paiement: string }) {
  const s = STATUT_COMMANDE[statut];
  const p = STATUT_PAIEMENT[statut_paiement];
  return (
    <span className="flex flex-wrap gap-1.5">
      {s && <Badge tone={s.tone}>{s.label}</Badge>}
      {p && !(statut === 'annulee' && statut_paiement === 'non_paye') && <Badge tone={p.tone}>{p.label}</Badge>}
    </span>
  );
}

export default function BookingCard({ c }: { c: CommandeItem }) {
  const avisAttendu = c.statut === 'terminee' && !c.avis_laisse;
  return (
    <Link href={`/mon-compte/reservations/${c.reference}`}
      className="glass group flex flex-col gap-4 p-4 transition hover:border-white/20 sm:flex-row sm:items-center sm:p-5">
      <CarThumb src={c.modele_image} alt={c.modele_nom} className="aspect-[16/10] w-full sm:h-24 sm:w-36 sm:shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs text-muted">{c.reference}</span>
          <StatusBadges statut={c.statut} statut_paiement={c.statut_paiement} />
          {avisAttendu && <Badge tone="gold"><Star className="h-3 w-3" /> Donner mon avis</Badge>}
        </div>
        <h3 className="mt-1.5 truncate text-base font-semibold sm:text-lg">{c.modele_nom}</h3>
        <div className="mt-2 grid gap-1.5 text-sm text-soft sm:grid-cols-2">
          <span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4 shrink-0 text-brand-cyan" /> {c.ville_depart} <ArrowRight className="h-3 w-3 text-muted" /> {c.ville_retour}</span>
          <span className="inline-flex items-center gap-2"><CalendarDays className="h-4 w-4 shrink-0 text-brand-cyan" /> {dateFr(c.date_depart)} {heureFr(c.date_depart)} au {dateFr(c.date_retour)}</span>
        </div>
      </div>
      <div className="flex items-center justify-between gap-4 border-t border-line pt-3 sm:block sm:border-0 sm:pt-0 sm:text-right">
        <div>
          <div className="font-display text-lg font-bold text-white">{euro(c.montant_total)}</div>
          <div className="text-xs text-muted">{c.jours} jours · payé {euro(c.montant_paye)}</div>
        </div>
        <span className="inline-flex items-center gap-1 text-sm font-medium text-brand-cyan sm:mt-2">Détails <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" /></span>
      </div>
    </Link>
  );
}

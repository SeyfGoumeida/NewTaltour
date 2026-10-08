'use client';

import Link from 'next/link';
import { CalendarDays, Headphones, MapPin, ShieldCheck } from 'lucide-react';
import CarSpecs, { categoryLabel } from '@/components/CarSpecs';
import { useSite } from '@/components/providers';
import { Badge, Spinner } from '@/components/ui';
import { dateHeure, euro } from '@/lib/format';
import type { Devis } from '@/lib/types';

function Line({ label, value, tone }: { label: React.ReactNode; value: number; tone?: 'minus' }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5 text-sm">
      <span className="text-soft">{label}</span>
      <span className={tone === 'minus' ? 'shrink-0 font-medium text-ok' : 'shrink-0 font-medium text-white'}>{tone === 'minus' ? `-${euro(value)}` : euro(value)}</span>
    </div>
  );
}

export default function Summary({ devis, loading, depart, retour, dateDepart, dateRetour, backHref }: {
  devis?: Devis; loading: boolean; depart: number; retour: number; dateDepart: string; dateRetour: string; backHref: string;
}) {
  const site = useSite();
  const vd = site.villes.find((v) => v.id === depart);
  const vr = site.villes.find((v) => v.id === retour);
  const m = devis?.modele;
  const l = devis?.location;
  const age = l ? Object.entries(site.tarification.remise_age).find(([, p]) => p === l.remise_age_pct)?.[0] : undefined;
  return (
    <div className="space-y-4">
      <div className="glass p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold">Véhicule choisi</h3>
          <Link href={backHref} className="text-xs font-medium text-brand-cyan hover:underline">Changer de véhicule</Link>
        </div>
        {m ? (
          <div className="flex gap-4">
            <div className="h-20 w-28 shrink-0 overflow-hidden rounded-xl bg-white">{m.image && <img src={m.image} alt={m.nom_affiche} className="h-full w-full object-cover" />}</div>
            <div className="min-w-0">
              <div className="font-semibold leading-snug text-white">{m.nom_affiche}</div>
              <div className="mt-1 flex gap-1.5">{categoryLabel(m) && <Badge tone="info">{categoryLabel(m)}</Badge>}<Badge>{m.carburant}</Badge></div>
              <CarSpecs m={m} className="mt-2" />
            </div>
          </div>
        ) : <div className="h-20 animate-pulse rounded-xl bg-white/5" />}
        <div className="mt-5 grid gap-3 border-t border-line pt-4 text-sm">
          <div className="flex gap-3"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-cyan" /><div><div className="text-xs text-muted">Départ / retour</div><div className="font-medium text-white">{vd?.nom} / {vr?.nom}</div></div></div>
          <div className="flex gap-3"><CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-brand-cyan" /><div><div className="text-xs text-muted">Du / au</div><div className="font-medium text-white">{dateHeure(dateDepart)} → {dateHeure(dateRetour)}</div></div></div>
        </div>
      </div>

      <div className="glass p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-semibold">Récapitulatif</h3>
          {loading && <Spinner className="h-4 w-4" />}
        </div>
        {devis && l ? (
          <>
            <div className="divide-y divide-line/0">
              <Line label={<>{l.jours} jour{l.jours > 1 ? 's' : ''} × {euro(l.prix_jour)}{l.forfait_jours > 1 && <span className="block text-xs text-muted">vous bénéficiez du forfait {l.forfait_jours} jours et +</span>}{l.coefficient_saison > 1 && <span className="block text-xs text-warn">Haute saison</span>}</>} value={l.montant_brut} />
              {l.remise_age_pct > 0 && <Line label={`remise de -${l.remise_age_pct}%${age ? ` (véhicule de ${age} ans)` : ''}`} value={Math.round((l.montant_brut - l.montant_location) * 100) / 100} tone="minus" />}
              {l.frais_aller_simple > 0 && <Line label="Frais aller simple" value={l.frais_aller_simple} />}
              {l.frais_rapatriement > 0 && <Line label="Frais de rapatriement du véhicule" value={l.frais_rapatriement} />}
              {devis.options.map((o) => <Line key={o.code} label={o.libelle} value={o.montant} />)}
              {devis.remise_fidelite > 0 && <Line label={`Fidélité récompensée (-${site.tarification.remise_fidelite_pct}%)`} value={devis.remise_fidelite} tone="minus" />}
              {devis.remise_promo > 0 && <Line label={`Code ${devis.promo?.code} (${devis.promo?.message})`} value={devis.remise_promo} tone="minus" />}
              {devis.avoir_utilise > 0 && <Line label="Avoir utilisé" value={devis.avoir_utilise} tone="minus" />}
            </div>
            <div className="mt-3 flex items-end justify-between border-t border-line pt-4">
              <span className="text-sm font-semibold text-white">Total TTC</span>
              <span className="font-display text-3xl font-bold text-accent">{euro(devis.montant_total)}</span>
            </div>
            <div className="mt-4 grid gap-2 text-xs text-muted">
              <div className="flex justify-between"><span>Caution{devis.caution_doublee ? ' (doublée)' : ''}</span><span className="font-medium text-soft">{devis.caution > 0 ? euro(devis.caution) : 'Aucune (Assurance Gold)'}</span></div>
              {devis.reserve_gold > 0 && <div className="flex justify-between"><span>Réserve carburant / lavage</span><span className="font-medium text-soft">{euro(devis.reserve_gold)}</span></div>}
              <div className="flex justify-between"><span>Kilométrage inclus</span><span className="font-medium text-soft">{devis.km_inclus_jour} km / jour</span></div>
            </div>
            <div className="mt-4 flex gap-3 rounded-xl border border-ok/25 bg-ok/10 p-3 text-xs text-[#9BE7B5]">
              <ShieldCheck className="h-4 w-4 shrink-0" />
              <span>Annulation : {site.tarification.annulation_plus_48h_pct}% retenus à plus de 48h, {site.tarification.annulation_moins_48h_pct}% dans les 48h, ou avoir de la totalité. Remboursement intégral avec l&apos;assurance annulation.</span>
            </div>
          </>
        ) : (
          <div className="space-y-2">{[1, 2, 3, 4].map((i) => <div key={i} className="h-5 animate-pulse rounded bg-white/5" />)}</div>
        )}
      </div>

      <div className="glass flex items-center justify-between gap-4 p-5">
        <div>
          <div className="text-sm font-semibold text-white">Besoin d&apos;aide ?</div>
          <div className="mt-1 text-xs text-muted">Une équipe à votre écoute 7jours/7 et 24h/24</div>
          {site.hotline && <a href={`tel:${site.hotline.replace(/\s/g, '')}`} className="mt-2 inline-block text-sm font-semibold text-brand-cyan">Hotline {site.hotline}</a>}
        </div>
        <Headphones className="h-10 w-10 text-brand-blue" />
      </div>
    </div>
  );
}

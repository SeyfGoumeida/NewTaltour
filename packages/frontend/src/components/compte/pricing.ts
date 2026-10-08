import { euro } from '@/lib/format';
import type { Commande } from '@/lib/types';
import { hasOption, n, reste, vehiculeAge } from './lib';

export interface PriceLine {
  label: string;
  sub?: string;
  value: number;
  tone?: 'discount' | 'total' | 'muted';
}

export function priceLines(c: Commande): PriceLine[] {
  const lines: PriceLine[] = [];
  const age = vehiculeAge(c);
  const subs = [`Forfait ${c.forfait_jours} jour${c.forfait_jours > 1 ? 's' : ''}`, `${euro(c.prix_jour)} / jour`];
  if (n(c.remise_age_pct) > 0) subs.push(`remise de -${n(c.remise_age_pct)}%${age != null ? ` (véhicule de ${age} ans)` : ''}`);
  if (n(c.coefficient_saison) > 1) subs.push('tarif haute saison');
  lines.push({ label: `Location ${c.jours} jour${c.jours > 1 ? 's' : ''}`, sub: subs.join(' · '), value: n(c.montant_location) });
  if (n(c.frais_aller_simple) > 0) lines.push({ label: 'Frais aller simple', sub: `${c.ville_depart} vers ${c.ville_retour}`, value: n(c.frais_aller_simple) });
  if (n(c.frais_rapatriement) > 0) lines.push({ label: 'Frais de rapatriement', sub: 'Acheminement du véhicule jusqu’à la ville de départ', value: n(c.frais_rapatriement) });
  for (const o of c.options) lines.push({ label: o.libelle.charAt(0).toUpperCase() + o.libelle.slice(1), value: n(o.montant) });
  if (n(c.remise_fidelite) > 0) lines.push({ label: 'Remise fidélité', sub: 'Merci pour votre fidélité', value: -n(c.remise_fidelite), tone: 'discount' });
  if (n(c.remise_promo) > 0) lines.push({ label: `Code promo${c.code_promo ? ` ${c.code_promo}` : ''}`, value: -n(c.remise_promo), tone: 'discount' });
  if (n(c.avoir_utilise) > 0) lines.push({ label: 'Avoir utilisé', value: -n(c.avoir_utilise), tone: 'discount' });
  return lines;
}

export function totals(c: Commande) {
  return { total: n(c.montant_total), paye: n(c.montant_paye), reste: c.statut === 'annulee' ? 0 : reste(c) };
}

export function cautionText(c: Commande, reserveGold: number) {
  if (hasOption(c, 'gold')) return { gold: true, text: `Assurance Gold : sans caution, ${euro(reserveGold)} retenus si restitution sale & sans carburant` };
  return { gold: false, text: `Caution de ${euro(c.caution)}${c.caution_doublee ? ' (caution doublée : jeune conducteur ou permis récent)' : ''}, par chèque à remettre à l’agent au départ` };
}

export function kmText(c: Commande, kmJour: number) {
  return hasOption(c, 'km_illimite') ? 'Kilométrage illimité' : `${kmJour} km/jour inclus`;
}

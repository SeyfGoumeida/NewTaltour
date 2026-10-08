import type { Commande, Modele, StatutCommande, StatutPaiement, ModePaiement } from '@/lib/types';

export interface CommandeItem {
  id: number;
  reference: string;
  date_depart: string;
  date_retour: string;
  jours: number;
  montant_total: number;
  montant_paye: number;
  statut: StatutCommande;
  statut_paiement: StatutPaiement;
  mode_paiement: ModePaiement;
  created_at: string;
  modele_nom: string;
  modele_image: string | null;
  modele_slug: string;
  ville_depart: string;
  ville_retour: string;
  avis_laisse: boolean;
}

export interface Resume {
  reservations: number;
  a_venir: number;
  terminees: number;
  avoir: number | string;
  fidelite: boolean;
  prochaine: {
    reference: string;
    date_depart: string;
    date_retour: string;
    statut: StatutCommande;
    modele_nom: string;
    modele_image: string | null;
    ville_depart: string;
    ville_retour: string;
  } | null;
}

export interface Avoir {
  id: number;
  montant: number;
  solde: number;
  motif: string | null;
  created_at: string;
  reference: string | null;
}

export interface AnnulationPreview {
  annulable: boolean;
  montant_paye: number;
  assurance_annulation: boolean;
  remboursement: { retenue_pct: number; retenue: number; rembourse: number };
  avoir: number;
}

export interface DevisChangement {
  montant_total: number;
  ancien_total: number;
  difference: number;
  modele: Modele;
  erreurs: string[];
}

export type Filtre = 'a_venir' | 'en_cours' | 'passees' | 'annulees' | 'toutes';

export const FILTRES: { value: Filtre; label: string }[] = [
  { value: 'a_venir', label: 'À venir' },
  { value: 'en_cours', label: 'En cours' },
  { value: 'passees', label: 'Passées' },
  { value: 'annulees', label: 'Annulées' },
  { value: 'toutes', label: 'Toutes' },
];

export function phase(c: { statut: StatutCommande; date_depart: string; date_retour: string }, now = Date.now()): Exclude<Filtre, 'toutes'> {
  if (c.statut === 'annulee') return 'annulees';
  if (c.statut === 'terminee') return 'passees';
  if (c.statut === 'en_cours') return 'en_cours';
  const dep = new Date(c.date_depart).getTime();
  const ret = new Date(c.date_retour).getTime();
  if (now >= ret) return 'passees';
  if (now >= dep) return 'en_cours';
  return 'a_venir';
}

export const n = (v: number | string | null | undefined) => Number(v || 0);

export const reste = (c: { montant_total: number; montant_paye: number }) => Math.max(0, Math.round((n(c.montant_total) - n(c.montant_paye)) * 100) / 100);

export const hasOption = (c: Pick<Commande, 'options'>, code: string) => c.options.some((o) => o.code === code);

export const modifiable = (c: { statut: StatutCommande }) => c.statut === 'en_attente' || c.statut === 'confirmee';

export function safeRedirect(raw: string | null | undefined) {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return null;
  return raw;
}

export function vehiculeAge(c: Pick<Commande, 'vehicule_annee' | 'created_at'>) {
  if (!c.vehicule_annee) return null;
  return new Date(c.created_at).getUTCFullYear() - c.vehicule_annee;
}

export const AGENT_TENUE = 'Les agents taltour sont habillés en chemise jaune, pantalon et veste bleu, avec le logo Taltour brodé sur les vêtements. Un panneau Taltour est posé sur le toit de la voiture.';
export const ALGER_RDV = 'TERMINAL OUEST / PARKING / P02 / 2 A';

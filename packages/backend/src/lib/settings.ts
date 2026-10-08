import { q } from '../db';

export interface Tarification {
  forfaits: number[];
  frais_aller_simple: number;
  tarif_rapatriement_km: number;
  km_inclus_jour: number;
  remise_fidelite_pct: number;
  remise_age: Record<string, number>;
  reserve_gold: number;
  tolerance_heures: number;
  annulation_plus_48h_pct: number;
  annulation_moins_48h_pct: number;
  acompte_deux_fois_pct: number;
}

export interface ReglesConducteur {
  age_min: number;
  permis_min_ans: number;
  permis_experimente_ans: number;
  puissance_seuil_ch: number;
  age_min_puissant: number;
  age_max_gold: number;
}

export interface Settings {
  entreprise: Record<string, any>;
  tarification: Tarification;
  conducteur: ReglesConducteur;
}

export async function loadSettings(): Promise<Settings> {
  const rows = await q<{ cle: string; valeur: any }>('SELECT cle, valeur FROM parametres');
  const m = Object.fromEntries(rows.map((r) => [r.cle, r.valeur]));
  return m as Settings;
}

export interface Saison {
  date_debut: string;
  date_fin: string;
  coefficient: number;
}

export const loadSaisons = () => q<Saison>('SELECT date_debut, date_fin, coefficient FROM saisons ORDER BY date_debut');

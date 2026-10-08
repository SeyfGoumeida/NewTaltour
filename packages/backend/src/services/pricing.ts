import { ReglesConducteur, Saison, Settings } from '../lib/settings';
import { round2 } from '../lib/http';

export interface TarifP { jours: number; prix: number }
export interface ModelP { id: number; caution: number; puissance_ch: number | null; tarifs: TarifP[] }
export interface VehicleP { id: number; annee: number; ville_id: number }
export interface VilleP { id: number; nom: string; latitude: number; longitude: number }
export interface OptionP { id: number; code: string; libelle: string; libelle_court?: string | null; type_prix: 'fixe' | 'par_jour' | 'pourcentage'; prix: number }

const DAY = 86_400_000;
const ROAD_FACTOR = 1.17;

export function rentalDays(depart: Date, retour: Date, toleranceH: number): number {
  const hours = (retour.getTime() - depart.getTime()) / 3_600_000;
  return Math.max(1, Math.ceil((hours - toleranceH) / 24));
}

export function pickForfait(tarifs: TarifP[], jours: number): TarifP | undefined {
  const usable = tarifs.filter((t) => t.prix > 0).sort((a, b) => a.jours - b.jours);
  let best: TarifP | undefined;
  for (const t of usable) if (t.jours <= jours) best = t;
  return best ?? usable[0];
}

export function seasonCoefficient(depart: Date, jours: number, saisons: Saison[]): number {
  if (!saisons.length) return 1;
  let sum = 0;
  for (let i = 0; i < jours; i++) {
    const d = new Date(depart.getTime() + i * DAY).toISOString().slice(0, 10);
    const s = saisons.find((x) => d >= x.date_debut && d <= x.date_fin);
    sum += s ? Number(s.coefficient) : 1;
  }
  return round2(sum / jours);
}

export function ageDiscountPct(annee: number, now: Date, remiseAge: Record<string, number>): number {
  const age = now.getUTCFullYear() - annee;
  const steps = Object.keys(remiseAge).map(Number).sort((a, b) => a - b);
  let pct = 0;
  for (const s of steps) if (age >= s) pct = remiseAge[String(s)];
  return pct;
}

export function distanceKm(a: VilleP, b: VilleP): number {
  const R = 6371;
  const rad = (x: number) => (x * Math.PI) / 180;
  const dLat = rad(b.latitude - a.latitude);
  const dLng = rad(b.longitude - a.longitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h)) * ROAD_FACTOR;
}

export interface RentalQuote {
  vehicule_id: number;
  jours: number;
  forfait_jours: number;
  prix_jour_base: number;
  coefficient_saison: number;
  prix_jour: number;
  remise_age_pct: number;
  prix_jour_remise: number;
  montant_brut: number;
  montant_location: number;
  frais_aller_simple: number;
  frais_rapatriement: number;
  ville_vehicule_id: number;
  total: number;
}

export function quoteRental(p: {
  model: ModelP;
  vehicle: VehicleP;
  villes: Map<number, VilleP>;
  departId: number;
  retourId: number;
  depart: Date;
  retour: Date;
  settings: Settings;
  saisons: Saison[];
  now?: Date;
}): RentalQuote | undefined {
  const t = p.settings.tarification;
  const jours = rentalDays(p.depart, p.retour, t.tolerance_heures);
  const forfait = pickForfait(p.model.tarifs, jours);
  if (!forfait) return undefined;
  const prix_jour_base = forfait.prix / forfait.jours;
  const coefficient_saison = seasonCoefficient(p.depart, jours, p.saisons);
  const prix_jour = round2(prix_jour_base * coefficient_saison);
  const montant_brut = round2(prix_jour_base * coefficient_saison * jours);
  const remise_age_pct = ageDiscountPct(p.vehicle.annee, p.now ?? new Date(), t.remise_age);
  const montant_location = round2(montant_brut * (1 - remise_age_pct / 100));
  const frais_aller_simple = p.departId !== p.retourId ? t.frais_aller_simple : 0;
  let frais_rapatriement = 0;
  if (p.vehicle.ville_id !== p.departId) {
    const from = p.villes.get(p.vehicle.ville_id);
    const to = p.villes.get(p.departId);
    if (from && to) frais_rapatriement = round2(distanceKm(from, to) * t.tarif_rapatriement_km);
  }
  return {
    vehicule_id: p.vehicle.id,
    jours,
    forfait_jours: forfait.jours,
    prix_jour_base: round2(prix_jour_base),
    coefficient_saison,
    prix_jour,
    remise_age_pct,
    prix_jour_remise: round2(montant_location / jours),
    montant_brut,
    montant_location,
    frais_aller_simple,
    frais_rapatriement,
    ville_vehicule_id: p.vehicle.ville_id,
    total: round2(montant_location + frais_aller_simple + frais_rapatriement),
  };
}

export function optionAmount(o: OptionP, jours: number, montantLocation: number): number {
  if (o.type_prix === 'fixe') return round2(o.prix);
  if (o.type_prix === 'par_jour') return round2(o.prix * jours);
  return round2((montantLocation * o.prix) / 100);
}

function yearsBetween(from: string, to: Date): number {
  const d = new Date(from + 'T00:00:00Z');
  let y = to.getUTCFullYear() - d.getUTCFullYear();
  const m = to.getUTCMonth() - d.getUTCMonth();
  if (m < 0 || (m === 0 && to.getUTCDate() < d.getUTCDate())) y--;
  return y;
}

export interface DriverCheck {
  erreurs: string[];
  caution_doublee: boolean;
  gold_interdit: boolean;
}

export function checkDriver(
  driver: { date_naissance?: string | null; date_permis?: string | null },
  puissance: number | null,
  depart: Date,
  r: ReglesConducteur,
): DriverCheck {
  const erreurs: string[] = [];
  if (!driver.date_naissance || !driver.date_permis) {
    return { erreurs: ['Date de naissance et date du permis obligatoires'], caution_doublee: false, gold_interdit: false };
  }
  const age = yearsBetween(driver.date_naissance, depart);
  const permis = yearsBetween(driver.date_permis, depart);
  if (permis < r.permis_min_ans) erreurs.push(`Un minimum de ${r.permis_min_ans} ans de permis est obligatoire.`);
  if (age < r.age_min && permis <= r.permis_experimente_ans)
    erreurs.push(`Le conducteur doit être âgé d'au moins ${r.age_min} ans ou être titulaire du permis de conduire depuis plus de ${r.permis_experimente_ans} ans.`);
  if (puissance && puissance > r.puissance_seuil_ch && (age <= r.age_min_puissant || permis <= r.permis_experimente_ans))
    erreurs.push(`Les véhicules dépassant ${r.puissance_seuil_ch} chevaux ne peuvent être loués qu'aux conducteurs âgés de plus de ${r.age_min_puissant} ans et titulaires du permis depuis plus de ${r.permis_experimente_ans} ans.`);
  const jeune = permis < r.permis_experimente_ans || age > r.age_max_gold;
  return { erreurs, caution_doublee: jeune, gold_interdit: jeune };
}

export interface CancelTerms { retenue_pct: number; retenue: number; rembourse: number }

export function cancellationTerms(
  montantTotal: number,
  montantPaye: number,
  depart: Date,
  now: Date,
  assuranceAnnulation: boolean,
  t: Settings['tarification'],
): CancelTerms {
  if (assuranceAnnulation) return { retenue_pct: 0, retenue: 0, rembourse: round2(montantPaye) };
  const hours = (depart.getTime() - now.getTime()) / 3_600_000;
  const pct = hours >= 48 ? t.annulation_plus_48h_pct : t.annulation_moins_48h_pct;
  const retenue = Math.min(round2(montantPaye), round2((montantTotal * pct) / 100));
  return { retenue_pct: pct, retenue, rembourse: round2(montantPaye - retenue) };
}

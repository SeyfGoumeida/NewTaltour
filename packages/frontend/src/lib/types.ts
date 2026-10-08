export type SiteCode = 'dz' | 'ma';

export interface Ville { id: number; nom: string; aeroport: boolean; point_rdv: string | null; agent_nom: string | null; agent_tel: string | null }

export interface SiteInfo {
  code: SiteCode;
  nom: string;
  titre: string;
  slogan: string | null;
  telephones: string[];
  hotline: string | null;
  villes: Ville[];
  entreprise: {
    nom: string;
    depuis: number;
    hotline_contact: string[];
    panne: string;
    adresse_cheque: string[];
    facebook: string;
    instagram: string;
    youtube: string;
  };
  tarification: {
    forfaits: number[];
    frais_aller_simple: number;
    km_inclus_jour: number;
    remise_fidelite_pct: number;
    remise_age: Record<string, number>;
    reserve_gold: number;
    tolerance_heures: number;
    annulation_plus_48h_pct: number;
    annulation_moins_48h_pct: number;
    acompte_deux_fois_pct: number;
  };
  conducteur: Record<string, number>;
  stats: { avis: number; note: number; modeles: number };
}

export interface Tarif { jours: number; prix: number }

export interface Modele {
  id: number;
  site: SiteCode;
  slug: string;
  nom: string;
  nom_affiche: string;
  marque: string;
  categorie: 'A' | 'B' | 'C' | 'D' | null;
  categorie_libelle: string | null;
  places: number | null;
  portes: number | null;
  coffre_l: number | null;
  reservoir_l: number | null;
  carburant: 'essence' | 'diesel';
  boite: 'manuelle' | 'automatique';
  type_boite: string | null;
  puissance_ch: number | null;
  airbags: number | null;
  vitesse_max: number | null;
  consommation: string | null;
  caution: number;
  equipements: string[];
  image: string | null;
  tarifs: Tarif[];
  fiche?: Record<string, Record<string, string | boolean | null>>;
  villes?: string[];
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

export interface SearchResult extends Modele { quote: RentalQuote; villes_vehicules: string[] }

export interface Option {
  id: number;
  code: string;
  libelle: string;
  libelle_court: string | null;
  description: string | null;
  type_prix: 'fixe' | 'par_jour' | 'pourcentage';
  prix: number;
  actif: boolean;
}

export interface Devis {
  modele: Modele;
  location: RentalQuote;
  options: { option_id: number; code: string; libelle: string; montant: number }[];
  montant_options: number;
  remise_fidelite: number;
  remise_promo: number;
  promo: { code: string; message: string } | null;
  avoir_disponible: number;
  avoir_utilise: number;
  montant_total: number;
  caution: number;
  caution_doublee: boolean;
  reserve_gold: number;
  conducteur: { erreurs: string[]; caution_doublee: boolean; gold_interdit: boolean } | null;
  km_inclus_jour: number;
}

export interface User {
  id: number;
  email: string;
  nom: string;
  prenom: string;
  tel: string | null;
  societe: string | null;
  adresse: string | null;
  code_postal: string | null;
  commune: string | null;
  pays: string | null;
  num_permis: string | null;
  date_permis: string | null;
  date_naissance: string | null;
  role: number;
  created_at: string;
}

export type StatutCommande = 'en_attente' | 'confirmee' | 'en_cours' | 'terminee' | 'annulee';
export type StatutPaiement = 'non_paye' | 'acompte' | 'paye' | 'rembourse' | 'avoir';
export type ModePaiement = 'cb' | 'paypal' | 'cheque' | 'virement' | 'deux_fois';

export interface Commande {
  id: number;
  reference: string;
  site: SiteCode;
  contact_id: number;
  modele_id: number;
  vehicule_id: number | null;
  ville_depart_id: number;
  ville_retour_id: number;
  date_depart: string;
  date_retour: string;
  jours: number;
  forfait_jours: number;
  prix_jour: number;
  coefficient_saison: number;
  remise_age_pct: number;
  montant_location: number;
  frais_aller_simple: number;
  frais_rapatriement: number;
  montant_options: number;
  remise_fidelite: number;
  code_promo: string | null;
  remise_promo: number;
  avoir_utilise: number;
  montant_total: number;
  caution: number;
  caution_doublee: boolean;
  num_vol: string | null;
  remarques: string | null;
  statut: StatutCommande;
  mode_paiement: ModePaiement;
  statut_paiement: StatutPaiement;
  montant_paye: number;
  frais_annulation: number | null;
  annulee_at: string | null;
  created_at: string;
  modele_nom: string;
  modele_slug: string;
  modele_image: string | null;
  categorie: string | null;
  carburant: string;
  boite: string;
  places: number | null;
  portes: number | null;
  ville_depart: string;
  ville_retour: string;
  point_rdv: string | null;
  agent_nom: string | null;
  agent_tel: string | null;
  immatriculation: string | null;
  vehicule_annee: number | null;
  vehicule_couleur: string | null;
  email: string;
  nom: string;
  prenom: string;
  tel: string | null;
  societe: string | null;
  adresse: string | null;
  code_postal: string | null;
  commune: string | null;
  pays: string | null;
  num_permis: string | null;
  date_permis: string | null;
  date_naissance: string | null;
  options: { option_id: number; code: string; libelle: string; montant: number }[];
  paiements: { id: number; montant: number; methode: string; statut: string; reference: string | null; created_at: string }[];
  avis: { id: number; note: number; observation_reservation: string | null; observation_place: string | null; created_at: string } | null;
}

export interface Avis {
  id: number;
  auteur: string;
  note: number;
  observation_reservation: string | null;
  observation_place: string | null;
  created_at: string;
}

export interface Article { id: number; slug: string; titre: string; contenu: string; auteur: string | null; date_publication: string }

export interface Paged<T> { items: T[]; total: number; page: number; size: number }

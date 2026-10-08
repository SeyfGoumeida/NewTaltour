export interface Vehicle {
  id: number;
  marque: string;
  modele: string;
  annee: number;
  carburant: string;
  transmission: string;
  places: number;
  prix_jour: number;
  prix_caution: number;
  prix_assurance: number;
  disponible: boolean;
  image?: string;
}

export interface Reservation {
  id: number;
  contact_id: number;
  vehicule_id: number;
  date_debut: string;
  date_fin: string;
  montant_total: number;
  statut: 'pending' | 'confirmed' | 'cancelled' | 'active' | 'completed';
  payment_status: 'unpaid' | 'paid' | 'refunded';
  vehicle?: Vehicle;
}

export interface User {
  id: number;
  email: string;
  nom: string;
  prenom: string;
  tel?: string;
  adresse?: string;
  ville?: string;
  code_postal?: string;
  created_at: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface SearchFilters {
  dateDebut: string;
  dateFin: string;
  lieuPickup: string;
  lieuReturn: string;
}

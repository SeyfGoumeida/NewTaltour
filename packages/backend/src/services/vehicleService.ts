import { pool } from '../index';

export const vehicleService = {
  async listVehicles(filters?: any) {
    let query = `
      SELECT id, marque, modele, annee, carburant, transmission, places,
             prix_jour, prix_caution, prix_assurance, disponible
      FROM vehicules
      WHERE disponible = true
    `;

    const params: any[] = [];

    // Optional filters
    if (filters?.marque) {
      query += ` AND marque ILIKE $${params.length + 1}`;
      params.push(`%${filters.marque}%`);
    }

    if (filters?.carburant) {
      query += ` AND carburant = $${params.length + 1}`;
      params.push(filters.carburant);
    }

    if (filters?.places) {
      query += ` AND places >= $${params.length + 1}`;
      params.push(parseInt(filters.places));
    }

    query += ` ORDER BY prix_jour ASC`;

    const result = await pool.query(query, params);
    return result.rows;
  },

  async searchAvailable(dateDebut: string, dateFin: string, filters?: any) {
    // Use prepared statement to prevent SQL injection
    const query = `
      SELECT v.id, v.marque, v.modele, v.annee, v.carburant, v.transmission, v.places,
             v.prix_jour, v.prix_caution, v.prix_assurance
      FROM vehicules v
      WHERE v.disponible = true
      AND v.id NOT IN (
        SELECT vehicule_id FROM commandes
        WHERE statut IN ('pending', 'confirmed', 'active')
        AND date_fin > $1
        AND date_debut < $2
      )
      AND ($3::text IS NULL OR v.marque ILIKE $3)
      AND ($4::text IS NULL OR v.carburant = $4)
      AND ($5::integer IS NULL OR v.places >= $5)
      ORDER BY v.prix_jour ASC
    `;

    const params = [
      dateDebut,
      dateFin,
      filters?.marque ? `%${filters.marque}%` : null,
      filters?.carburant || null,
      filters?.places ? parseInt(filters.places) : null,
    ];

    const result = await pool.query(query, params);
    return result.rows;
  },

  async getVehicle(id: number) {
    const query = `
      SELECT id, marque, modelo, annee, immatriculation, carburant,
             transmission, places, prix_jour, prix_caution,
             prix_assurance, disponible, created_at
      FROM vehicules
      WHERE id = $1
    `;

    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      throw new Error('Vehicle not found');
    }

    return result.rows[0];
  },

  async getAvailability(vehiculeId: number, dateDebut: string, dateFin: string) {
    const query = `
      SELECT COUNT(*) as conflictCount
      FROM commandes
      WHERE vehicule_id = $1
      AND statut IN ('pending', 'confirmed', 'active')
      AND date_fin > $2
      AND date_debut < $3
    `;

    const result = await pool.query(query, [vehiculeId, dateDebut, dateFin]);
    return result.rows[0].conflictcount === 0;
  },

  async getStats() {
    const query = `
      SELECT
        COUNT(*) as total_vehicles,
        SUM(CASE WHEN disponible = true THEN 1 ELSE 0 END) as available_vehicles,
        AVG(prix_jour) as average_price,
        MIN(prix_jour) as min_price,
        MAX(prix_jour) as max_price
      FROM vehicules
    `;

    const result = await pool.query(query);
    return result.rows[0];
  },
};

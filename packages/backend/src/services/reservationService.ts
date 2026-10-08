import { pool } from '../index';

export const reservationService = {
  async createReservation(userId: number, data: any) {
    const {
      vehicule_id,
      date_debut,
      date_fin,
      lieu_pickup,
      lieu_return,
      assurance,
    } = data;

    // Validate dates
    const startDate = new Date(date_debut);
    const endDate = new Date(date_fin);

    if (endDate <= startDate) {
      throw new Error('End date must be after start date');
    }

    // Get vehicle pricing
    const vehicleResult = await pool.query(
      'SELECT prix_jour, prix_assurance FROM vehicules WHERE id = $1 AND disponible = true',
      [vehicule_id]
    );

    if (vehicleResult.rows.length === 0) {
      throw new Error('Vehicle not found or not available');
    }

    const vehicle = vehicleResult.rows[0];
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const montantTotal = vehicle.prix_jour * days;
    const prixAssurance = assurance === 'gold' ? vehicle.prix_assurance * days : 0;

    // Start transaction
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Create reservation
      const reservationResult = await client.query(
        `INSERT INTO commandes (contact_id, vehicule_id, date_debut, date_fin,
         lieu_pickup, lieu_return, assurance, prix_assurance, montant_total,
         statut, payment_status, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending', 'unpaid',
         CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         RETURNING id, contact_id, vehicule_id, date_debut, date_fin,
         lieu_pickup, lieu_return, montant_total, assurance, statut`,
        [
          userId,
          vehicule_id,
          date_debut,
          date_fin,
          lieu_pickup,
          lieu_return,
          assurance,
          prixAssurance,
          montantTotal,
        ]
      );

      // Log to audit
      await client.query(
        `INSERT INTO audit_log (admin_id, action, table_name, record_id, new_values)
         VALUES (NULL, 'CREATE_RESERVATION', 'commandes', $1, $2)`,
        [reservationResult.rows[0].id, JSON.stringify(reservationResult.rows[0])]
      );

      await client.query('COMMIT');
      return reservationResult.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async getUserReservations(userId: number) {
    const query = `
      SELECT c.id, c.contact_id, c.vehicule_id, c.date_debut, c.date_fin,
             c.montant_total, c.statut, c.payment_status, c.assurance,
             v.marque, v.modele, v.annee, c.created_at
      FROM commandes c
      JOIN vehicules v ON c.vehicule_id = v.id
      WHERE c.contact_id = $1
      ORDER BY c.created_at DESC
    `;

    const result = await pool.query(query, [userId]);
    return result.rows;
  },

  async getReservation(id: number, userId?: number) {
    let query = `
      SELECT c.id, c.contact_id, c.vehicule_id, c.date_debut, c.date_fin,
             c.montant_total, c.statut, c.payment_status, c.assurance,
             v.marque, v.modelo, v.annee,
             ct.email, ct.nom, ct.prenom, c.created_at
      FROM commandes c
      JOIN vehicules v ON c.vehicule_id = v.id
      JOIN contacts ct ON c.contact_id = ct.id
      WHERE c.id = $1
    `;

    const params: any[] = [id];

    // If userId provided, verify ownership
    if (userId) {
      query += ` AND c.contact_id = $2`;
      params.push(userId);
    }

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      throw new Error('Reservation not found');
    }

    return result.rows[0];
  },

  async updateReservation(id: number, userId: number, data: any) {
    // Verify user owns reservation
    await this.getReservation(id, userId);

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    // Only allow updating certain fields
    const allowedFields = ['lieu_pickup', 'lieu_return'];

    for (const [key, value] of Object.entries(data)) {
      if (allowedFields.includes(key) && value !== undefined) {
        updates.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }

    if (updates.length === 0) {
      throw new Error('No valid fields to update');
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await pool.query(
      `UPDATE commandes SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    return result.rows[0];
  },

  async cancelReservation(id: number, userId: number) {
    // Verify user owns reservation
    const reservation = await this.getReservation(id, userId);

    if (reservation.payment_status === 'paid') {
      throw new Error('Cannot cancel a paid reservation. Contact support.');
    }

    const result = await pool.query(
      `UPDATE commandes SET statut = 'cancelled', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND contact_id = $2 RETURNING *`,
      [id, userId]
    );

    if (result.rows.length === 0) {
      throw new Error('Reservation not found');
    }

    return result.rows[0];
  },
};

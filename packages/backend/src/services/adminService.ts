import { pool } from '../index';

export const adminService = {
  async getDashboardStats() {
    const queries = [
      // Total users
      pool.query('SELECT COUNT(*) as count FROM contacts WHERE role = 0'),
      // Total vehicles
      pool.query('SELECT COUNT(*) as count FROM vehicules'),
      // Total reservations
      pool.query('SELECT COUNT(*) as count FROM commandes'),
      // Total revenue
      pool.query(`
        SELECT COALESCE(SUM(montant), 0) as total
        FROM payment_logs
        WHERE statut = 'success'
      `),
      // Pending reservations
      pool.query(`
        SELECT COUNT(*) as count FROM commandes
        WHERE statut = 'pending'
      `),
      // Active reservations
      pool.query(`
        SELECT COUNT(*) as count FROM commandes
        WHERE statut = 'active' AND date_fin >= CURRENT_DATE
      `),
    ];

    const results = await Promise.all(queries);

    return {
      totalUsers: parseInt(results[0].rows[0].count),
      totalVehicles: parseInt(results[1].rows[0].count),
      totalReservations: parseInt(results[2].rows[0].count),
      totalRevenue: parseFloat(results[3].rows[0].total),
      pendingReservations: parseInt(results[4].rows[0].count),
      activeReservations: parseInt(results[5].rows[0].count),
    };
  },

  async getReservationsList(filters?: any) {
    let query = `
      SELECT c.id, c.contact_id, c.vehicule_id, c.date_debut, c.date_fin,
             c.montant_total, c.statut, c.payment_status, c.created_at,
             v.marque, v.modelo, ct.email, ct.nom, ct.prenom
      FROM commandes c
      JOIN vehicules v ON c.vehicule_id = v.id
      JOIN contacts ct ON c.contact_id = ct.id
      WHERE 1=1
    `;

    const params: any[] = [];

    if (filters?.statut) {
      query += ` AND c.statut = $${params.length + 1}`;
      params.push(filters.statut);
    }

    if (filters?.paymentStatus) {
      query += ` AND c.payment_status = $${params.length + 1}`;
      params.push(filters.paymentStatus);
    }

    query += ` ORDER BY c.created_at DESC LIMIT 50`;

    const result = await pool.query(query, params);
    return result.rows;
  },

  async getUsersList(filters?: any) {
    let query = `
      SELECT id, email, nom, prenom, tel, adresse, ville,
             created_at, role
      FROM contacts
      WHERE role = 0
    `;

    const params: any[] = [];

    if (filters?.search) {
      query += ` AND (email ILIKE $${params.length + 1}
                    OR nom ILIKE $${params.length + 1}
                    OR prenom ILIKE $${params.length + 1})`;
      params.push(`%${filters.search}%`);
      params.push(`%${filters.search}%`);
      params.push(`%${filters.search}%`);
    }

    query += ` ORDER BY created_at DESC LIMIT 100`;

    const result = await pool.query(query, params);
    return result.rows;
  },

  async getVehiclesList() {
    const query = `
      SELECT id, marque, modelo, annee, immatriculation, carburant,
             transmission, places, prix_jour, disponible,
             (SELECT COUNT(*) FROM commandes
              WHERE vehicule_id = vehicules.id
              AND statut IN ('pending', 'confirmed', 'active')) as active_reservations
      FROM vehicules
      ORDER BY marque, modelo
    `;

    const result = await pool.query(query);
    return result.rows;
  },

  async getAuditLog(filters?: any) {
    let query = `
      SELECT al.id, al.admin_id, al.action, al.table_name, al.record_id,
             al.old_values, al.new_values, al.created_at,
             a.username
      FROM audit_log al
      LEFT JOIN admins a ON al.admin_id = a.id
      WHERE 1=1
    `;

    const params: any[] = [];

    if (filters?.action) {
      query += ` AND al.action = $${params.length + 1}`;
      params.push(filters.action);
    }

    if (filters?.tableName) {
      query += ` AND al.table_name = $${params.length + 1}`;
      params.push(filters.tableName);
    }

    query += ` ORDER BY al.created_at DESC LIMIT 500`;

    const result = await pool.query(query, params);
    return result.rows;
  },

  async getRevenueTrends(days: number = 30) {
    const query = `
      SELECT DATE(pl.created_at) as date,
             SUM(CASE WHEN pl.statut = 'success' THEN pl.montant ELSE 0 END) as revenue,
             COUNT(*) as transactions,
             COUNT(CASE WHEN pl.statut = 'success' THEN 1 END) as successful
      FROM payment_logs pl
      WHERE pl.created_at >= CURRENT_DATE - INTERVAL '1 day' * $1
      GROUP BY DATE(pl.created_at)
      ORDER BY date DESC
    `;

    const result = await pool.query(query, [days]);
    return result.rows;
  },

  async updateVehicleAvailability(vehicleId: number, available: boolean) {
    const result = await pool.query(
      `UPDATE vehicules SET disponible = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 RETURNING *`,
      [available, vehicleId]
    );

    if (result.rows.length === 0) {
      throw new Error('Vehicle not found');
    }

    // Log to audit
    await pool.query(
      `INSERT INTO audit_log (action, table_name, record_id, new_values)
       VALUES ($1, $2, $3, $4)`,
      [
        'UPDATE_VEHICLE',
        'vehicules',
        vehicleId,
        JSON.stringify({ disponible: available }),
      ]
    );

    return result.rows[0];
  },

  async deleteReservation(reservationId: number) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Get reservation details
      const resResult = await client.query(
        'SELECT * FROM commandes WHERE id = $1',
        [reservationId]
      );

      if (resResult.rows.length === 0) {
        throw new Error('Reservation not found');
      }

      const reservation = resResult.rows[0];

      // Delete reservation
      await client.query('DELETE FROM commandes WHERE id = $1', [reservationId]);

      // Log deletion
      await client.query(
        `INSERT INTO audit_log (action, table_name, record_id, old_values)
         VALUES ($1, $2, $3, $4)`,
        [
          'DELETE_RESERVATION',
          'commandes',
          reservationId,
          JSON.stringify(reservation),
        ]
      );

      await client.query('COMMIT');
      return { success: true, message: 'Reservation deleted' };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },
};

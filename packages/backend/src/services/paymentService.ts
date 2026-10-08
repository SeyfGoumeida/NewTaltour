import { pool } from '../index';

export const paymentService = {
  async createPaymentIntent(reservationId: number, userId: number) {
    // Get reservation details
    const reservationResult = await pool.query(
      `SELECT c.id, c.email, c.montant_total, c.statut
       FROM commandes c
       WHERE c.id = $1 AND c.contact_id = $2`,
      [reservationId, userId]
    );

    if (reservationResult.rows.length === 0) {
      throw new Error('Reservation not found');
    }

    const reservation = reservationResult.rows[0];

    if (reservation.statut === 'cancelled') {
      throw new Error('Cannot pay for cancelled reservation');
    }

    // In production, create Stripe PaymentIntent
    // For now, return mock payment object
    const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Log payment attempt
    await pool.query(
      `INSERT INTO payment_logs (commande_id, contact_id, montant, methode_paiement, statut)
       VALUES ($1, $2, $3, $4, $5)`,
      [reservationId, userId, reservation.montant_total, 'stripe', 'pending']
    );

    return {
      paymentId,
      amount: reservation.montant_total,
      currency: 'eur',
      email: reservation.email,
      reservationId,
    };
  },

  async processPayment(
    reservationId: number,
    userId: number,
    paymentToken: string,
    method: string
  ) {
    // Start transaction
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Verify reservation exists and belongs to user
      const reservationResult = await client.query(
        `SELECT id, montant_total, statut, payment_status
         FROM commandes
         WHERE id = $1 AND contact_id = $2`,
        [reservationId, userId]
      );

      if (reservationResult.rows.length === 0) {
        throw new Error('Reservation not found');
      }

      const reservation = reservationResult.rows[0];

      if (reservation.payment_status === 'paid') {
        throw new Error('Reservation already paid');
      }

      // In production: call Stripe API to charge card
      // For now, assume payment succeeds
      const paymentSuccess = Math.random() > 0.1; // 90% success rate for demo

      if (!paymentSuccess) {
        throw new Error('Payment declined');
      }

      // Update payment log
      const paymentResult = await client.query(
        `INSERT INTO payment_logs (commande_id, contact_id, montant, methode_paiement, statut, reference_externe)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id`,
        [
          reservationId,
          userId,
          reservation.montant_total,
          method,
          'success',
          paymentToken,
        ]
      );

      // Update reservation status
      await client.query(
        `UPDATE commandes
         SET payment_status = 'paid', statut = 'confirmed', updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [reservationId]
      );

      // Log to audit
      await client.query(
        `INSERT INTO audit_log (action, table_name, record_id, new_values)
         VALUES ($1, $2, $3, $4)`,
        [
          'PAYMENT_PROCESSED',
          'payment_logs',
          paymentResult.rows[0].id,
          JSON.stringify({
            reservationId,
            amount: reservation.montant_total,
            method,
            status: 'success',
          }),
        ]
      );

      await client.query('COMMIT');

      return {
        success: true,
        paymentId: paymentResult.rows[0].id,
        reservationId,
        amount: reservation.montant_total,
        message: 'Payment processed successfully',
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async getPaymentHistory(userId: number) {
    const query = `
      SELECT pl.id, pl.commande_id, pl.montant, pl.methode_paiement,
             pl.statut, pl.created_at,
             c.vehicle_id, v.marque, v.modele
      FROM payment_logs pl
      JOIN commandes c ON pl.commande_id = c.id
      JOIN vehicules v ON c.vehicule_id = v.id
      WHERE pl.contact_id = $1
      ORDER BY pl.created_at DESC
    `;

    const result = await pool.query(query, [userId]);
    return result.rows;
  },

  async refundPayment(paymentId: number, userId: number) {
    // Get payment details
    const paymentResult = await pool.query(
      `SELECT pl.id, pl.commande_id, pl.montant, pl.statut
       FROM payment_logs pl
       JOIN commandes c ON pl.commande_id = c.id
       WHERE pl.id = $1 AND c.contact_id = $2`,
      [paymentId, userId]
    );

    if (paymentResult.rows.length === 0) {
      throw new Error('Payment not found');
    }

    const payment = paymentResult.rows[0];

    if (payment.statut !== 'success') {
      throw new Error('Only successful payments can be refunded');
    }

    // Start transaction
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      // Update payment status
      await client.query(
        `UPDATE payment_logs SET statut = 'refunded' WHERE id = $1`,
        [paymentId]
      );

      // Update reservation status
      await client.query(
        `UPDATE commandes SET payment_status = 'refunded', statut = 'cancelled'
         WHERE id = $1`,
        [payment.commande_id]
      );

      // Log refund
      await client.query(
        `INSERT INTO audit_log (action, table_name, record_id, new_values)
         VALUES ($1, $2, $3, $4)`,
        [
          'PAYMENT_REFUNDED',
          'payment_logs',
          paymentId,
          JSON.stringify({
            originalPaymentId: paymentId,
            amount: payment.montant,
            reservationId: payment.commande_id,
          }),
        ]
      );

      await client.query('COMMIT');

      return {
        success: true,
        message: 'Payment refunded successfully',
        amount: payment.montant,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },
};

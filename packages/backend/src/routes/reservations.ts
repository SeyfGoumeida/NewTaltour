import express from 'express';
import { body, validationResult, param } from 'express-validator';
import { reservationService } from '../services/reservationService';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Create reservation
router.post(
  '/',
  authenticate,
  [
    body('vehicule_id').isInt().toInt(),
    body('date_debut').isISO8601(),
    body('date_fin').isISO8601(),
    body('lieu_pickup').notEmpty().trim(),
    body('lieu_return').notEmpty().trim(),
    body('assurance').optional().isIn(['basic', 'gold']),
  ],
  async (req: AuthRequest, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const reservation = await reservationService.createReservation(
        req.user.userId,
        req.body
      );
      res.status(201).json(reservation);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

// Get user's reservations
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const reservations = await reservationService.getUserReservations(req.user.userId);
    res.json(reservations);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get single reservation
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const reservation = await reservationService.getReservation(
      parseInt(req.params.id),
      req.user.userId
    );
    res.json(reservation);
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

// Update reservation
router.put(
  '/:id',
  authenticate,
  [
    param('id').isInt().toInt(),
    body('lieu_pickup').optional().notEmpty().trim(),
    body('lieu_return').optional().notEmpty().trim(),
  ],
  async (req: AuthRequest, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const reservation = await reservationService.updateReservation(
        req.params.id,
        req.user.userId,
        req.body
      );
      res.json(reservation);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

// Cancel reservation
router.post(
  '/:id/cancel',
  authenticate,
  [param('id').isInt().toInt()],
  async (req: AuthRequest, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const reservation = await reservationService.cancelReservation(
        parseInt(req.params.id),
        req.user.userId
      );
      res.json(reservation);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

export default router;

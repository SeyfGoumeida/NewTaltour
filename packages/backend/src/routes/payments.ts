import express from 'express';
import { body, param, validationResult } from 'express-validator';
import { paymentService } from '../services/paymentService';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = express.Router();

// Create payment intent
router.post(
  '/intent',
  authenticate,
  [param('reservationId').isInt().toInt()],
  async (req: AuthRequest, res) => {
    try {
      const { reservationId } = req.body;
      const intent = await paymentService.createPaymentIntent(
        reservationId,
        req.user.userId
      );
      res.json(intent);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

// Process payment
router.post(
  '/process',
  authenticate,
  [
    body('reservationId').isInt().toInt(),
    body('token').notEmpty().isString(),
    body('method').isIn(['card', 'paypal', 'apple_pay', 'google_pay']),
  ],
  async (req: AuthRequest, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { reservationId, token, method } = req.body;
      const result = await paymentService.processPayment(
        reservationId,
        req.user.userId,
        token,
        method
      );
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

// Get payment history
router.get('/history', authenticate, async (req: AuthRequest, res) => {
  try {
    const payments = await paymentService.getPaymentHistory(req.user.userId);
    res.json(payments);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Refund payment
router.post(
  '/:id/refund',
  authenticate,
  [param('id').isInt().toInt()],
  async (req: AuthRequest, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const result = await paymentService.refundPayment(
        parseInt(req.params.id),
        req.user.userId
      );
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

export default router;

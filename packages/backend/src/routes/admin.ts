import express from 'express';
import { query, param, validationResult } from 'express-validator';
import { adminService } from '../services/adminService';
import { authenticate, AuthRequest } from '../middleware/auth';
import { pool } from '../index';

const router = express.Router();

// Middleware to check admin role
const requireAdmin = async (req: AuthRequest, res: express.Response, next: express.NextFunction) => {
  try {
    const result = await pool.query(
      'SELECT role FROM contacts WHERE id = $1',
      [req.user.userId]
    );

    if (result.rows.length === 0 || result.rows[0].role !== 10) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    next();
  } catch (error) {
    res.status(500).json({ error: 'Authorization check failed' });
  }
};

// Apply auth middleware to all routes
router.use(authenticate);
router.use(requireAdmin);

// Dashboard stats
router.get('/dashboard', async (req: AuthRequest, res) => {
  try {
    const stats = await adminService.getDashboardStats();
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// List reservations
router.get(
  '/reservations',
  [
    query('statut').optional().isIn(['pending', 'confirmed', 'cancelled', 'active']),
    query('paymentStatus').optional().isIn(['unpaid', 'paid', 'refunded']),
  ],
  async (req: AuthRequest, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const reservations = await adminService.getReservationsList(req.query);
      res.json(reservations);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// List users
router.get('/users', async (req: AuthRequest, res) => {
  try {
    const users = await adminService.getUsersList(req.query);
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// List vehicles
router.get('/vehicles', async (req: AuthRequest, res) => {
  try {
    const vehicles = await adminService.getVehiclesList();
    res.json(vehicles);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update vehicle availability
router.patch(
  '/vehicles/:id',
  [
    param('id').isInt().toInt(),
    query('available').isBoolean(),
  ],
  async (req: AuthRequest, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const vehicle = await adminService.updateVehicleAvailability(
        parseInt(req.params.id),
        req.query.available === 'true'
      );
      res.json(vehicle);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

// Audit log
router.get(
  '/audit-log',
  [
    query('action').optional().isString(),
    query('tableName').optional().isString(),
  ],
  async (req: AuthRequest, res) => {
    try {
      const log = await adminService.getAuditLog(req.query);
      res.json(log);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Revenue trends
router.get(
  '/revenue-trends',
  [query('days').optional().isInt({ min: 1, max: 365 }).toInt()],
  async (req: AuthRequest, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const trends = await adminService.getRevenueTrends(
        (req.query.days as any) || 30
      );
      res.json(trends);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Delete reservation (admin only, for maintenance)
router.delete(
  '/reservations/:id',
  [param('id').isInt().toInt()],
  async (req: AuthRequest, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const result = await adminService.deleteReservation(parseInt(req.params.id));
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
);

export default router;

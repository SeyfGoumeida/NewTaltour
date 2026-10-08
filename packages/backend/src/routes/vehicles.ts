import express from 'express';
import { query, validationResult } from 'express-validator';
import { vehicleService } from '../services/vehicleService';
import { optional } from '../middleware/auth';

const router = express.Router();

// List all available vehicles
router.get('/', async (req, res) => {
  try {
    const vehicles = await vehicleService.listVehicles(req.query);
    res.json(vehicles);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Search available vehicles
router.get(
  '/search',
  [
    query('dateDebut').isISO8601(),
    query('dateFin').isISO8601(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { dateDebut, dateFin, ...filters } = req.query;
      const vehicles = await vehicleService.searchAvailable(
        dateDebut as string,
        dateFin as string,
        filters
      );
      res.json(vehicles);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Get single vehicle
router.get('/:id', async (req, res) => {
  try {
    const vehicle = await vehicleService.getVehicle(parseInt(req.params.id));
    res.json(vehicle);
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
});

// Check availability
router.get(
  '/:id/available',
  [
    query('dateDebut').isISO8601(),
    query('dateFin').isISO8601(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { dateDebut, dateFin } = req.query;
      const available = await vehicleService.getAvailability(
        parseInt(req.params.id),
        dateDebut as string,
        dateFin as string
      );
      res.json({ available });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Get statistics
router.get('/stats/summary', optional, async (req, res) => {
  try {
    const stats = await vehicleService.getStats();
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;

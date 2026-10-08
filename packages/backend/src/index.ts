import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { pool } from './db';
import { HttpError } from './lib/http';
import publicRoutes from './routes/public';
import authRoutes from './routes/auth';
import reservationRoutes from './routes/reservations';
import compteRoutes from './routes/compte';
import adminRoutes from './routes/admin';

const app = express();
const PORT = Number(process.env.PORT || 3001);

app.disable('x-powered-by');
app.use(express.json({ limit: '1mb' }));
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }));
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

const strict = rateLimit({ windowMs: 15 * 60_000, limit: 50, standardHeaders: true, legacyHeaders: false, message: { error: 'Trop de tentatives, réessayez plus tard' } });

app.get('/api/health', async (_req, res) => {
  await pool.query('SELECT 1');
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.use('/api/auth/login', strict);
app.use('/api/auth/forgot', strict);
app.use('/api/auth', authRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/compte', compteRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', publicRoutes);

app.use((_req, res) => res.status(404).json({ error: 'Introuvable' }));

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof HttpError) return res.status(err.status).json({ error: err.message, details: err.details });
  if (err?.code === '23505') return res.status(409).json({ error: 'Cette valeur existe déjà' });
  console.error(err);
  res.status(500).json({ error: 'Erreur interne du serveur' });
});

const server = app.listen(PORT, () => console.log(`API Taltour sur http://localhost:${PORT}`));

process.on('SIGTERM', () => server.close(() => pool.end(() => process.exit(0))));

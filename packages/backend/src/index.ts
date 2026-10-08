import express, { NextFunction, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import { pool } from './db';
import { HttpError } from './lib/http';
import publicRoutes from './routes/public';
import authRoutes from './routes/auth';
import reservationRoutes from './routes/reservations';
import compteRoutes from './routes/compte';
import adminRoutes from './routes/admin';

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', config.trustProxy);
app.use(helmet({ contentSecurityPolicy: { directives: { defaultSrc: ["'none'"], frameAncestors: ["'none'"] } }, crossOriginResourcePolicy: { policy: 'same-site' } }));
app.use(cors({ origin: config.frontendUrl, credentials: true, allowedHeaders: ['content-type', 'x-site', 'x-requested-with'] }));
app.use(express.json({ limit: '100kb' }));

app.use((req, res, next) => {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) && req.headers['x-requested-with'] !== 'taltour')
    return res.status(403).json({ error: 'Requête refusée' });
  next();
});

const limiter = (windowMin: number, limit: number) =>
  rateLimit({ windowMs: windowMin * 60_000, limit, standardHeaders: true, legacyHeaders: false, message: { error: 'Trop de tentatives, réessayez plus tard' } });

app.use('/api', limiter(15, 1500));
app.use('/api/auth/login', limiter(15, 20));
app.use('/api/auth/forgot', limiter(60, 5));
app.use('/api/auth/reset', limiter(60, 10));
app.use('/api/auth/register', limiter(60, 10));
app.use('/api/auth/password', limiter(15, 10));
app.post('/api/reservations', limiter(60, 15));
app.use('/api/contact', limiter(60, 8));
app.use('/api/transfert', limiter(60, 8));
app.use('/api/devis', limiter(15, 300));
app.use('/api/recherche', limiter(15, 300));

app.use(['/api/auth', '/api/compte', '/api/admin', '/api/reservations'], (_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
});

app.get('/api/health', async (_req, res) => {
  await pool.query('SELECT 1');
  res.json({ status: 'OK' });
});

app.use('/api/auth', authRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/compte', compteRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', publicRoutes);

app.use((_req, res) => res.status(404).json({ error: 'Introuvable' }));

app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof HttpError) return res.status(err.status).json({ error: err.message });
  if (err?.type === 'entity.parse.failed' || err?.type === 'entity.too.large') return res.status(400).json({ error: 'Requête invalide' });
  if (err?.code === '23505') return res.status(409).json({ error: 'Cette valeur existe déjà' });
  if (err?.code === '22P02' || err?.code === '22007' || err?.code === '22008') return res.status(400).json({ error: 'Valeur invalide' });
  console.error(err);
  res.status(500).json({ error: 'Erreur interne du serveur' });
});

const server = app.listen(config.port, () => console.log(`API Taltour sur http://localhost:${config.port}${config.isDev ? ' (développement)' : ''}`));

process.on('SIGTERM', () => server.close(() => pool.end(() => process.exit(0))));

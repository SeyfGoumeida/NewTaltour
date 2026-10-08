import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { one } from '../db';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-secret-change-me';

export interface AuthUser {
  id: number;
  role: number;
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthUser;
  }
}

export const ADMIN_ROLE = 10;

export const signToken = (u: AuthUser) => jwt.sign({ id: u.id, role: u.role }, JWT_SECRET, { expiresIn: '7d' });

function read(req: Request): AuthUser | undefined {
  const h = req.headers.authorization;
  if (!h?.startsWith('Bearer ')) return undefined;
  try {
    const d = jwt.verify(h.slice(7), JWT_SECRET) as AuthUser;
    return { id: d.id, role: d.role };
  } catch {
    return undefined;
  }
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  req.user = read(req);
  next();
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  req.user = read(req);
  if (!req.user) return res.status(401).json({ error: 'Veuillez vous connecter' });
  next();
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  req.user = read(req);
  if (!req.user) return res.status(401).json({ error: 'Veuillez vous connecter' });
  const row = await one<{ role: number }>('SELECT role FROM contacts WHERE id = $1', [req.user.id]);
  if (!row || row.role !== ADMIN_ROLE) return res.status(403).json({ error: 'Accès réservé aux administrateurs' });
  next();
}

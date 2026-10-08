import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { one } from '../db';
import { config } from '../config';

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
export const SESSION_COOKIE = 'taltour_session';

const cookieOptions = () => ({
  httpOnly: true,
  secure: config.cookieSecure,
  sameSite: 'lax' as const,
  path: '/',
  domain: config.cookieDomain,
});

export function startSession(res: Response, u: { id: number }) {
  const token = jwt.sign({ id: u.id }, config.jwtSecret, { algorithm: 'HS256', expiresIn: `${config.sessionDays}d` });
  res.cookie(SESSION_COOKIE, token, { ...cookieOptions(), maxAge: config.sessionDays * 86_400_000 });
}

export function endSession(res: Response) {
  res.clearCookie(SESSION_COOKIE, cookieOptions());
}

function readCookie(req: Request): string | undefined {
  const raw = req.headers.cookie;
  if (!raw) return undefined;
  for (const part of raw.split(';')) {
    const i = part.indexOf('=');
    if (i > 0 && part.slice(0, i).trim() === SESSION_COOKIE) return decodeURIComponent(part.slice(i + 1).trim());
  }
  return undefined;
}

async function resolve(req: Request): Promise<AuthUser | undefined> {
  const token = readCookie(req);
  if (!token) return undefined;
  let payload: { id: number; iat: number };
  try {
    payload = jwt.verify(token, config.jwtSecret, { algorithms: ['HS256'] }) as typeof payload;
  } catch {
    return undefined;
  }
  const row = await one<{ id: number; role: number; changed: number | null }>(
    'SELECT id, role, extract(epoch FROM password_changed_at)::bigint AS changed FROM contacts WHERE id = $1',
    [payload.id],
  );
  if (!row) return undefined;
  if (row.changed && payload.iat < Number(row.changed)) return undefined;
  return { id: row.id, role: row.role };
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  resolve(req).then((u) => { req.user = u; next(); }, next);
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  resolve(req).then((u) => {
    if (!u) return res.status(401).json({ error: 'Veuillez vous connecter' });
    req.user = u;
    next();
  }, next);
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  resolve(req).then((u) => {
    if (!u) return res.status(401).json({ error: 'Veuillez vous connecter' });
    if (u.role !== ADMIN_ROLE) return res.status(403).json({ error: 'Accès réservé aux administrateurs' });
    req.user = u;
    next();
  }, next);
}

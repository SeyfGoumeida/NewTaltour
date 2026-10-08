import { NextFunction, Request, Response } from 'express';
import { z, ZodType } from 'zod';

z.config(z.locales.fr());

export class HttpError extends Error {
  constructor(public status: number, message: string, public details?: unknown) {
    super(message);
  }
}

export const wrap =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) =>
    fn(req, res, next).catch(next);

export function parse<T extends ZodType>(schema: T, data: unknown): z.infer<T> {
  const r = schema.safeParse(data);
  if (!r.success) {
    const first = r.error.issues[0];
    throw new HttpError(400, first ? `${first.path.join('.') || 'champ'} : ${first.message}` : 'Données invalides', r.error.issues);
  }
  return r.data;
}

export function siteOf(req: Request): 'dz' | 'ma' {
  const s = (req.query.site || req.headers['x-site']) as string | undefined;
  return s === 'ma' ? 'ma' : 'dz';
}

export const round2 = (n: number) => Math.round(n * 100) / 100;

export function page(req: Request, defSize = 20) {
  const p = Math.max(1, parseInt(String(req.query.page || '1'), 10) || 1);
  const size = Math.min(200, Math.max(1, parseInt(String(req.query.size || defSize), 10) || defSize));
  return { page: p, size, offset: (p - 1) * size };
}

export const toDate = (s: string) => new Date(s.length === 16 ? `${s}:00Z` : s.endsWith('Z') || s.length === 10 ? s : `${s}Z`);

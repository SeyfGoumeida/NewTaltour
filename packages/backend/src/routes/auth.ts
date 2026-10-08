import { Router } from 'express';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { z } from 'zod';
import { q, one } from '../db';
import { HttpError, parse, wrap } from '../lib/http';
import { requireAuth, signToken } from '../lib/auth';

const r = Router();

export const PROFILE_COLUMNS = 'id, email, nom, prenom, tel, societe, adresse, code_postal, commune, pays, num_permis, date_permis, date_naissance, role, created_at';

const optStr = (max: number) => z.string().trim().max(max).optional().nullable().transform((v) => v || null);
const optDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date invalide').optional().nullable().or(z.literal('').transform(() => null));

export const profileSchema = z.object({
  nom: z.string().trim().min(1, 'obligatoire').max(100),
  prenom: z.string().trim().min(1, 'obligatoire').max(100),
  tel: optStr(30),
  societe: optStr(150),
  adresse: optStr(255),
  code_postal: optStr(10),
  commune: optStr(100),
  pays: optStr(100),
  num_permis: optStr(50),
  date_permis: optDate,
  date_naissance: optDate,
});

const registerSchema = profileSchema.extend({
  email: z.email('Email invalide'),
  password: z.string().min(8, '8 caractères minimum'),
});

r.post('/register', wrap(async (req, res) => {
  const p = parse(registerSchema, req.body);
  const email = p.email.toLowerCase();
  if (await one('SELECT 1 FROM contacts WHERE email = $1', [email])) throw new HttpError(409, 'Un compte existe déjà avec cet email');
  const hash = await bcrypt.hash(p.password, 12);
  const user = await one(`INSERT INTO contacts (email, nom, prenom, tel, societe, adresse, code_postal, commune, pays, num_permis, date_permis, date_naissance, password_hash)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING ${PROFILE_COLUMNS}`,
    [email, p.nom, p.prenom, p.tel, p.societe, p.adresse, p.code_postal, p.commune, p.pays, p.num_permis, p.date_permis, p.date_naissance, hash]);
  res.status(201).json({ token: signToken(user), user });
}));

r.post('/login', wrap(async (req, res) => {
  const p = parse(z.object({ email: z.email('Email invalide'), password: z.string().min(1) }), req.body);
  const row = await one(`SELECT ${PROFILE_COLUMNS}, password_hash FROM contacts WHERE email = $1`, [p.email.toLowerCase()]);
  if (!row?.password_hash || !(await bcrypt.compare(p.password, row.password_hash))) throw new HttpError(401, 'Email ou mot de passe incorrect');
  const { password_hash: _ph, ...user } = row;
  res.json({ token: signToken(user), user });
}));

r.get('/me', requireAuth, wrap(async (req, res) => {
  const user = await one(`SELECT ${PROFILE_COLUMNS} FROM contacts WHERE id = $1`, [req.user!.id]);
  if (!user) throw new HttpError(401, 'Compte introuvable');
  res.json(user);
}));

r.put('/me', requireAuth, wrap(async (req, res) => {
  const p = parse(profileSchema, req.body);
  const user = await one(`UPDATE contacts SET nom=$1, prenom=$2, tel=$3, societe=$4, adresse=$5, code_postal=$6, commune=$7, pays=$8, num_permis=$9,
      date_permis=$10, date_naissance=$11, updated_at=now() WHERE id=$12 RETURNING ${PROFILE_COLUMNS}`,
    [p.nom, p.prenom, p.tel, p.societe, p.adresse, p.code_postal, p.commune, p.pays, p.num_permis, p.date_permis, p.date_naissance, req.user!.id]);
  res.json(user);
}));

r.post('/password', requireAuth, wrap(async (req, res) => {
  const p = parse(z.object({ ancien: z.string().min(1), nouveau: z.string().min(8, '8 caractères minimum') }), req.body);
  const row = await one('SELECT password_hash FROM contacts WHERE id = $1', [req.user!.id]);
  if (!row?.password_hash || !(await bcrypt.compare(p.ancien, row.password_hash))) throw new HttpError(400, 'Mot de passe actuel incorrect');
  await q('UPDATE contacts SET password_hash = $1, updated_at = now() WHERE id = $2', [await bcrypt.hash(p.nouveau, 12), req.user!.id]);
  res.json({ ok: true });
}));

r.post('/forgot', wrap(async (req, res) => {
  const p = parse(z.object({ email: z.email('Email invalide') }), req.body);
  const row = await one('SELECT id FROM contacts WHERE email = $1 AND password_hash IS NOT NULL', [p.email.toLowerCase()]);
  let devLink: string | undefined;
  if (row) {
    const token = crypto.randomBytes(24).toString('hex');
    await q(`INSERT INTO password_resets (token, contact_id, expires_at) VALUES ($1, $2, now() + interval '1 hour')`, [token, row.id]);
    devLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/mon-compte/reinitialiser?token=${token}`;
    console.log(`[mot de passe oublié] ${p.email}: ${devLink}`);
  }
  res.json({ ok: true, ...(process.env.NODE_ENV !== 'production' && devLink ? { lien_dev: devLink } : {}) });
}));

r.post('/reset', wrap(async (req, res) => {
  const p = parse(z.object({ token: z.string().min(10), password: z.string().min(8, '8 caractères minimum') }), req.body);
  const row = await one('DELETE FROM password_resets WHERE token = $1 AND expires_at > now() RETURNING contact_id', [p.token]);
  if (!row) throw new HttpError(400, 'Lien expiré ou invalide');
  await q('UPDATE contacts SET password_hash = $1, updated_at = now() WHERE id = $2', [await bcrypt.hash(p.password, 12), row.contact_id]);
  res.json({ ok: true });
}));

export default r;

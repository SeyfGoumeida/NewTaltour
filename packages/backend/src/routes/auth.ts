import { Router } from 'express';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { z } from 'zod';
import { q, one } from '../db';
import { HttpError, parse, wrap } from '../lib/http';
import { endSession, optionalAuth, requireAuth, startSession } from '../lib/auth';
import { config } from '../config';

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

export const passwordSchema = z.string().min(8, '8 caractères minimum').max(72, '72 caractères maximum');
export const hashPassword = (p: string) => bcrypt.hash(p, 12);
export const sha256 = (s: string) => crypto.createHash('sha256').update(s).digest('hex');
const DUMMY_HASH = bcrypt.hashSync('timing-equalizer', 12);

const registerSchema = profileSchema.extend({
  email: z.email('Email invalide'),
  password: passwordSchema,
  website: z.string().optional(),
});

r.post('/register', wrap(async (req, res) => {
  const p = parse(registerSchema, req.body);
  if (p.website) return res.status(201).json({ user: null });
  const email = p.email.toLowerCase();
  if (await one('SELECT 1 FROM contacts WHERE email = $1', [email])) throw new HttpError(409, 'Un compte existe déjà avec cet email');
  const hash = await hashPassword(p.password);
  const user = await one(`INSERT INTO contacts (email, nom, prenom, tel, societe, adresse, code_postal, commune, pays, num_permis, date_permis, date_naissance, password_hash)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING ${PROFILE_COLUMNS}`,
    [email, p.nom, p.prenom, p.tel, p.societe, p.adresse, p.code_postal, p.commune, p.pays, p.num_permis, p.date_permis, p.date_naissance, hash]);
  startSession(res, user);
  res.status(201).json({ user });
}));

r.post('/login', wrap(async (req, res) => {
  const p = parse(z.object({ email: z.email('Email invalide'), password: z.string().min(1).max(200) }), req.body);
  const row = await one(`SELECT ${PROFILE_COLUMNS}, password_hash FROM contacts WHERE email = $1`, [p.email.toLowerCase()]);
  const ok = await bcrypt.compare(p.password, row?.password_hash || DUMMY_HASH);
  if (!row?.password_hash || !ok) throw new HttpError(401, 'Email ou mot de passe incorrect');
  const { password_hash: _ph, ...user } = row;
  startSession(res, user);
  res.json({ user });
}));

r.post('/logout', (_req, res) => {
  endSession(res);
  res.json({ ok: true });
});

r.get('/session', optionalAuth, wrap(async (req, res) => {
  const user = req.user ? await one(`SELECT ${PROFILE_COLUMNS} FROM contacts WHERE id = $1`, [req.user.id]) : null;
  res.json({ user: user ?? null });
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
  const p = parse(z.object({ ancien: z.string().min(1).max(200), nouveau: passwordSchema }), req.body);
  const row = await one('SELECT password_hash FROM contacts WHERE id = $1', [req.user!.id]);
  if (!row?.password_hash || !(await bcrypt.compare(p.ancien, row.password_hash))) throw new HttpError(400, 'Mot de passe actuel incorrect');
  await q(`UPDATE contacts SET password_hash = $1, password_changed_at = date_trunc('second', now()), updated_at = now() WHERE id = $2`, [await hashPassword(p.nouveau), req.user!.id]);
  await q('DELETE FROM password_resets WHERE contact_id = $1', [req.user!.id]);
  startSession(res, { id: req.user!.id });
  res.json({ ok: true });
}));

r.post('/forgot', wrap(async (req, res) => {
  const p = parse(z.object({ email: z.email('Email invalide') }), req.body);
  const row = await one('SELECT id FROM contacts WHERE email = $1 AND password_hash IS NOT NULL', [p.email.toLowerCase()]);
  let devLink: string | undefined;
  if (row) {
    const token = crypto.randomBytes(32).toString('hex');
    await q('DELETE FROM password_resets WHERE contact_id = $1 OR expires_at < now()', [row.id]);
    await q(`INSERT INTO password_resets (token_hash, contact_id, expires_at) VALUES ($1, $2, now() + interval '1 hour')`, [sha256(token), row.id]);
    if (config.devResetLink) {
      devLink = `${config.frontendUrl}/mon-compte/reinitialiser?token=${token}`;
      console.log(`[dev] lien de réinitialisation pour ${p.email}: ${devLink}`);
    }
  }
  res.json({ ok: true, ...(devLink ? { lien_dev: devLink } : {}) });
}));

r.post('/reset', wrap(async (req, res) => {
  const p = parse(z.object({ token: z.string().regex(/^[a-f0-9]{64}$/, 'Lien expiré ou invalide'), password: passwordSchema }), req.body);
  const row = await one('DELETE FROM password_resets WHERE token_hash = $1 AND expires_at > now() RETURNING contact_id', [sha256(p.token)]);
  if (!row) throw new HttpError(400, 'Lien expiré ou invalide');
  await q(`UPDATE contacts SET password_hash = $1, password_changed_at = date_trunc('second', now()), updated_at = now() WHERE id = $2`, [await hashPassword(p.password), row.contact_id]);
  await q('DELETE FROM password_resets WHERE contact_id = $1', [row.contact_id]);
  res.json({ ok: true });
}));

export default r;

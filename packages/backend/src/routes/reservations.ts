import { Router } from 'express';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { tx, one } from '../db';
import { HttpError, parse, siteOf, toDate, wrap } from '../lib/http';
import { optionalAuth, signToken } from '../lib/auth';
import { buildQuote, insertBooking, loadCtx } from '../services/booking';
import { PROFILE_COLUMNS, profileSchema } from './auth';

const r = Router();

const bookingSchema = profileSchema.extend({
  depart: z.coerce.number().int(),
  retour: z.coerce.number().int(),
  date_depart: z.string().min(10),
  date_retour: z.string().min(10),
  modele_id: z.coerce.number().int(),
  options: z.array(z.string()).default([]),
  code_promo: z.string().optional().nullable(),
  utiliser_avoir: z.boolean().optional(),
  mode_paiement: z.enum(['cb', 'paypal', 'cheque', 'virement', 'deux_fois']),
  email: z.email('Email invalide'),
  email_confirmation: z.string(),
  password: z.string().optional().nullable(),
  num_vol: z.string().trim().max(30).optional().nullable(),
  remarques: z.string().trim().max(2000).optional().nullable(),
  cgv: z.literal(true, { message: 'Vous devez accepter les conditions générales de vente' }),
  date_permis: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date permis obligatoire'),
  date_naissance: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date de naissance obligatoire'),
});

r.post('/', optionalAuth, wrap(async (req, res) => {
  const p = parse(bookingSchema, req.body);
  const email = p.email.toLowerCase();
  if (email !== p.email_confirmation.trim().toLowerCase()) throw new HttpError(400, 'Les deux adresses email ne correspondent pas');
  const site = siteOf(req);
  const ctx = await loadCtx();

  const result = await tx(async (c) => {
    let contactId = req.user?.id;
    let newUser: any;
    const profile = [p.nom, p.prenom, p.tel, p.societe, p.adresse, p.code_postal, p.commune, p.pays, p.num_permis, p.date_permis, p.date_naissance];
    if (contactId) {
      await c.query(`UPDATE contacts SET nom=$1, prenom=$2, tel=$3, societe=$4, adresse=$5, code_postal=$6, commune=$7, pays=$8, num_permis=$9,
        date_permis=$10, date_naissance=$11, updated_at=now() WHERE id=$12`, [...profile, contactId]);
    } else {
      if ((await c.query('SELECT 1 FROM contacts WHERE email = $1', [email])).rowCount)
        throw new HttpError(409, 'Déjà client ? Un compte existe avec cet email, connectez-vous pour finaliser votre réservation.');
      if (!p.password || p.password.length < 8) throw new HttpError(400, 'Choisissez un mot de passe (8 caractères minimum) pour accéder à votre compte client');
      const hash = await bcrypt.hash(p.password, 12);
      newUser = (await c.query(`INSERT INTO contacts (nom, prenom, tel, societe, adresse, code_postal, commune, pays, num_permis, date_permis, date_naissance, email, password_hash)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING ${PROFILE_COLUMNS}`, [...profile, email, hash])).rows[0];
      contactId = newUser.id;
    }
    await c.query('SELECT pg_advisory_xact_lock($1)', [p.modele_id]);
    const input = {
      site, departId: p.depart, retourId: p.retour, depart: toDate(p.date_depart), retour: toDate(p.date_retour), modeleId: p.modele_id,
      options: p.options, codePromo: p.code_promo, contactId, utiliserAvoir: p.utiliser_avoir,
      driver: { date_naissance: p.date_naissance, date_permis: p.date_permis },
    };
    const quote = await buildQuote(c, ctx, input);
    if (quote.conducteur?.erreurs.length) throw new HttpError(400, quote.conducteur.erreurs.join(' '));
    const booking = await insertBooking(c, quote, input, { contactId: contactId!, mode: p.mode_paiement, numVol: p.num_vol, remarques: p.remarques });
    return { ...booking, newUser };
  });

  res.status(201).json({
    reference: result.reference,
    ...(result.newUser ? { token: signToken(result.newUser), user: result.newUser } : {}),
  });
}));

r.get('/instructions', wrap(async (_req, res) => {
  const p = await one(`SELECT valeur FROM parametres WHERE cle = 'entreprise'`);
  res.json({ adresse_cheque: p.valeur.adresse_cheque, banque: p.valeur.banque });
}));

export default r;

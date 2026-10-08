import { Router } from 'express';
import { z } from 'zod';
import { pool, q, one } from '../db';
import { HttpError, page, parse, siteOf, toDate, wrap } from '../lib/http';
import { optionalAuth } from '../lib/auth';
import { loadCtx, loadModels, search, buildQuote } from '../services/booking';

const r = Router();

r.get('/site', wrap(async (req, res) => {
  const site = siteOf(req);
  const [s, villes, params] = await Promise.all([
    one('SELECT * FROM sites WHERE code = $1', [site]),
    q(`SELECT id, nom, aeroport, point_rdv, agent_nom, agent_tel FROM villes WHERE actif AND (site IS NULL OR site = $1) ORDER BY ordre, nom`, [site]),
    q(`SELECT cle, valeur FROM parametres WHERE cle IN ('entreprise','tarification','conducteur')`),
  ]);
  const p = Object.fromEntries(params.map((x: any) => [x.cle, x.valeur]));
  const stats = await one(`SELECT (SELECT count(*) FROM avis WHERE publie)::int AS avis, (SELECT round(avg(note)::numeric, 1) FROM avis WHERE publie) AS note,
    (SELECT count(*) FROM modeles WHERE actif AND site = $1)::int AS modeles`, [site]);
  const { banque, ...entreprise } = p.entreprise;
  res.json({ ...s, villes, entreprise, tarification: p.tarification, conducteur: p.conducteur, stats });
}));

r.get('/modeles', wrap(async (req, res) => {
  const site = siteOf(req);
  res.json(await loadModels(pool, site));
}));

r.get('/modeles/:slug', wrap(async (req, res) => {
  const m = await one('SELECT id, site FROM modeles WHERE slug = $1 AND actif', [req.params.slug]);
  if (!m) throw new HttpError(404, 'Modèle introuvable');
  const [model] = await loadModels(pool, m.site, [m.id]);
  const extra = await one(`SELECT fiche FROM modeles WHERE id = $1`, [m.id]);
  const villes = await q(`SELECT DISTINCT vi.nom FROM vehicules v JOIN villes vi ON vi.id = v.ville_id WHERE v.modele_id = $1 AND v.statut = 'disponible' ORDER BY vi.nom`, [m.id]);
  res.json({ ...model, fiche: extra.fiche, villes: villes.map((v: any) => v.nom) });
}));

const searchSchema = z.object({
  depart: z.coerce.number().int(),
  retour: z.coerce.number().int(),
  date_depart: z.string().min(10),
  date_retour: z.string().min(10),
});

r.get('/recherche', wrap(async (req, res) => {
  const p = parse(searchSchema, req.query);
  const ctx = await loadCtx();
  const results = await search(ctx, { site: siteOf(req), departId: p.depart, retourId: p.retour, depart: toDate(p.date_depart), retour: toDate(p.date_retour) });
  res.json(results);
}));

const quoteSchema = searchSchema.extend({
  modele_id: z.coerce.number().int(),
  options: z.array(z.string()).default([]),
  code_promo: z.string().optional().nullable(),
  utiliser_avoir: z.boolean().optional(),
  date_naissance: z.string().optional().nullable(),
  date_permis: z.string().optional().nullable(),
});

r.post('/devis', optionalAuth, wrap(async (req, res) => {
  const p = parse(quoteSchema, req.body);
  const ctx = await loadCtx();
  const quote = await buildQuote(pool, ctx, {
    site: siteOf(req), departId: p.depart, retourId: p.retour, depart: toDate(p.date_depart), retour: toDate(p.date_retour),
    modeleId: p.modele_id, options: p.options, codePromo: p.code_promo, contactId: req.user?.id, utiliserAvoir: p.utiliser_avoir,
    driver: p.date_naissance || p.date_permis ? { date_naissance: p.date_naissance, date_permis: p.date_permis } : undefined,
  });
  res.json(quote);
}));

r.get('/options', wrap(async (_req, res) => {
  res.json(await q('SELECT id, code, libelle, libelle_court, description, type_prix, prix, actif FROM options ORDER BY ordre'));
}));

r.get('/faq', wrap(async (_req, res) => res.json(await q('SELECT id, question, reponse FROM faq ORDER BY ordre, id'))));

r.get('/pages/:slug', wrap(async (req, res) => {
  const p = await one('SELECT slug, titre, contenu, updated_at FROM pages WHERE slug = $1', [req.params.slug]);
  if (!p) throw new HttpError(404, 'Page introuvable');
  res.json(p);
}));

r.get('/articles', wrap(async (req, res) => {
  const { size, offset, page: n } = page(req, 10);
  const rows = await q('SELECT id, slug, titre, contenu, auteur, date_publication FROM articles WHERE publie ORDER BY date_publication DESC, id DESC LIMIT $1 OFFSET $2', [size, offset]);
  const total = (await one('SELECT count(*)::int AS n FROM articles WHERE publie')).n;
  res.json({ items: rows, total, page: n, size });
}));

r.get('/articles/:slug', wrap(async (req, res) => {
  const a = await one('SELECT id, slug, titre, contenu, auteur, date_publication FROM articles WHERE slug = $1 AND publie', [req.params.slug]);
  if (!a) throw new HttpError(404, 'Article introuvable');
  const recents = await q('SELECT slug, titre, date_publication FROM articles WHERE publie AND slug <> $1 ORDER BY date_publication DESC LIMIT 5', [req.params.slug]);
  res.json({ ...a, recents });
}));

r.get('/avis', wrap(async (req, res) => {
  const { size, offset, page: n } = page(req, 30);
  const note = req.query.note ? parseInt(String(req.query.note), 10) : null;
  const avecCommentaire = req.query.commentaires === '1';
  const where = `publie AND ($1::int IS NULL OR note = $1) AND (NOT $2 OR observation_reservation IS NOT NULL OR observation_place IS NOT NULL)`;
  const rows = await q(`SELECT id, auteur, note, observation_reservation, observation_place, created_at FROM avis WHERE ${where} ORDER BY created_at DESC, id DESC LIMIT $3 OFFSET $4`,
    [note, avecCommentaire, size, offset]);
  const total = (await one(`SELECT count(*)::int AS n FROM avis WHERE ${where}`, [note, avecCommentaire])).n;
  const repartition = await q('SELECT note, count(*)::int AS n FROM avis WHERE publie GROUP BY note ORDER BY note DESC');
  const moyenne = (await one('SELECT round(avg(note)::numeric, 2) AS m, count(*)::int AS n FROM avis WHERE publie'));
  res.json({ items: rows, total, page: n, size, repartition, moyenne: Number(moyenne.m), nombre: moyenne.n });
}));

r.get('/occasions', wrap(async (_req, res) => {
  res.json(await q(`SELECT o.id, o.titre, o.description, o.annee, o.kilometrage, o.prix, COALESCE(o.image, m.image) AS image, m.nom_affiche AS modele, m.carburant, m.boite
    FROM occasions o LEFT JOIN modeles m ON m.id = o.modele_id WHERE o.publie ORDER BY o.created_at DESC`));
}));

const contactSchema = z.object({
  email: z.email('Email invalide'),
  nom: z.string().trim().min(1, 'obligatoire').max(100),
  prenom: z.string().trim().max(100).optional().nullable(),
  tel: z.string().trim().max(30).optional().nullable(),
  message: z.string().trim().min(1, 'obligatoire').max(5000),
});

r.post('/contact', wrap(async (req, res) => {
  const p = parse(contactSchema, req.body);
  await q('INSERT INTO messages_contact (email, nom, prenom, tel, message) VALUES ($1,$2,$3,$4,$5)', [p.email, p.nom, p.prenom ?? null, p.tel ?? null, p.message]);
  res.status(201).json({ ok: true });
}));

const transfertSchema = z.object({
  nom: z.string().trim().min(1, 'obligatoire').max(150),
  email: z.email('Email invalide'),
  tel: z.string().trim().max(30).optional().nullable(),
  aeroport_id: z.coerce.number().int(),
  destination: z.string().trim().min(1, 'obligatoire').max(255),
  date_arrivee: z.string().min(10),
  passagers: z.coerce.number().int().min(1).max(50),
  num_vol: z.string().trim().max(30).optional().nullable(),
  message: z.string().trim().max(3000).optional().nullable(),
});

r.post('/transfert', wrap(async (req, res) => {
  const p = parse(transfertSchema, req.body);
  await q(`INSERT INTO demandes_transfert (nom, email, tel, aeroport_id, destination, date_arrivee, passagers, num_vol, message) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [p.nom, p.email, p.tel ?? null, p.aeroport_id, p.destination, toDate(p.date_arrivee), p.passagers, p.num_vol ?? null, p.message ?? null]);
  res.status(201).json({ ok: true });
}));

export default r;

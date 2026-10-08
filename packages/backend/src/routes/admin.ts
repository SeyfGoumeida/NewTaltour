import { Request, Router } from 'express';
import { z, ZodObject } from 'zod';
import { pool, q, one, tx } from '../db';
import { HttpError, page, parse, round2, toDate, wrap } from '../lib/http';
import { requireAdmin } from '../lib/auth';
import { bookingDetail, cancelBooking } from '../services/booking';

const r = Router();
r.use(requireAdmin);

async function audit(req: Request, action: string, table: string, id: number | null, details?: unknown) {
  await q('INSERT INTO audit_log (admin_id, action, table_name, record_id, details) VALUES ($1,$2,$3,$4,$5)',
    [req.user!.id, action, table, id, details ? JSON.stringify(details) : null]);
}

const optStr = (max = 255) => z.string().trim().max(max).optional().nullable().transform((v) => v || null);
const optNum = z.union([z.null(), z.literal('').transform(() => null), z.coerce.number()]).optional().transform((v) => (v === undefined ? null : v));
const optDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable().or(z.literal('').transform(() => null));

function crud(path: string, table: string, schema: ZodObject<any>, opts: { order: string; search?: string[]; select?: string; from?: string }) {
  const cols = Object.keys(schema.shape);
  r.get(`/${path}`, wrap(async (req, res) => {
    const term = String(req.query.q || '').trim();
    const where = term && opts.search ? `WHERE ${opts.search.map((c) => `${c}::text ILIKE $1`).join(' OR ')}` : '';
    res.json(await q(`SELECT ${opts.select || '*'} FROM ${opts.from || table} ${where} ORDER BY ${opts.order}`, where ? [`%${term}%`] : []));
  }));
  r.post(`/${path}`, wrap(async (req, res) => {
    const p = parse(schema, req.body) as Record<string, unknown>;
    const row = await one(`INSERT INTO ${table} (${cols.join(',')}) VALUES (${cols.map((_, i) => `$${i + 1}`).join(',')}) RETURNING *`, cols.map((c) => p[c]));
    await audit(req, 'création', table, row.id ?? null, p);
    res.status(201).json(row);
  }));
  r.put(`/${path}/:id`, wrap(async (req, res) => {
    const p = parse(schema.partial(), req.body) as Record<string, unknown>;
    const keys = cols.filter((c) => p[c] !== undefined);
    if (!keys.length) throw new HttpError(400, 'Aucune modification');
    const row = await one(`UPDATE ${table} SET ${keys.map((c, i) => `${c} = $${i + 2}`).join(', ')} WHERE id = $1 RETURNING *`, [req.params.id, ...keys.map((c) => p[c])]);
    if (!row) throw new HttpError(404, 'Introuvable');
    await audit(req, 'modification', table, row.id, p);
    res.json(row);
  }));
  r.delete(`/${path}/:id`, wrap(async (req, res) => {
    try {
      const row = await one(`DELETE FROM ${table} WHERE id = $1 RETURNING id`, [req.params.id]);
      if (!row) throw new HttpError(404, 'Introuvable');
    } catch (e: any) {
      if (e.code === '23503') throw new HttpError(409, 'Impossible de supprimer : cet élément est utilisé ailleurs (désactivez-le plutôt)');
      throw e;
    }
    await audit(req, 'suppression', table, Number(req.params.id));
    res.json({ ok: true });
  }));
}

crud('villes', 'villes', z.object({
  nom: z.string().trim().min(1), site: z.enum(['dz', 'ma']).nullable().optional().transform((v) => v ?? null),
  latitude: z.coerce.number(), longitude: z.coerce.number(), aeroport: z.boolean(), point_rdv: optStr(500),
  agent_nom: optStr(100), agent_tel: optStr(30), actif: z.boolean(), ordre: z.coerce.number().int(),
}), { order: 'ordre, nom', search: ['nom'] });

crud('options', 'options', z.object({
  code: z.string().trim().min(1).max(50), libelle: z.string().trim().min(1), libelle_court: optStr(100), description: optStr(5000),
  type_prix: z.enum(['fixe', 'par_jour', 'pourcentage']), prix: z.coerce.number().min(0), actif: z.boolean(), ordre: z.coerce.number().int(),
}), { order: 'ordre, id' });

crud('saisons', 'saisons', z.object({
  nom: z.string().trim().min(1), date_debut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), date_fin: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  coefficient: z.coerce.number().min(0.1).max(5),
}), { order: 'date_debut DESC' });

crud('coupons', 'coupons', z.object({
  code: z.string().trim().min(1).max(50).transform((s) => s.toUpperCase()), type: z.enum(['pourcentage', 'montant']), valeur: z.coerce.number().min(0),
  date_debut: optDate, date_fin: optDate, montant_min: optNum, utilisations_max: optNum, actif: z.boolean(),
}), { order: 'created_at DESC', search: ['code'] });

crud('articles', 'articles', z.object({
  slug: z.string().trim().min(1).max(200), titre: z.string().trim().min(1), contenu: z.string().min(1), auteur: optStr(100),
  publie: z.boolean(), date_publication: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
}), { order: 'date_publication DESC, id DESC', search: ['titre', 'contenu'] });

crud('faq', 'faq', z.object({ question: z.string().trim().min(1), reponse: z.string().trim().min(1), ordre: z.coerce.number().int() }), { order: 'ordre, id' });

crud('occasions', 'occasions', z.object({
  titre: z.string().trim().min(1), description: optStr(5000), modele_id: optNum, annee: optNum, kilometrage: optNum,
  prix: z.coerce.number().min(0), image: optStr(255), publie: z.boolean(),
}), { order: 'created_at DESC', search: ['titre'] });

crud('vehicules', 'vehicules', z.object({
  modele_id: z.coerce.number().int(), immatriculation: z.string().trim().min(1).max(20), annee: z.coerce.number().int().min(1990).max(2100),
  couleur: optStr(40), ville_id: z.coerce.number().int(), kilometrage: z.coerce.number().int().min(0),
  statut: z.enum(['disponible', 'maintenance', 'hors_service']), notes: optStr(2000),
}), {
  order: 'v.id', search: ['v.immatriculation', 'm.nom_affiche', 'vi.nom'],
  select: `v.*, m.nom_affiche AS modele_nom, m.image AS modele_image, m.site, vi.nom AS ville_nom,
    (SELECT c.reference FROM commandes c WHERE c.vehicule_id = v.id AND c.statut IN ('confirmee','en_cours') AND now() BETWEEN c.date_depart AND c.date_retour LIMIT 1) AS loue_ref`,
  from: 'vehicules v JOIN modeles m ON m.id = v.modele_id JOIN villes vi ON vi.id = v.ville_id',
});

// ---- Dashboard ----
r.get('/dashboard', wrap(async (_req, res) => {
  const kpi = await one(`SELECT
    (SELECT COALESCE(sum(montant_total),0) FROM commandes WHERE statut <> 'annulee' AND date_trunc('month', created_at) = date_trunc('month', now())) AS ca_mois,
    (SELECT COALESCE(sum(montant_total),0) FROM commandes WHERE statut <> 'annulee' AND date_trunc('month', created_at) = date_trunc('month', now() - interval '1 month')) AS ca_mois_precedent,
    (SELECT count(*) FROM commandes WHERE date_trunc('month', created_at) = date_trunc('month', now()))::int AS reservations_mois,
    (SELECT count(*) FROM commandes WHERE statut = 'en_attente')::int AS en_attente,
    (SELECT count(*) FROM commandes WHERE statut = 'en_cours')::int AS en_cours,
    (SELECT count(*) FROM commandes WHERE statut IN ('confirmee','en_attente') AND date_depart::date = (now() + interval '1 day')::date)::int AS departs_demain,
    (SELECT count(*) FROM commandes WHERE statut IN ('confirmee','en_attente') AND date_depart::date = now()::date)::int AS departs_aujourdhui,
    (SELECT count(*) FROM commandes WHERE statut = 'en_cours' AND date_retour::date = now()::date)::int AS retours_aujourdhui,
    (SELECT count(*) FROM vehicules)::int AS vehicules,
    (SELECT count(*) FROM vehicules WHERE statut <> 'disponible')::int AS vehicules_indisponibles,
    (SELECT count(DISTINCT vehicule_id) FROM commandes WHERE statut IN ('confirmee','en_cours') AND now() BETWEEN date_depart AND date_retour)::int AS vehicules_loues,
    (SELECT count(*) FROM contacts WHERE role = 0)::int AS clients,
    (SELECT count(*) FROM messages_contact WHERE NOT lu)::int AS messages_non_lus,
    (SELECT count(*) FROM demandes_transfert WHERE statut = 'nouvelle')::int AS transferts_nouveaux,
    (SELECT COALESCE(sum(montant_total - montant_paye),0) FROM commandes WHERE statut IN ('en_attente','confirmee','en_cours')) AS reste_a_encaisser,
    (SELECT round(avg(note)::numeric,2) FROM avis WHERE created_at > now() - interval '90 days') AS note_90j`);
  const ca = await q(`SELECT to_char(date_trunc('month', created_at), 'YYYY-MM') AS mois, round(sum(montant_total)::numeric, 2) AS ca, count(*)::int AS n
    FROM commandes WHERE statut <> 'annulee' AND created_at > date_trunc('month', now()) - interval '11 months' GROUP BY 1 ORDER BY 1`);
  const villes = await q(`SELECT v.nom, count(*)::int AS n, round(sum(c.montant_total)::numeric, 2) AS ca FROM commandes c JOIN villes v ON v.id = c.ville_depart_id
    WHERE c.statut <> 'annulee' AND c.created_at > now() - interval '12 months' GROUP BY v.nom ORDER BY n DESC`);
  const modeles = await q(`SELECT m.nom_affiche AS nom, m.image, count(*)::int AS n, round(sum(c.montant_total)::numeric, 2) AS ca FROM commandes c JOIN modeles m ON m.id = c.modele_id
    WHERE c.statut <> 'annulee' AND c.created_at > now() - interval '12 months' GROUP BY m.id ORDER BY n DESC LIMIT 8`);
  const options = await q(`SELECT co.libelle, count(*)::int AS n, round(sum(co.montant)::numeric, 2) AS ca FROM commande_options co JOIN commandes c ON c.id = co.commande_id
    WHERE c.statut <> 'annulee' GROUP BY co.libelle ORDER BY n DESC`);
  const paiements = await q(`SELECT mode_paiement, count(*)::int AS n FROM commandes WHERE statut <> 'annulee' GROUP BY 1 ORDER BY n DESC`);
  const prochains = await q(`SELECT c.reference, c.date_depart, c.statut, c.statut_paiement, ct.prenom, ct.nom, m.nom_affiche AS modele_nom, v.nom AS ville_depart, ve.immatriculation
    FROM commandes c JOIN contacts ct ON ct.id = c.contact_id JOIN modeles m ON m.id = c.modele_id JOIN villes v ON v.id = c.ville_depart_id LEFT JOIN vehicules ve ON ve.id = c.vehicule_id
    WHERE c.statut IN ('confirmee','en_attente') AND c.date_depart >= now() ORDER BY c.date_depart LIMIT 8`);
  const retours = await q(`SELECT c.reference, c.date_retour, ct.prenom, ct.nom, m.nom_affiche AS modele_nom, v.nom AS ville_retour, ve.immatriculation
    FROM commandes c JOIN contacts ct ON ct.id = c.contact_id JOIN modeles m ON m.id = c.modele_id JOIN villes v ON v.id = c.ville_retour_id LEFT JOIN vehicules ve ON ve.id = c.vehicule_id
    WHERE c.statut = 'en_cours' ORDER BY c.date_retour LIMIT 8`);
  const recentes = await q(`SELECT c.reference, c.created_at, c.montant_total, c.statut, c.statut_paiement, ct.prenom, ct.nom, m.nom_affiche AS modele_nom
    FROM commandes c JOIN contacts ct ON ct.id = c.contact_id JOIN modeles m ON m.id = c.modele_id ORDER BY c.created_at DESC LIMIT 8`);
  res.json({ kpi, ca, villes, modeles, options, paiements, prochains, retours, recentes });
}));

// ---- Réservations ----
r.get('/commandes', wrap(async (req, res) => {
  const { size, offset, page: n } = page(req, 25);
  const conds: string[] = [];
  const params: unknown[] = [];
  const add = (sql: string, v: unknown) => { params.push(v); conds.push(sql.replace('?', `$${params.length}`)); };
  if (req.query.statut) add('c.statut = ?', req.query.statut);
  if (req.query.statut_paiement) add('c.statut_paiement = ?', req.query.statut_paiement);
  if (req.query.ville) add('c.ville_depart_id = ?', Number(req.query.ville));
  if (req.query.site) add('c.site = ?', req.query.site);
  if (req.query.du) add('c.date_depart >= ?', toDate(String(req.query.du)));
  if (req.query.au) add('c.date_depart <= ?', toDate(String(req.query.au)));
  if (req.query.contact) add('c.contact_id = ?', Number(req.query.contact));
  if (req.query.q) add(`(c.reference ILIKE ? OR ct.nom ILIKE $${params.length + 1} OR ct.prenom ILIKE $${params.length + 1} OR ct.email ILIKE $${params.length + 1} OR m.nom_affiche ILIKE $${params.length + 1})`, `%${req.query.q}%`);
  const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';
  const sort = ({ depart: 'c.date_depart DESC', depart_asc: 'c.date_depart ASC', montant: 'c.montant_total DESC' } as Record<string, string>)[String(req.query.tri)] || 'c.created_at DESC';
  const base = `FROM commandes c JOIN contacts ct ON ct.id = c.contact_id JOIN modeles m ON m.id = c.modele_id
    JOIN villes vd ON vd.id = c.ville_depart_id JOIN villes vr ON vr.id = c.ville_retour_id LEFT JOIN vehicules ve ON ve.id = c.vehicule_id ${where}`;
  const items = await q(`SELECT c.id, c.reference, c.site, c.date_depart, c.date_retour, c.jours, c.montant_total, c.montant_paye, c.statut, c.statut_paiement, c.mode_paiement, c.created_at,
      ct.id AS contact_id, ct.prenom, ct.nom, ct.email, m.nom_affiche AS modele_nom, m.image AS modele_image, vd.nom AS ville_depart, vr.nom AS ville_retour, ve.immatriculation
    ${base} ORDER BY ${sort} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`, [...params, size, offset]);
  const agg = await one(`SELECT count(*)::int AS total, COALESCE(sum(c.montant_total),0) AS montant ${base}`, params);
  res.json({ items, total: agg.total, montant: agg.montant, page: n, size });
}));

r.get('/commandes/:ref', wrap(async (req, res) => {
  const b = await bookingDetail(pool, 'c.reference = $1', [req.params.ref]);
  if (!b) throw new HttpError(404, 'Réservation introuvable');
  const vehicules = await q(`SELECT v.id, v.immatriculation, v.annee, vi.nom AS ville FROM vehicules v JOIN villes vi ON vi.id = v.ville_id
    WHERE v.modele_id = $1 AND v.statut = 'disponible' AND (v.id = $4 OR NOT EXISTS (SELECT 1 FROM commandes c WHERE c.vehicule_id = v.id AND c.statut <> 'annulee'
      AND c.date_depart < $3 AND c.date_retour > $2)) ORDER BY vi.nom, v.annee DESC`, [b.modele_id, b.date_depart, b.date_retour, b.vehicule_id]);
  const historique = await q(`SELECT a.action, a.details, a.created_at, ct.prenom, ct.nom FROM audit_log a LEFT JOIN contacts ct ON ct.id = a.admin_id
    WHERE a.table_name = 'commandes' AND a.record_id = $1 ORDER BY a.created_at DESC`, [b.id]);
  res.json({ ...b, vehicules_disponibles: vehicules, historique });
}));

r.put('/commandes/:ref', wrap(async (req, res) => {
  const p = parse(z.object({
    statut: z.enum(['en_attente', 'confirmee', 'en_cours', 'terminee']).optional(),
    vehicule_id: z.coerce.number().int().nullable().optional(),
    remarques: z.string().max(2000).nullable().optional(),
    num_vol: z.string().max(30).nullable().optional(),
  }), req.body);
  const b = await one('SELECT id, statut FROM commandes WHERE reference = $1', [req.params.ref]);
  if (!b) throw new HttpError(404, 'Réservation introuvable');
  if (b.statut === 'annulee') throw new HttpError(400, 'Réservation annulée');
  const keys = Object.keys(p).filter((k) => (p as any)[k] !== undefined);
  if (keys.length) {
    await q(`UPDATE commandes SET ${keys.map((k, i) => `${k} = $${i + 2}`).join(', ')}, updated_at = now() WHERE id = $1`, [b.id, ...keys.map((k) => (p as any)[k])]);
    await audit(req, 'modification', 'commandes', b.id, p);
  }
  res.json(await bookingDetail(pool, 'c.id = $1', [b.id]));
}));

r.post('/commandes/:ref/paiement', wrap(async (req, res) => {
  const p = parse(z.object({ montant: z.coerce.number().positive(), methode: z.enum(['cb', 'paypal', 'cheque', 'virement', 'especes']), reference: optStr(100) }), req.body);
  const b = await one('SELECT id, montant_total, montant_paye, statut FROM commandes WHERE reference = $1', [req.params.ref]);
  if (!b) throw new HttpError(404, 'Réservation introuvable');
  await tx(async (c) => {
    await c.query(`INSERT INTO paiements (commande_id, montant, methode, statut, reference) VALUES ($1,$2,$3,'valide',$4)`, [b.id, p.montant, p.methode, p.reference]);
    const paye = round2(Number(b.montant_paye) + p.montant);
    await c.query(`UPDATE commandes SET montant_paye = $2, statut_paiement = CASE WHEN $2 >= montant_total THEN 'paye' ELSE 'acompte' END,
      statut = CASE WHEN statut = 'en_attente' THEN 'confirmee' ELSE statut END, updated_at = now() WHERE id = $1`, [b.id, paye]);
  });
  await audit(req, 'paiement', 'commandes', b.id, p);
  res.json(await bookingDetail(pool, 'c.id = $1', [b.id]));
}));

r.post('/commandes/:ref/annuler', wrap(async (req, res) => {
  const p = parse(z.object({ mode: z.enum(['remboursement', 'avoir']) }), req.body);
  const b = await one('SELECT id FROM commandes WHERE reference = $1', [req.params.ref]);
  if (!b) throw new HttpError(404, 'Réservation introuvable');
  const result = await tx((c) => cancelBooking(c, b.id, p.mode));
  await audit(req, 'annulation', 'commandes', b.id, result);
  res.json(await bookingDetail(pool, 'c.id = $1', [b.id]));
}));

// ---- Planning ----
r.get('/planning', wrap(async (req, res) => {
  const du = req.query.du ? toDate(String(req.query.du)) : new Date(new Date().toISOString().slice(0, 10) + 'T00:00:00Z');
  const au = req.query.au ? toDate(String(req.query.au)) : new Date(du.getTime() + 21 * 86_400_000);
  const ville = req.query.ville ? Number(req.query.ville) : null;
  const vehicules = await q(`SELECT v.id, v.immatriculation, v.annee, v.statut, m.nom_affiche AS modele_nom, vi.nom AS ville FROM vehicules v
    JOIN modeles m ON m.id = v.modele_id JOIN villes vi ON vi.id = v.ville_id WHERE ($1::int IS NULL OR v.ville_id = $1) ORDER BY vi.ordre, m.ordre, v.immatriculation`, [ville]);
  const commandes = await q(`SELECT c.reference, c.vehicule_id, c.date_depart, c.date_retour, c.statut, ct.prenom, ct.nom FROM commandes c JOIN contacts ct ON ct.id = c.contact_id
    WHERE c.statut <> 'annulee' AND c.vehicule_id IS NOT NULL AND c.date_depart < $2 AND c.date_retour > $1`, [du, au]);
  res.json({ du, au, vehicules, commandes });
}));

// ---- Modèles & tarifs ----
r.get('/modeles', wrap(async (_req, res) => {
  res.json(await q(`SELECT m.*, COALESCE(json_agg(json_build_object('jours', t.jours, 'prix', t.prix) ORDER BY t.jours) FILTER (WHERE t.jours IS NOT NULL), '[]') AS tarifs,
      (SELECT count(*) FROM vehicules v WHERE v.modele_id = m.id)::int AS nb_vehicules
    FROM modeles m LEFT JOIN modele_tarifs t ON t.modele_id = m.id GROUP BY m.id ORDER BY m.site, m.ordre, m.id`));
}));

const modeleSchema = z.object({
  site: z.enum(['dz', 'ma']), slug: z.string().trim().min(1).max(150), nom: z.string().trim().min(1), nom_affiche: z.string().trim().min(1), marque: z.string().trim().min(1),
  categorie: z.enum(['A', 'B', 'C', 'D']).nullable().optional().transform((v) => v ?? null), categorie_libelle: optStr(100),
  places: optNum, portes: optNum, coffre_l: optNum, reservoir_l: optNum, carburant: z.enum(['essence', 'diesel']), boite: z.enum(['manuelle', 'automatique']),
  type_boite: optStr(30), puissance_ch: optNum, airbags: optNum, vitesse_max: optNum, consommation: optStr(50), caution: z.coerce.number().min(0),
  equipements: z.array(z.string()).default([]), image: optStr(255), a_vendre: z.boolean().default(false), actif: z.boolean(), ordre: z.coerce.number().int(),
  tarifs: z.array(z.object({ jours: z.coerce.number().int().positive(), prix: z.coerce.number().min(0) })),
});

async function saveModele(req: Request, id: number | null) {
  const { tarifs, ...p } = parse(modeleSchema, req.body);
  const cols = Object.keys(p);
  return tx(async (c) => {
    const row = id
      ? (await c.query(`UPDATE modeles SET ${cols.map((k, i) => `${k} = $${i + 2}`).join(', ')} WHERE id = $1 RETURNING *`, [id, ...cols.map((k) => (p as any)[k])])).rows[0]
      : (await c.query(`INSERT INTO modeles (${cols.join(',')}) VALUES (${cols.map((_, i) => `$${i + 1}`).join(',')}) RETURNING *`, cols.map((k) => (p as any)[k]))).rows[0];
    if (!row) throw new HttpError(404, 'Modèle introuvable');
    await c.query('DELETE FROM modele_tarifs WHERE modele_id = $1', [row.id]);
    for (const t of tarifs) await c.query('INSERT INTO modele_tarifs (modele_id, jours, prix) VALUES ($1,$2,$3)', [row.id, t.jours, t.prix]);
    await c.query('INSERT INTO audit_log (admin_id, action, table_name, record_id, details) VALUES ($1,$2,$3,$4,$5)',
      [req.user!.id, id ? 'modification' : 'création', 'modeles', row.id, JSON.stringify({ ...p, tarifs })]);
    return row;
  });
}

r.post('/modeles', wrap(async (req, res) => res.status(201).json(await saveModele(req, null))));
r.put('/modeles/:id', wrap(async (req, res) => res.json(await saveModele(req, Number(req.params.id)))));
r.delete('/modeles/:id', wrap(async (req, res) => {
  const used = await one('SELECT 1 FROM commandes WHERE modele_id = $1 UNION SELECT 1 FROM vehicules WHERE modele_id = $1 LIMIT 1', [req.params.id]);
  if (used) throw new HttpError(409, 'Ce modèle a des véhicules ou des réservations : désactivez-le plutôt');
  await q('DELETE FROM modeles WHERE id = $1', [req.params.id]);
  await audit(req, 'suppression', 'modeles', Number(req.params.id));
  res.json({ ok: true });
}));

// ---- Clients ----
r.get('/contacts', wrap(async (req, res) => {
  const { size, offset, page: n } = page(req, 25);
  const term = String(req.query.q || '').trim();
  const where = term ? `WHERE (ct.nom ILIKE $1 OR ct.prenom ILIKE $1 OR ct.email ILIKE $1 OR ct.tel ILIKE $1 OR ct.commune ILIKE $1)` : '';
  const params = term ? [`%${term}%`] : [];
  const items = await q(`SELECT ct.id, ct.email, ct.nom, ct.prenom, ct.tel, ct.commune, ct.pays, ct.role, ct.created_at,
      (SELECT count(*) FROM commandes c WHERE c.contact_id = ct.id)::int AS reservations,
      (SELECT COALESCE(sum(montant_total),0) FROM commandes c WHERE c.contact_id = ct.id AND c.statut <> 'annulee') AS total_depense,
      (SELECT max(date_depart) FROM commandes c WHERE c.contact_id = ct.id) AS derniere_location,
      (SELECT COALESCE(sum(solde),0) FROM avoirs a WHERE a.contact_id = ct.id) AS avoir
    FROM contacts ct ${where} ORDER BY ct.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`, [...params, size, offset]);
  const total = (await one(`SELECT count(*)::int AS n FROM contacts ct ${where}`, params)).n;
  res.json({ items, total, page: n, size });
}));

r.get('/contacts/:id', wrap(async (req, res) => {
  const c = await one(`SELECT id, email, nom, prenom, tel, societe, adresse, code_postal, commune, pays, num_permis, date_permis, date_naissance, role, created_at FROM contacts WHERE id = $1`, [req.params.id]);
  if (!c) throw new HttpError(404, 'Client introuvable');
  const commandes = await q(`SELECT c.reference, c.date_depart, c.date_retour, c.montant_total, c.statut, c.statut_paiement, m.nom_affiche AS modele_nom
    FROM commandes c JOIN modeles m ON m.id = c.modele_id WHERE c.contact_id = $1 ORDER BY c.date_depart DESC`, [req.params.id]);
  const avoirs = await q('SELECT id, montant, solde, motif, created_at FROM avoirs WHERE contact_id = $1 ORDER BY created_at DESC', [req.params.id]);
  const avis = await q('SELECT id, note, observation_reservation, observation_place, created_at FROM avis WHERE contact_id = $1 ORDER BY created_at DESC', [req.params.id]);
  res.json({ ...c, commandes, avoirs, avis });
}));

r.put('/contacts/:id', wrap(async (req, res) => {
  const p = parse(z.object({
    nom: z.string().trim().min(1), prenom: z.string().trim().min(1), tel: optStr(30), societe: optStr(150), adresse: optStr(255), code_postal: optStr(10),
    commune: optStr(100), pays: optStr(100), num_permis: optStr(50), date_permis: optDate, date_naissance: optDate, role: z.union([z.literal(0), z.literal(10)]),
  }), req.body);
  if (Number(req.params.id) === req.user!.id && p.role !== 10) throw new HttpError(400, 'Vous ne pouvez pas retirer vos propres droits administrateur');
  const keys = Object.keys(p);
  const row = await one(`UPDATE contacts SET ${keys.map((k, i) => `${k} = $${i + 2}`).join(', ')}, updated_at = now() WHERE id = $1 RETURNING id`, [req.params.id, ...keys.map((k) => (p as any)[k])]);
  if (!row) throw new HttpError(404, 'Client introuvable');
  await audit(req, 'modification', 'contacts', row.id, p);
  res.json({ ok: true });
}));

r.post('/contacts/:id/avoirs', wrap(async (req, res) => {
  const p = parse(z.object({ montant: z.coerce.number().positive(), motif: z.string().trim().min(1).max(500) }), req.body);
  const row = await one('INSERT INTO avoirs (contact_id, montant, solde, motif) VALUES ($1,$2,$2,$3) RETURNING id', [req.params.id, p.montant, p.motif]);
  await audit(req, 'avoir', 'contacts', Number(req.params.id), p);
  res.status(201).json(row);
}));

// ---- Avis ----
r.get('/avis', wrap(async (req, res) => {
  const { size, offset, page: n } = page(req, 30);
  const note = req.query.note ? Number(req.query.note) : null;
  const statut = req.query.publie === '0' ? false : req.query.publie === '1' ? true : null;
  const items = await q(`SELECT a.*, c.reference FROM avis a LEFT JOIN commandes c ON c.id = a.commande_id
    WHERE ($1::int IS NULL OR a.note = $1) AND ($2::bool IS NULL OR a.publie = $2) ORDER BY a.created_at DESC, a.id DESC LIMIT $3 OFFSET $4`, [note, statut, size, offset]);
  const total = (await one('SELECT count(*)::int AS n FROM avis a WHERE ($1::int IS NULL OR a.note = $1) AND ($2::bool IS NULL OR a.publie = $2)', [note, statut])).n;
  res.json({ items, total, page: n, size });
}));
r.put('/avis/:id', wrap(async (req, res) => {
  const p = parse(z.object({ publie: z.boolean() }), req.body);
  await q('UPDATE avis SET publie = $1 WHERE id = $2', [p.publie, req.params.id]);
  await audit(req, p.publie ? 'publication' : 'masquage', 'avis', Number(req.params.id));
  res.json({ ok: true });
}));
r.delete('/avis/:id', wrap(async (req, res) => {
  await q('DELETE FROM avis WHERE id = $1', [req.params.id]);
  await audit(req, 'suppression', 'avis', Number(req.params.id));
  res.json({ ok: true });
}));

// ---- Messages & transferts ----
r.get('/messages', wrap(async (_req, res) => res.json(await q('SELECT * FROM messages_contact ORDER BY created_at DESC'))));
r.put('/messages/:id', wrap(async (req, res) => {
  const p = parse(z.object({ lu: z.boolean() }), req.body);
  await q('UPDATE messages_contact SET lu = $1 WHERE id = $2', [p.lu, req.params.id]);
  res.json({ ok: true });
}));
r.delete('/messages/:id', wrap(async (req, res) => {
  await q('DELETE FROM messages_contact WHERE id = $1', [req.params.id]);
  await audit(req, 'suppression', 'messages_contact', Number(req.params.id));
  res.json({ ok: true });
}));
r.get('/transferts', wrap(async (_req, res) => res.json(await q(`SELECT d.*, v.nom AS aeroport FROM demandes_transfert d LEFT JOIN villes v ON v.id = d.aeroport_id ORDER BY d.created_at DESC`))));
r.put('/transferts/:id', wrap(async (req, res) => {
  const p = parse(z.object({ statut: z.enum(['nouvelle', 'devis_envoye', 'confirmee', 'annulee']) }), req.body);
  await q('UPDATE demandes_transfert SET statut = $1 WHERE id = $2', [p.statut, req.params.id]);
  await audit(req, 'modification', 'demandes_transfert', Number(req.params.id), p);
  res.json({ ok: true });
}));

// ---- Pages & paramètres ----
r.get('/pages', wrap(async (_req, res) => res.json(await q('SELECT * FROM pages ORDER BY slug'))));
r.put('/pages/:slug', wrap(async (req, res) => {
  const p = parse(z.object({ titre: z.string().trim().min(1), contenu: z.string().min(1) }), req.body);
  const row = await one('UPDATE pages SET titre = $1, contenu = $2, updated_at = now() WHERE slug = $3 RETURNING *', [p.titre, p.contenu, req.params.slug]);
  if (!row) throw new HttpError(404, 'Page introuvable');
  await audit(req, 'modification', 'pages', null, { slug: req.params.slug });
  res.json(row);
}));

r.get('/parametres', wrap(async (_req, res) => {
  const rows = await q('SELECT cle, valeur FROM parametres');
  const sites = await q('SELECT * FROM sites ORDER BY code');
  res.json({ ...Object.fromEntries(rows.map((x: any) => [x.cle, x.valeur])), sites });
}));
r.put('/parametres/:cle', wrap(async (req, res) => {
  if (!['entreprise', 'tarification', 'conducteur'].includes(req.params.cle)) throw new HttpError(404, 'Paramètre inconnu');
  const valeur = parse(z.record(z.string(), z.any()), req.body);
  await q('UPDATE parametres SET valeur = $1 WHERE cle = $2', [JSON.stringify(valeur), req.params.cle]);
  await audit(req, 'modification', 'parametres', null, { cle: req.params.cle });
  res.json(valeur);
}));
r.put('/sites/:code', wrap(async (req, res) => {
  const p = parse(z.object({ nom: z.string().trim().min(1), titre: z.string().trim().min(1), slogan: optStr(200), telephones: z.array(z.string()), hotline: optStr(50) }), req.body);
  await q('UPDATE sites SET nom=$1, titre=$2, slogan=$3, telephones=$4, hotline=$5 WHERE code=$6', [p.nom, p.titre, p.slogan, p.telephones, p.hotline, req.params.code]);
  await audit(req, 'modification', 'sites', null, { code: req.params.code });
  res.json({ ok: true });
}));

r.get('/audit', wrap(async (req, res) => {
  const { size, offset, page: n } = page(req, 50);
  const items = await q(`SELECT a.*, ct.prenom, ct.nom FROM audit_log a LEFT JOIN contacts ct ON ct.id = a.admin_id ORDER BY a.created_at DESC LIMIT $1 OFFSET $2`, [size, offset]);
  const total = (await one('SELECT count(*)::int AS n FROM audit_log')).n;
  res.json({ items, total, page: n, size });
}));

export default r;

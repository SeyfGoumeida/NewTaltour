import { PoolClient } from 'pg';
import { pool, q, one } from '../db';
import { HttpError, round2 } from '../lib/http';
import { loadSaisons, loadSettings, Saison, Settings } from '../lib/settings';
import {
  cancellationTerms,
  checkDriver,
  ModelP,
  OptionP,
  optionAmount,
  quoteRental,
  RentalQuote,
  VehicleP,
  VilleP,
} from './pricing';

type Db = Pick<PoolClient, 'query'>;

export interface Ctx {
  settings: Settings;
  saisons: Saison[];
  villes: Map<number, VilleP & { site: string | null; aeroport: boolean }>;
}

export async function loadCtx(): Promise<Ctx> {
  const [settings, saisons, villes] = await Promise.all([
    loadSettings(),
    loadSaisons(),
    q('SELECT id, nom, site, latitude, longitude, aeroport FROM villes WHERE actif'),
  ]);
  return { settings, saisons, villes: new Map(villes.map((v: any) => [v.id, v])) };
}

export const MODEL_COLUMNS = `m.id, m.site, m.slug, m.nom, m.nom_affiche, m.marque, m.categorie, m.categorie_libelle, m.places, m.portes,
  m.coffre_l, m.reservoir_l, m.carburant, m.boite, m.type_boite, m.puissance_ch, m.airbags, m.vitesse_max, m.consommation,
  m.caution, m.equipements, m.image, m.ordre`;

export async function loadModels(db: Db, site: string, ids?: number[]) {
  const params: unknown[] = [site];
  let where = 'm.site = $1 AND m.actif';
  if (ids) {
    params.push(ids);
    where += ' AND m.id = ANY($2)';
  }
  const res = await db.query(
    `SELECT ${MODEL_COLUMNS},
       COALESCE(json_agg(json_build_object('jours', t.jours, 'prix', t.prix) ORDER BY t.jours) FILTER (WHERE t.jours IS NOT NULL), '[]') AS tarifs
     FROM modeles m LEFT JOIN modele_tarifs t ON t.modele_id = m.id
     WHERE ${where} GROUP BY m.id ORDER BY m.ordre, m.id`,
    params,
  );
  return res.rows.map((r: any) => ({ ...r, tarifs: r.tarifs.map((t: any) => ({ jours: t.jours, prix: Number(t.prix) })) }));
}

export async function freeVehicles(db: Db, modelIds: number[], depart: Date, retour: Date, excludeCommandeId?: number) {
  const res = await db.query(
    `SELECT v.id, v.modele_id, v.annee, v.ville_id FROM vehicules v
     WHERE v.modele_id = ANY($1) AND v.statut = 'disponible'
       AND NOT EXISTS (
         SELECT 1 FROM commandes c WHERE c.vehicule_id = v.id AND c.statut <> 'annulee'
           AND c.date_depart < $3 AND c.date_retour > $2 AND ($4::int IS NULL OR c.id <> $4)
       )`,
    [modelIds, depart, retour, excludeCommandeId ?? null],
  );
  return res.rows as (VehicleP & { modele_id: number })[];
}

export interface SearchParams {
  site: string;
  departId: number;
  retourId: number;
  depart: Date;
  retour: Date;
}

export function validateSearch(ctx: Ctx, p: SearchParams) {
  if (!ctx.villes.has(p.departId) || !ctx.villes.has(p.retourId)) throw new HttpError(400, 'Ville inconnue');
  if (isNaN(p.depart.getTime()) || isNaN(p.retour.getTime())) throw new HttpError(400, 'Dates invalides');
  if (p.retour <= p.depart) throw new HttpError(400, 'La date de retour doit être postérieure à la date de départ');
}

export function bestQuote(ctx: Ctx, model: ModelP, vehicles: VehicleP[], p: SearchParams) {
  let best: RentalQuote | undefined;
  for (const v of vehicles) {
    const qt = quoteRental({ model, vehicle: v, villes: ctx.villes, departId: p.departId, retourId: p.retourId, depart: p.depart, retour: p.retour, settings: ctx.settings, saisons: ctx.saisons });
    if (qt && (!best || qt.total < best.total)) best = qt;
  }
  return best;
}

export async function search(ctx: Ctx, p: SearchParams) {
  validateSearch(ctx, p);
  const models = await loadModels(pool, p.site);
  const vehicles = await freeVehicles(pool, models.map((m) => m.id), p.depart, p.retour);
  const results = [];
  for (const m of models) {
    const vs = vehicles.filter((v) => v.modele_id === m.id);
    const quote = bestQuote(ctx, m, vs, p);
    if (!quote) continue;
    const villesLocales = [...new Set(vs.map((v) => v.ville_id))].map((id) => ctx.villes.get(id)!.nom);
    results.push({ ...m, quote, villes_vehicules: quote.frais_rapatriement > 0 ? villesLocales : [] });
  }
  return results;
}

export interface QuoteInput extends SearchParams {
  modeleId: number;
  options: string[];
  codePromo?: string | null;
  contactId?: number | null;
  utiliserAvoir?: boolean;
  driver?: { date_naissance?: string | null; date_permis?: string | null };
  excludeCommandeId?: number;
}

export async function buildQuote(db: Db, ctx: Ctx, input: QuoteInput) {
  validateSearch(ctx, input);
  const [model] = await loadModels(db, input.site, [input.modeleId]);
  if (!model) throw new HttpError(404, 'Modèle introuvable');
  const vehicles = await freeVehicles(db, [model.id], input.depart, input.retour, input.excludeCommandeId);
  const rental = bestQuote(ctx, model, vehicles, input);
  if (!rental) throw new HttpError(409, "Ce modèle n'est plus disponible pour ces dates");

  const allOptions: OptionP[] = (await db.query('SELECT id, code, libelle, libelle_court, type_prix, prix FROM options WHERE actif ORDER BY ordre')).rows;
  const driver = input.driver ? checkDriver(input.driver, model.puissance_ch, input.depart, ctx.settings.conducteur) : null;
  const chosen = allOptions.filter((o) => input.options.includes(o.code));
  if (driver?.gold_interdit && chosen.some((o) => o.code === 'gold'))
    throw new HttpError(400, 'Moins de 5 ans de permis ? Plus de 65 ans ? Assurance Gold/caution inapplicable et montant caution doublé.');

  const lignes = chosen.map((o) => ({ option_id: o.id, code: o.code, libelle: o.libelle_court || o.libelle, montant: optionAmount(o, rental.jours, rental.montant_location) }));
  const montant_options = round2(lignes.reduce((s, l) => s + l.montant, 0));

  let remise_fidelite = 0;
  let avoir_disponible = 0;
  if (input.contactId) {
    const r = await db.query(
      `SELECT (SELECT count(*) FROM commandes WHERE contact_id = $1 AND statut = 'terminee' AND ($2::int IS NULL OR id <> $2)) AS n,
              (SELECT COALESCE(sum(solde), 0) FROM avoirs WHERE contact_id = $1) AS avoir`,
      [input.contactId, input.excludeCommandeId ?? null],
    );
    if (Number(r.rows[0].n) > 0) remise_fidelite = round2((rental.montant_location * ctx.settings.tarification.remise_fidelite_pct) / 100);
    avoir_disponible = Number(r.rows[0].avoir);
  }

  let remise_promo = 0;
  let promo: { code: string; message: string } | null = null;
  if (input.codePromo) {
    const code = input.codePromo.trim().toUpperCase();
    const c = (await db.query('SELECT * FROM coupons WHERE upper(code) = $1', [code])).rows[0];
    const today = new Date().toISOString().slice(0, 10);
    const base = rental.montant_location + montant_options;
    if (!c || !c.actif) throw new HttpError(400, 'Code de promotion invalide');
    if ((c.date_debut && today < c.date_debut) || (c.date_fin && today > c.date_fin)) throw new HttpError(400, 'Ce code de promotion a expiré');
    if (c.utilisations_max && c.utilisations >= c.utilisations_max) throw new HttpError(400, 'Ce code de promotion a atteint son nombre maximum d\'utilisations');
    if (c.montant_min && base < Number(c.montant_min)) throw new HttpError(400, `Ce code nécessite un minimum de ${Number(c.montant_min).toFixed(2)} €`);
    remise_promo = c.type === 'pourcentage' ? round2((base * Number(c.valeur)) / 100) : Math.min(Number(c.valeur), base);
    promo = { code: c.code, message: c.type === 'pourcentage' ? `-${Number(c.valeur)}%` : `-${Number(c.valeur).toFixed(2)} €` };
  }

  const avant_avoir = round2(rental.total + montant_options - remise_fidelite - remise_promo);
  const avoir_utilise = input.utiliserAvoir ? Math.min(avoir_disponible, Math.max(0, avant_avoir)) : 0;
  const montant_total = round2(Math.max(0, avant_avoir - avoir_utilise));
  const gold = chosen.some((o) => o.code === 'gold');
  const caution_base = Number(model.caution);
  const caution = gold ? 0 : driver?.caution_doublee ? caution_base * 2 : caution_base;

  return {
    modele: model,
    location: rental,
    options: lignes,
    montant_options,
    remise_fidelite,
    remise_promo,
    promo,
    avoir_disponible,
    avoir_utilise,
    montant_total,
    caution,
    caution_doublee: !!driver?.caution_doublee && !gold,
    reserve_gold: gold ? ctx.settings.tarification.reserve_gold : 0,
    conducteur: driver,
    km_inclus_jour: ctx.settings.tarification.km_inclus_jour,
  };
}

export async function nextReference(db: Db, date = new Date()) {
  const y = date.getUTCFullYear();
  const r = await db.query(`SELECT count(*)::int AS n FROM commandes WHERE reference LIKE $1`, [`TAL-${y}-%`]);
  return `TAL-${y}-${String(r.rows[0].n + 1).padStart(5, '0')}`;
}

export type Mode = 'cb' | 'paypal' | 'cheque' | 'virement' | 'deux_fois';

export function paymentPlan(mode: Mode, total: number, acomptePct: number) {
  if (mode === 'cb' || mode === 'paypal') return { statut: 'confirmee', statut_paiement: total > 0 ? 'paye' : 'paye', paye: total };
  if (mode === 'deux_fois') {
    const acompte = round2((total * acomptePct) / 100);
    return { statut: 'confirmee', statut_paiement: 'acompte', paye: acompte };
  }
  return { statut: 'en_attente', statut_paiement: 'non_paye', paye: 0 };
}

export async function insertBooking(
  c: Db,
  quote: Awaited<ReturnType<typeof buildQuote>>,
  input: QuoteInput,
  extra: { contactId: number; mode: Mode; numVol?: string | null; remarques?: string | null; createdAt?: Date; statut?: string; statutPaiement?: string; paye?: number },
) {
  const plan = paymentPlan(extra.mode, quote.montant_total, (await loadSettings()).tarification.acompte_deux_fois_pct);
  const statut = extra.statut ?? plan.statut;
  const statut_paiement = extra.statutPaiement ?? plan.statut_paiement;
  const paye = extra.paye ?? plan.paye;
  const createdAt = extra.createdAt ?? new Date();
  const reference = await nextReference(c, createdAt);
  const l = quote.location;
  const r = await c.query(
    `INSERT INTO commandes (reference, site, contact_id, modele_id, vehicule_id, ville_depart_id, ville_retour_id, date_depart, date_retour,
       jours, forfait_jours, prix_jour, coefficient_saison, remise_age_pct, montant_location, frais_aller_simple, frais_rapatriement,
       montant_options, remise_fidelite, code_promo, remise_promo, avoir_utilise, montant_total, caution, caution_doublee, num_vol, remarques,
       statut, mode_paiement, statut_paiement, montant_paye, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31,$32,$32)
     RETURNING id, reference`,
    [reference, input.site, extra.contactId, quote.modele.id, l.vehicule_id, input.departId, input.retourId, input.depart, input.retour,
     l.jours, l.forfait_jours, l.prix_jour_remise, l.coefficient_saison, l.remise_age_pct, l.montant_location, l.frais_aller_simple, l.frais_rapatriement,
     quote.montant_options, quote.remise_fidelite, quote.promo?.code ?? null, quote.remise_promo, quote.avoir_utilise, quote.montant_total, quote.caution,
     quote.caution_doublee, extra.numVol ?? null, extra.remarques ?? null, statut, extra.mode, statut_paiement, paye, createdAt],
  );
  const id = r.rows[0].id;
  for (const o of quote.options)
    await c.query('INSERT INTO commande_options (commande_id, option_id, libelle, montant) VALUES ($1,$2,$3,$4)', [id, o.option_id, o.libelle, o.montant]);
  if (paye > 0)
    await c.query('INSERT INTO paiements (commande_id, montant, methode, statut, reference, created_at) VALUES ($1,$2,$3,$4,$5,$6)',
      [id, paye, extra.mode === 'deux_fois' ? 'paypal' : extra.mode, 'valide', `SIM-${reference}`, createdAt]);
  if (quote.promo) await c.query('UPDATE coupons SET utilisations = utilisations + 1 WHERE code = $1', [quote.promo.code]);
  if (quote.avoir_utilise > 0) await consumeAvoir(c, extra.contactId, quote.avoir_utilise);
  return { id, reference };
}

async function consumeAvoir(c: Db, contactId: number, amount: number) {
  let left = amount;
  const rows = (await c.query('SELECT id, solde FROM avoirs WHERE contact_id = $1 AND solde > 0 ORDER BY created_at FOR UPDATE', [contactId])).rows;
  for (const a of rows) {
    if (left <= 0) break;
    const take = Math.min(Number(a.solde), left);
    await c.query('UPDATE avoirs SET solde = solde - $1 WHERE id = $2', [take, a.id]);
    left = round2(left - take);
  }
}

export async function bookingDetail(db: Db, where: string, params: unknown[]) {
  const r = await db.query(
    `SELECT c.*, m.nom_affiche AS modele_nom, m.slug AS modele_slug, m.image AS modele_image, m.categorie, m.carburant, m.boite, m.places, m.portes,
            vd.nom AS ville_depart, vr.nom AS ville_retour, vd.point_rdv, vd.agent_nom, vd.agent_tel,
            v.immatriculation, v.annee AS vehicule_annee, v.couleur AS vehicule_couleur,
            ct.email, ct.nom, ct.prenom, ct.tel, ct.societe, ct.adresse, ct.code_postal, ct.commune, ct.pays, ct.num_permis, ct.date_permis, ct.date_naissance,
            COALESCE((SELECT json_agg(json_build_object('option_id', co.option_id, 'code', o.code, 'libelle', co.libelle, 'montant', co.montant))
                      FROM commande_options co JOIN options o ON o.id = co.option_id WHERE co.commande_id = c.id), '[]') AS options,
            COALESCE((SELECT json_agg(p ORDER BY p.created_at) FROM paiements p WHERE p.commande_id = c.id), '[]') AS paiements,
            (SELECT row_to_json(a) FROM avis a WHERE a.commande_id = c.id) AS avis
     FROM commandes c
     JOIN modeles m ON m.id = c.modele_id
     JOIN villes vd ON vd.id = c.ville_depart_id
     JOIN villes vr ON vr.id = c.ville_retour_id
     JOIN contacts ct ON ct.id = c.contact_id
     LEFT JOIN vehicules v ON v.id = c.vehicule_id
     WHERE ${where}`,
    params,
  );
  return r.rows[0];
}

export async function cancelBooking(c: PoolClient, commandeId: number, mode: 'remboursement' | 'avoir', now = new Date()) {
  const ctx = await loadSettings();
  const b = (await c.query('SELECT * FROM commandes WHERE id = $1 FOR UPDATE', [commandeId])).rows[0];
  if (!b) throw new HttpError(404, 'Réservation introuvable');
  if (!['en_attente', 'confirmee'].includes(b.statut)) throw new HttpError(400, 'Cette réservation ne peut plus être annulée');
  const assurance = (await c.query(`SELECT 1 FROM commande_options co JOIN options o ON o.id = co.option_id WHERE co.commande_id = $1 AND o.code = 'assurance_annulation'`, [commandeId])).rowCount! > 0;
  const paye = Number(b.montant_paye);
  let terms = { retenue_pct: 0, retenue: 0, rembourse: 0 };
  let statut_paiement = b.statut_paiement;
  if (paye > 0) {
    if (mode === 'avoir') {
      terms = { retenue_pct: 0, retenue: 0, rembourse: paye };
      await c.query('INSERT INTO avoirs (contact_id, commande_id, montant, solde, motif, created_at) VALUES ($1,$2,$3,$3,$4,$5)',
        [b.contact_id, b.id, paye, `Annulation de la réservation ${b.reference}`, now]);
      statut_paiement = 'avoir';
    } else {
      terms = cancellationTerms(Number(b.montant_total), paye, new Date(b.date_depart), now, assurance, ctx.tarification);
      await c.query(`INSERT INTO paiements (commande_id, montant, methode, statut, reference, created_at) VALUES ($1,$2,$3,'rembourse',$4,$5)`,
        [b.id, -terms.rembourse, b.mode_paiement === 'deux_fois' ? 'paypal' : b.mode_paiement, `REM-${b.reference}`, now]);
      statut_paiement = 'rembourse';
    }
  }
  await c.query(`UPDATE commandes SET statut = 'annulee', statut_paiement = $2, frais_annulation = $3, annulee_at = $4, updated_at = $4 WHERE id = $1`,
    [b.id, statut_paiement, terms.retenue, now]);
  return { ...terms, mode, assurance_annulation: assurance };
}

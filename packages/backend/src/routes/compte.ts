import { Router } from 'express';
import { z } from 'zod';
import { pool, q, one, tx } from '../db';
import { HttpError, parse, round2, wrap } from '../lib/http';
import { requireAuth } from '../lib/auth';
import { loadSettings } from '../lib/settings';
import { config } from '../config';
import { bookingDetail, buildQuote, cancelBooking, loadCtx } from '../services/booking';
import { cancellationTerms } from '../services/pricing';

const r = Router();
r.use(requireAuth);

async function own(ref: string, userId: number) {
  const b = await bookingDetail(pool, 'c.reference = $1 AND c.contact_id = $2', [ref, userId]);
  if (!b) throw new HttpError(404, 'Réservation introuvable');
  return b;
}

r.get('/resume', wrap(async (req, res) => {
  const id = req.user!.id;
  const s = await one(`SELECT
      (SELECT count(*) FROM commandes WHERE contact_id = $1)::int AS reservations,
      (SELECT count(*) FROM commandes WHERE contact_id = $1 AND statut IN ('en_attente','confirmee') AND date_depart > now())::int AS a_venir,
      (SELECT count(*) FROM commandes WHERE contact_id = $1 AND statut = 'terminee')::int AS terminees,
      (SELECT COALESCE(sum(solde),0) FROM avoirs WHERE contact_id = $1) AS avoir,
      (SELECT EXISTS (SELECT 1 FROM commandes WHERE contact_id = $1 AND statut = 'terminee')) AS fidelite`, [id]);
  const prochaine = await one(`SELECT c.reference, c.date_depart, c.date_retour, c.statut, m.nom_affiche AS modele_nom, m.image AS modele_image, vd.nom AS ville_depart, vr.nom AS ville_retour
    FROM commandes c JOIN modeles m ON m.id = c.modele_id JOIN villes vd ON vd.id = c.ville_depart_id JOIN villes vr ON vr.id = c.ville_retour_id
    WHERE c.contact_id = $1 AND c.statut IN ('en_attente','confirmee','en_cours') AND c.date_retour > now() ORDER BY c.date_depart LIMIT 1`, [id]);
  res.json({ ...s, prochaine: prochaine ?? null });
}));

r.get('/commandes', wrap(async (req, res) => {
  res.json(await q(`SELECT c.id, c.reference, c.date_depart, c.date_retour, c.jours, c.montant_total, c.montant_paye, c.statut, c.statut_paiement, c.mode_paiement, c.created_at,
      m.nom_affiche AS modele_nom, m.image AS modele_image, m.slug AS modele_slug, vd.nom AS ville_depart, vr.nom AS ville_retour,
      EXISTS (SELECT 1 FROM avis a WHERE a.commande_id = c.id) AS avis_laisse
    FROM commandes c JOIN modeles m ON m.id = c.modele_id JOIN villes vd ON vd.id = c.ville_depart_id JOIN villes vr ON vr.id = c.ville_retour_id
    WHERE c.contact_id = $1 ORDER BY c.date_depart DESC`, [req.user!.id]));
}));

r.get('/commandes/:ref', wrap(async (req, res) => res.json(await own(req.params.ref, req.user!.id))));

r.post('/commandes/:ref/payer', wrap(async (req, res) => {
  const p = parse(z.object({ mode: z.enum(['cb', 'paypal']) }), req.body);
  if (!config.simulatedPayments) throw new HttpError(503, "Le paiement en ligne n'est pas encore disponible : réglez par chèque, virement ou auprès de notre agent.");
  const b = await own(req.params.ref, req.user!.id);
  if (b.statut === 'annulee' || b.statut === 'terminee') throw new HttpError(400, 'Cette réservation ne peut plus être payée');
  const reste = round2(Number(b.montant_total) - Number(b.montant_paye));
  if (reste <= 0) throw new HttpError(400, 'Cette réservation est déjà réglée');
  await tx(async (c) => {
    await c.query(`INSERT INTO paiements (commande_id, montant, methode, statut, reference) VALUES ($1,$2,$3,'valide',$4)`, [b.id, reste, p.mode, `SIM-${b.reference}-${Date.now()}`]);
    await c.query(`UPDATE commandes SET montant_paye = montant_total, statut_paiement = 'paye', statut = CASE WHEN statut = 'en_attente' THEN 'confirmee' ELSE statut END, updated_at = now() WHERE id = $1`, [b.id]);
  });
  res.json(await own(req.params.ref, req.user!.id));
}));

r.get('/commandes/:ref/annulation', wrap(async (req, res) => {
  const b = await own(req.params.ref, req.user!.id);
  const s = await loadSettings();
  const assurance = b.options.some((o: any) => o.code === 'assurance_annulation');
  const remboursement = cancellationTerms(Number(b.montant_total), Number(b.montant_paye), new Date(b.date_depart), new Date(), assurance, s.tarification);
  res.json({ annulable: ['en_attente', 'confirmee'].includes(b.statut), montant_paye: Number(b.montant_paye), assurance_annulation: assurance, remboursement, avoir: Number(b.montant_paye) });
}));

r.post('/commandes/:ref/annuler', wrap(async (req, res) => {
  const p = parse(z.object({ mode: z.enum(['remboursement', 'avoir']) }), req.body);
  const b = await own(req.params.ref, req.user!.id);
  const result = await tx((c) => cancelBooking(c, b.id, p.mode));
  res.json(result);
}));

async function modelChangeQuote(c: any, b: any, modeleId: number, contactId: number) {
  const ctx = await loadCtx();
  const quote = await buildQuote(c, ctx, {
    site: b.site, departId: b.ville_depart_id, retourId: b.ville_retour_id, depart: new Date(b.date_depart), retour: new Date(b.date_retour),
    modeleId, options: b.options.map((o: any) => o.code), contactId, excludeCommandeId: b.id,
    driver: { date_naissance: b.date_naissance, date_permis: b.date_permis },
  });
  return { quote, difference: round2(quote.montant_total - Number(b.montant_total)) };
}

r.post('/commandes/:ref/changer-modele/devis', wrap(async (req, res) => {
  const p = parse(z.object({ modele_id: z.coerce.number().int() }), req.body);
  const b = await own(req.params.ref, req.user!.id);
  const { quote, difference } = await modelChangeQuote(pool, b, p.modele_id, req.user!.id);
  res.json({ montant_total: quote.montant_total, ancien_total: Number(b.montant_total), difference, modele: quote.modele, erreurs: quote.conducteur?.erreurs ?? [] });
}));

r.post('/commandes/:ref/changer-modele', wrap(async (req, res) => {
  const p = parse(z.object({ modele_id: z.coerce.number().int() }), req.body);
  const b = await own(req.params.ref, req.user!.id);
  if (!['en_attente', 'confirmee'].includes(b.statut)) throw new HttpError(400, 'Le modèle ne peut plus être changé pour cette réservation');
  if (p.modele_id === b.modele_id) throw new HttpError(400, 'Choisissez un modèle différent');
  await tx(async (c) => {
    await c.query('SELECT pg_advisory_xact_lock($1)', [p.modele_id]);
    const { quote } = await modelChangeQuote(c, b, p.modele_id, req.user!.id);
    if (quote.conducteur?.erreurs.length) throw new HttpError(400, quote.conducteur.erreurs.join(' '));
    const paye = Number(b.montant_paye);
    let montantPaye = paye;
    if (paye > quote.montant_total) {
      const credit = round2(paye - quote.montant_total);
      await c.query('INSERT INTO avoirs (contact_id, commande_id, montant, solde, motif) VALUES ($1,$2,$3,$3,$4)',
        [b.contact_id, b.id, credit, `Changement de modèle sur la réservation ${b.reference}`]);
      montantPaye = quote.montant_total;
    }
    const statutPaiement = montantPaye >= quote.montant_total ? 'paye' : montantPaye > 0 ? 'acompte' : 'non_paye';
    const l = quote.location;
    await c.query(`UPDATE commandes SET modele_id=$2, vehicule_id=$3, prix_jour=$4, forfait_jours=$5, coefficient_saison=$6, remise_age_pct=$7, montant_location=$8,
        frais_aller_simple=$9, frais_rapatriement=$10, montant_options=$11, remise_fidelite=$12, remise_promo=0, code_promo=NULL, montant_total=$13, caution=$14,
        caution_doublee=$15, montant_paye=$16, statut_paiement=$17, updated_at=now() WHERE id=$1`,
      [b.id, quote.modele.id, l.vehicule_id, l.prix_jour_remise, l.forfait_jours, l.coefficient_saison, l.remise_age_pct, l.montant_location,
       l.frais_aller_simple, l.frais_rapatriement, quote.montant_options, quote.remise_fidelite, quote.montant_total, quote.caution, quote.caution_doublee,
       montantPaye, statutPaiement]);
    await c.query('DELETE FROM commande_options WHERE commande_id = $1', [b.id]);
    for (const o of quote.options)
      await c.query('INSERT INTO commande_options (commande_id, option_id, libelle, montant) VALUES ($1,$2,$3,$4)', [b.id, o.option_id, o.libelle, o.montant]);
  });
  res.json(await own(req.params.ref, req.user!.id));
}));

r.get('/avoirs', wrap(async (req, res) => {
  res.json(await q(`SELECT a.id, a.montant, a.solde, a.motif, a.created_at, c.reference FROM avoirs a LEFT JOIN commandes c ON c.id = a.commande_id
    WHERE a.contact_id = $1 ORDER BY a.created_at DESC`, [req.user!.id]));
}));

r.post('/commandes/:ref/avis', wrap(async (req, res) => {
  const p = parse(z.object({
    note: z.coerce.number().int().min(1).max(5),
    observation_reservation: z.string().trim().max(3000).optional().nullable(),
    observation_place: z.string().trim().max(3000).optional().nullable(),
  }), req.body);
  const b = await own(req.params.ref, req.user!.id);
  if (b.statut !== 'terminee') throw new HttpError(400, 'Vous pourrez donner votre avis après votre location');
  if (b.avis) throw new HttpError(409, 'Vous avez déjà donné votre avis pour cette réservation');
  await q(`INSERT INTO avis (contact_id, commande_id, auteur, note, observation_reservation, observation_place) VALUES ($1,$2,$3,$4,$5,$6)`,
    [req.user!.id, b.id, `${b.prenom} ${b.nom}`, p.note, p.observation_reservation || null, p.observation_place || null]);
  res.status(201).json({ ok: true });
}));

export default r;

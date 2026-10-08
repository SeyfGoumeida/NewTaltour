import fs from 'fs';
import path from 'path';
import bcrypt from 'bcrypt';
import { PoolClient } from 'pg';
import { pool } from '../db';
import { round2 } from '../lib/http';
import { Settings } from '../lib/settings';
import { cancellationTerms, ModelP, OptionP, optionAmount, quoteRental, VilleP } from '../services/pricing';

const DATA = path.resolve(__dirname, '../../../database/data');
const SCHEMA = path.resolve(__dirname, '../../../database/schema.sql');
const read = (f: string) => JSON.parse(fs.readFileSync(path.join(DATA, f), 'utf8'));

let seed = 20261008;
const rnd = () => {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const int = (a: number, b: number) => a + Math.floor(rnd() * (b - a + 1));
const pick = <T>(xs: T[]) => xs[Math.floor(rnd() * xs.length)];
const chance = (p: number) => rnd() < p;
function weighted<T>(items: [T, number][]): T {
  const total = items.reduce((s, [, w]) => s + w, 0);
  let x = rnd() * total;
  for (const [v, w] of items) if ((x -= w) <= 0) return v;
  return items[items.length - 1][0];
}
const slugify = (s: string) => s.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const DAY = 86_400_000;
const NOW = new Date();
const atHour = (d: Date, h: number) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), h, 0, 0));

const PRENOMS = ['Karim', 'Yacine', 'Sofiane', 'Nadia', 'Amine', 'Riad', 'Samira', 'Lyes', 'Mehdi', 'Walid', 'Farid', 'Hichem', 'Sarah', 'Nassim', 'Amel', 'Rachid',
  'Fatima', 'Mourad', 'Leila', 'Kamel', 'Yasmine', 'Bilal', 'Salima', 'Djamel', 'Imane', 'Nabil', 'Meriem', 'Omar', 'Lina', 'Abdelkader', 'Hakim', 'Sonia',
  'Mohamed', 'Ines', 'Rayan', 'Sabrina', 'Adel', 'Kenza', 'Fares', 'Malika', 'Julien', 'Thomas', 'Claire', 'Nicolas', 'Sophie', 'Pierre', 'Camille', 'Marc'];
const NOMS = ['Benali', 'Haddad', 'Mansouri', 'Cherif', 'Belkacem', 'Bouzid', 'Ait Ahmed', 'Hamdi', 'Saadi', 'Ferhat', 'Kaci', 'Bensalem', 'Boudiaf', 'Meziane',
  'Zerrouki', 'Brahimi', 'Khelifi', 'Amrani', 'Taleb', 'Rahmani', 'Larbi', 'Ouali', 'Hamidi', 'Djebbar', 'Slimani', 'Benamar', 'Guerroudj', 'Mebarki', 'Laib',
  'Benyahia', 'Martin', 'Bernard', 'Dubois', 'Moreau', 'Laurent', 'Garcia', 'Roux', 'Fontaine'];
const COMMUNES: [string, string, string][] = [['Paris', '75011', 'France'], ['Lyon', '69003', 'France'], ['Marseille', '13001', 'France'], ['Saint-Étienne', '42000', 'France'],
  ['Lille', '59000', 'France'], ['Grenoble', '38000', 'France'], ['Nice', '06000', 'France'], ['Toulouse', '31000', 'France'], ['Montréal', 'H2X 1Y4', 'Canada'],
  ['Bruxelles', '1000', 'Belgique'], ['Alger', '16000', 'Algérie'], ['Oran', '31000', 'Algérie'], ['Bejaia', '06000', 'Algérie'], ['Genève', '1201', 'Suisse']];
const COULEURS = ['Blanc', 'Gris', 'Noir', 'Gris foncé', 'Bleu', 'Rouge', 'Argent'];
const WILAYA: Record<string, string> = { Alger: '16', Oran: '31', Bejaia: '06', Constantine: '25', Setif: '19', Chlef: '02', Jijel: '18', Tlemcen: '13', Skikda: '21', Biskra: '07', Batna: '05', Annaba: '23' };
const AGENTS = ['Karim B.', 'Yacine H.', 'Sofiane M.', 'Nadia C.', 'Amine B.', 'Riad B.', 'Samir A.', 'Lyes H.', 'Mehdi S.', 'Walid F.', 'Farid K.', 'Hichem B.', 'Youssef E.'];
const CITY_WEIGHT: Record<string, number> = { Alger: 30, Oran: 16, Constantine: 10, Bejaia: 9, Setif: 7, Tlemcen: 6, Annaba: 5, Batna: 4, Jijel: 4, Skikda: 3, Biskra: 3, Chlef: 3, Marrakech: 6 };

async function main() {
  const content = read('content.json');
  const modelsDz = read('models.json');
  const modelsMa = read('models_maroc.json');
  const reviews = read('reviews.json');
  const c: PoolClient = await pool.connect();
  try {
    console.log('Schéma…');
    await c.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
    await c.query(fs.readFileSync(SCHEMA, 'utf8'));
    await c.query('BEGIN');

    for (const s of content.sites)
      await c.query('INSERT INTO sites (code, nom, titre, slogan, telephones, hotline) VALUES ($1,$2,$3,$4,$5,$6)', [s.code, s.nom, s.titre, s.slogan, s.telephones, s.hotline]);
    for (const [cle, valeur] of Object.entries(content.parametres))
      await c.query('INSERT INTO parametres (cle, valeur) VALUES ($1,$2)', [cle, JSON.stringify(valeur)]);
    const settings = content.parametres as Settings;

    const villes: (VilleP & { site: string | null })[] = [];
    for (const [i, v] of content.villes.entries()) {
      const row = (await c.query(`INSERT INTO villes (nom, site, latitude, longitude, aeroport, point_rdv, agent_nom, agent_tel, ordre)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id, nom, site, latitude, longitude`,
        [v.nom, v.site ?? null, v.lat, v.lng, v.aeroport, v.point_rdv, `${AGENTS[i]} (exemple)`, `+213 555 00 10 ${String(i + 10)}`, i])).rows[0];
      villes.push(row);
    }
    const villeMap = new Map(villes.map((v) => [v.id, v]));
    const villesDz = villes.filter((v) => !v.site);
    const marrakech = villes.find((v) => v.nom === 'Marrakech')!;

    const options: OptionP[] = [];
    for (const [i, o] of content.options.entries())
      options.push((await c.query(`INSERT INTO options (code, libelle, libelle_court, description, type_prix, prix, actif, ordre) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
        RETURNING id, code, libelle, libelle_court, type_prix, prix`, [o.code, o.libelle, o.libelle_court ?? null, o.description, o.type_prix, o.prix, o.actif, i])).rows[0]);
    const activeOptions = options.filter((o) => content.options.find((x: any) => x.code === o.code).actif);

    for (const [i, f] of content.faq.entries()) await c.query('INSERT INTO faq (question, reponse, ordre) VALUES ($1,$2,$3)', [f.q, f.r, i]);
    for (const p of content.pages) await c.query('INSERT INTO pages (slug, titre, contenu) VALUES ($1,$2,$3)', [p.slug, p.titre, p.contenu]);
    for (const a of content.articles)
      await c.query('INSERT INTO articles (slug, titre, contenu, auteur, date_publication) VALUES ($1,$2,$3,$4,$5)', [slugify(a.titre), a.titre, a.contenu, a.auteur, a.date]);

    for (const y of [2025, 2026, 2027])
      await c.query('INSERT INTO saisons (nom, date_debut, date_fin, coefficient) VALUES ($1,$2,$3,1.30)', [`Haute saison ${y}`, `${y}-06-15`, `${y}-09-10`]);
    const saisons = (await c.query('SELECT date_debut, date_fin, coefficient FROM saisons')).rows;

    const coupons = [
      ['BIENVENUE10', 'pourcentage', 10, null, null, null, null, true],
      ['TALTOUR2026', 'montant', 15, '2026-01-01', '2026-12-31', 150, 500, true],
      ['FIDELE15', 'pourcentage', 15, '2026-01-01', '2027-06-30', 200, 50, true],
      ['ETE2025', 'pourcentage', 10, '2025-06-01', '2025-08-31', null, null, true],
      ['AID2026', 'pourcentage', 5, '2026-03-10', '2026-04-10', null, null, true],
      ['PARTENAIRE20', 'montant', 20, null, null, 300, 10, false],
    ];
    for (const cp of coupons)
      await c.query('INSERT INTO coupons (code, type, valeur, date_debut, date_fin, montant_min, utilisations_max, actif) VALUES ($1,$2,$3,$4,$5,$6,$7,$8)', cp);

    console.log('Modèles et véhicules…');
    const models: (ModelP & { site: string; nom_affiche: string; image: string; poids: number })[] = [];
    for (const [i, m] of [...modelsDz.map((m: any) => ({ ...m, site: 'dz' })), ...modelsMa].entries()) {
      const row = (await c.query(`INSERT INTO modeles (site, slug, nom, nom_affiche, marque, categorie, categorie_libelle, places, portes, coffre_l, reservoir_l, carburant, boite,
          type_boite, puissance_ch, airbags, vitesse_max, consommation, caution, equipements, fiche, image, ordre)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23) RETURNING id`,
        [m.site, m.slug, m.name, m.display_name, m.brand, m.category, m.category_label, m.seats, m.doors, m.trunk_l, m.tank_l, m.fuel, m.transmission, m.gearbox,
         m.power_hp, m.airbags, m.top_speed, m.consumption, m.deposit, m.equipment, JSON.stringify(m.specs), m.image, i])).rows[0];
      const tarifs = Object.entries(m.prices).map(([j, p]) => ({ jours: Number(j), prix: Number(p) }));
      for (const t of tarifs) await c.query('INSERT INTO modele_tarifs (modele_id, jours, prix) VALUES ($1,$2,$3)', [row.id, t.jours, t.prix]);
      const prix1 = Number(m.prices['1']);
      models.push({ id: row.id, caution: m.deposit, puissance_ch: m.power_hp, tarifs, site: m.site, nom_affiche: m.display_name, image: m.image, poids: prix1 < 40 ? 3 : prix1 < 55 ? 2 : 1 });
    }

    const vehicles: { id: number; modele_id: number; annee: number; ville_id: number; busy: [number, number][] }[] = [];
    const plates = new Set<string>();
    for (const m of models) {
      const count = m.site === 'ma' ? int(1, 2) : m.poids === 3 ? int(3, 5) : m.poids === 2 ? int(2, 4) : int(1, 3);
      for (let k = 0; k < count; k++) {
        const ville = m.site === 'ma' ? marrakech : weighted(villesDz.map((v) => [v, CITY_WEIGHT[v.nom]] as [VilleP, number]));
        const annee = weighted([[2026, 3], [2025, 4], [2024, 3], [2023, 2]] as [number, number][]);
        let plate: string;
        do {
          plate = m.site === 'ma' ? `${int(10000, 99999)}-${pick(['A', 'B', 'D', 'H'])}-40` : `${String(int(1, 99999)).padStart(5, '0')}-1${String(annee).slice(2)}-${WILAYA[ville.nom]}`;
        } while (plates.has(plate));
        plates.add(plate);
        const statut = chance(0.05) ? 'maintenance' : 'disponible';
        const row = (await c.query(`INSERT INTO vehicules (modele_id, immatriculation, annee, couleur, ville_id, kilometrage, statut, notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
          [m.id, plate, annee, pick(COULEURS), ville.id, (2027 - annee) * int(12000, 26000), statut, statut === 'maintenance' ? 'Révision des 30 000 km (exemple)' : null])).rows[0];
        if (statut === 'disponible') vehicles.push({ id: row.id, modele_id: m.id, annee, ville_id: ville.id, busy: [] });
      }
    }

    console.log('Clients…');
    const hashClient = await bcrypt.hash('Client2026!', 10);
    const hashAdmin = await bcrypt.hash('Admin2026!', 10);
    await c.query(`INSERT INTO contacts (email, nom, prenom, tel, commune, pays, password_hash, role, date_naissance, date_permis) VALUES ($1,'Taltour','Admin','04 28 04 00 72','Alger','Algérie',$2,10,'1980-01-01','2000-01-01')`,
      ['admin@taltour.com', hashAdmin]);
    const contacts: { id: number; nom: string; prenom: string; created: Date }[] = [];
    const demo = (await c.query(`INSERT INTO contacts (email, nom, prenom, tel, adresse, code_postal, commune, pays, num_permis, date_permis, date_naissance, password_hash, created_at)
      VALUES ('client@taltour.com','Benali','Karim','+33 6 12 34 56 78','12 rue de la Paix','42000','Saint-Étienne','France','15AB12345','2008-06-12','1985-03-21',$1,$2) RETURNING id, nom, prenom, created_at`,
      [hashClient, new Date(NOW.getTime() - 400 * DAY)])).rows[0];
    const hashOthers = await bcrypt.hash('Taltour2026!', 10);
    const emails = new Set<string>();
    for (let i = 0; i < 90; i++) {
      const prenom = pick(PRENOMS);
      const nom = pick(NOMS);
      let email = `${slugify(prenom)}.${slugify(nom)}@example.com`;
      if (emails.has(email)) email = `${slugify(prenom)}.${slugify(nom)}${i}@example.com`;
      emails.add(email);
      const [commune, cp, pays] = pick(COMMUNES);
      const birth = new Date(Date.UTC(int(1958, 2000), int(0, 11), int(1, 28)));
      const permis = new Date(birth.getTime() + int(18, 26) * 365.25 * DAY);
      const created = new Date(NOW.getTime() - int(30, 720) * DAY);
      const row = (await c.query(`INSERT INTO contacts (email, nom, prenom, tel, adresse, code_postal, commune, pays, num_permis, date_permis, date_naissance, password_hash, created_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING id, nom, prenom, created_at`,
        [email, nom.toUpperCase(), prenom, pays === 'Algérie' ? `+213 5${int(50, 79)} ${int(100, 999)} ${int(100, 999)}` : `+33 6 ${int(10, 99)} ${int(10, 99)} ${int(10, 99)} ${int(10, 99)}`,
         `${int(1, 120)} ${pick(['rue', 'avenue', 'boulevard', 'chemin'])} ${pick(['Victor Hugo', 'de la République', 'Jean Jaurès', 'des Lilas', 'Pasteur', 'Didouche Mourad'])}`,
         cp, commune, pays, `${int(10, 99)}${pick(['AB', 'CD', 'EF', 'KL'])}${int(10000, 99999)}`, permis.toISOString().slice(0, 10), birth.toISOString().slice(0, 10), hashOthers, created])).rows[0];
      contacts.push({ id: row.id, nom: row.nom, prenom: row.prenom, created: row.created_at });
    }

    console.log('Réservations…');
    type B = {
      contactId: number; model: (typeof models)[number]; vehicle: (typeof vehicles)[number]; departId: number; retourId: number; depart: Date; retour: Date;
      created: Date; mode: string; options: OptionP[]; promo?: string; statut?: string; paye?: number; annul?: 'remboursement' | 'avoir'; numVol?: string; remarques?: string;
    };
    const plan: B[] = [];
    const free = (v: (typeof vehicles)[number], a: number, b: number) => v.busy.every(([x, y]) => b <= x || a >= y);

    function tryPlan(o: { contactId: number; depart: Date; jours: number; departId?: number; retourId?: number; modelId?: number; site?: string; created?: Date }): B | null {
      for (let attempt = 0; attempt < 25; attempt++) {
        const site = o.site ?? (chance(0.06) ? 'ma' : 'dz');
        const pool = models.filter((m) => m.site === site && (!o.modelId || m.id === o.modelId));
        const model = o.modelId ? pool[0] : weighted(pool.map((m) => [m, m.poids] as [typeof m, number]));
        const departId = o.departId ?? (site === 'ma' ? marrakech.id : weighted(villesDz.map((v) => [v.id, CITY_WEIGHT[v.nom]] as [number, number])));
        const retourId = o.retourId ?? (site === 'ma' || chance(0.8) ? departId : pick(villesDz).id);
        const depart = atHour(o.depart, pick([8, 9, 10, 11, 14, 16, 18, 21]));
        const retour = new Date(depart.getTime() + o.jours * DAY);
        const cands = vehicles.filter((v) => v.modele_id === model.id && free(v, depart.getTime(), retour.getTime()));
        if (!cands.length) continue;
        const local = cands.filter((v) => v.ville_id === departId);
        const vehicle = local.length && chance(0.85) ? pick(local) : pick(cands);
        const created = o.created ?? new Date(Math.min(NOW.getTime() - 3600_000, depart.getTime() - int(1, 75) * DAY));
        vehicle.busy.push([depart.getTime(), retour.getTime()]);
        const opts = activeOptions.filter((op) => {
          const p: Record<string, number> = { gold: 0.22, multiconducteur: 0.15, siege_bebe: 0.07, siege_enfant: 0.08, rehausseur: 0.05, km_illimite: 0.12, vip: 0.1, assurance_annulation: 0.12, livraison_domicile: 0.05, chauffeur: 0.03 };
          return chance(p[op.code] ?? 0);
        });
        return { contactId: o.contactId, model, vehicle, departId, retourId, depart, retour, created, options: opts,
          mode: weighted([['cb', 40], ['paypal', 22], ['deux_fois', 18], ['virement', 12], ['cheque', 8]] as [string, number][]),
          promo: chance(0.07) ? pick(['BIENVENUE10', 'TALTOUR2026']) : undefined, numVol: chance(0.6) ? `${pick(['AH', 'AF', 'TO', 'V7'])}${int(1000, 9999)}` : undefined };
      }
      return null;
    }

    const duration = () => weighted([[int(1, 3), 15], [int(4, 6), 20], [int(7, 13), 35], [int(14, 21), 18], [int(22, 35), 10], [int(60, 95), 2]] as [number, number][]);
    for (let i = 0; i < 430; i++) {
      const offset = weighted([[int(-365, -60), 55], [int(-59, -1), 18], [int(0, 20), 12], [int(21, 120), 15]] as [number, number][]);
      const jours = duration();
      const start = new Date(NOW.getTime() + offset * DAY);
      const ct = pick(contacts);
      const b = tryPlan({ contactId: ct.id, depart: start, jours });
      if (b) {
        if (b.created < ct.created) b.created = new Date(Math.max(ct.created.getTime(), b.depart.getTime() - 5 * DAY));
        if (b.created > NOW) b.created = new Date(NOW.getTime() - 3600_000);
        if (chance(0.08)) b.annul = chance(0.5) ? 'avoir' : 'remboursement';
        plan.push(b);
      }
    }

    const dz = (s: string) => models.find((m) => m.site === 'dz' && m.nom_affiche.toLowerCase().includes(s))!;
    const alger = villes.find((v) => v.nom === 'Alger')!.id;
    const oran = villes.find((v) => v.nom === 'Oran')!.id;
    const bejaia = villes.find((v) => v.nom === 'Bejaia')!.id;
    const opt = (code: string) => options.find((o) => o.code === code)!;
    const demoPlans: [Omit<Partial<B>, 'model'> & { offset: number; jours: number; model: string }, string?][] = [
      [{ offset: -330, jours: 14, model: 'grand i10', departId: alger, retourId: alger, mode: 'cb', options: [opt('multiconducteur')] }, 'avis'],
      [{ offset: -120, jours: 7, model: 'duster 1.6', departId: oran, retourId: alger, mode: 'paypal', options: [opt('gold'), opt('siege_enfant')] }],
      [{ offset: -200, jours: 5, model: 'clio 5', departId: bejaia, retourId: bejaia, mode: 'cb', options: [], annul: 'avoir' }],
      [{ offset: 21, jours: 10, model: 'tiggo 7', departId: alger, retourId: oran, mode: 'cb', options: [opt('gold'), opt('vip')] }],
      [{ offset: 62, jours: 7, model: 'symbol extreme axs', departId: alger, retourId: alger, mode: 'cheque', options: [opt('siege_bebe')] }],
      [{ offset: 95, jours: 14, model: 'creta', departId: bejaia, retourId: bejaia, mode: 'deux_fois', options: [opt('km_illimite'), opt('assurance_annulation')] }],
    ];
    const demoRefs: { b: B; avis?: boolean }[] = [];
    for (const [d, extra] of demoPlans) {
      const b = tryPlan({ contactId: demo.id, depart: new Date(NOW.getTime() + d.offset * DAY), jours: d.jours, departId: d.departId, retourId: d.retourId, modelId: dz(d.model).id, site: 'dz' });
      if (!b) continue;
      b.mode = d.mode!; b.options = d.options!; b.promo = undefined; b.annul = d.annul;
      b.created = new Date(Math.min(NOW.getTime() - 2 * DAY, b.depart.getTime() - 30 * DAY));
      plan.push(b);
      demoRefs.push({ b, avis: extra === 'avis' });
    }

    plan.sort((a, b) => a.created.getTime() - b.created.getTime());
    const completedBefore = new Map<number, number[]>();
    const counters: Record<number, number> = {};
    const demoBookingIds: { id: number; avis?: boolean }[] = [];
    let avoirTotal = 0;

    for (const b of plan) {
      const q = quoteRental({ model: b.model, vehicle: b.vehicle, villes: villeMap, departId: b.departId, retourId: b.retourId, depart: b.depart, retour: b.retour, settings, saisons, now: b.created })!;
      const lignes = b.options.map((o) => ({ o, montant: optionAmount(o, q.jours, q.montant_location) }));
      const montantOptions = round2(lignes.reduce((s, l) => s + l.montant, 0));
      const hadCompleted = (completedBefore.get(b.contactId) ?? []).some((t) => t < b.created.getTime());
      const remiseFidelite = hadCompleted ? round2((q.montant_location * settings.tarification.remise_fidelite_pct) / 100) : 0;
      let remisePromo = 0;
      if (b.promo === 'BIENVENUE10') remisePromo = round2((q.montant_location + montantOptions) * 0.1);
      if (b.promo === 'TALTOUR2026') { if (q.montant_location + montantOptions >= 150 && b.created.getUTCFullYear() === 2026) remisePromo = 15; else b.promo = undefined; }
      const total = round2(q.total + montantOptions - remiseFidelite - remisePromo);
      const gold = b.options.some((o) => o.code === 'gold');

      const started = b.depart <= NOW;
      const ended = b.retour <= NOW;
      let statut = ended ? 'terminee' : started ? 'en_cours' : 'confirmee';
      let statutPaiement = 'paye';
      let paye = total;
      if (b.mode === 'deux_fois') {
        const acompte = round2((total * settings.tarification.acompte_deux_fois_pct) / 100);
        if (!started) { statutPaiement = 'acompte'; paye = acompte; } else { paye = total; }
        b.paye = acompte;
      }
      const demoUnpaid = demoRefs.some((x) => x.b === b) && b.mode === 'cheque';
      if ((b.mode === 'cheque' || b.mode === 'virement') && !started && (demoUnpaid || chance(0.55))) { statut = 'en_attente'; statutPaiement = 'non_paye'; paye = 0; }
      if (b.annul) statut = 'annulee';
      const y = b.created.getUTCFullYear();
      counters[y] = (counters[y] ?? 0) + 1;
      const reference = `TAL-${y}-${String(counters[y]).padStart(5, '0')}`;
      const row = (await c.query(`INSERT INTO commandes (reference, site, contact_id, modele_id, vehicule_id, ville_depart_id, ville_retour_id, date_depart, date_retour, jours, forfait_jours,
          prix_jour, coefficient_saison, remise_age_pct, montant_location, frais_aller_simple, frais_rapatriement, montant_options, remise_fidelite, code_promo, remise_promo,
          montant_total, caution, num_vol, statut, mode_paiement, statut_paiement, montant_paye, created_at, updated_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$29) RETURNING id`,
        [reference, b.model.site, b.contactId, b.model.id, b.vehicle.id, b.departId, b.retourId, b.depart, b.retour, q.jours, q.forfait_jours, q.prix_jour_remise,
         q.coefficient_saison, q.remise_age_pct, q.montant_location, q.frais_aller_simple, q.frais_rapatriement, montantOptions, remiseFidelite, b.promo ?? null, remisePromo,
         total, gold ? 0 : b.model.caution, b.numVol ?? null, statut === 'annulee' ? 'confirmee' : statut, b.mode, statutPaiement, paye, b.created])).rows[0];
      for (const l of lignes)
        await c.query('INSERT INTO commande_options (commande_id, option_id, libelle, montant) VALUES ($1,$2,$3,$4)', [row.id, l.o.id, l.o.libelle_court || l.o.libelle, l.montant]);
      const methode = b.mode === 'deux_fois' ? 'paypal' : b.mode;
      if (b.mode === 'deux_fois') {
        await c.query(`INSERT INTO paiements (commande_id, montant, methode, statut, reference, created_at) VALUES ($1,$2,'paypal','valide',$3,$4)`, [row.id, b.paye, `SIM-${reference}`, b.created]);
        if (started) await c.query(`INSERT INTO paiements (commande_id, montant, methode, statut, reference, created_at) VALUES ($1,$2,'especes','valide',$3,$4)`,
          [row.id, round2(total - b.paye!), `ESP-${reference}`, b.depart]);
      } else if (paye > 0) {
        const when = b.mode === 'cheque' || b.mode === 'virement' ? new Date(Math.min(NOW.getTime(), b.created.getTime() + int(1, 6) * DAY)) : b.created;
        await c.query(`INSERT INTO paiements (commande_id, montant, methode, statut, reference, created_at) VALUES ($1,$2,$3,'valide',$4,$5)`, [row.id, paye, methode, `SIM-${reference}`, when]);
      }
      if (statut === 'annulee') {
        const when = new Date(Math.min(NOW.getTime() - 3600_000, b.created.getTime() + int(1, 10) * DAY, b.depart.getTime() - 3600_000));
        b.vehicle.busy = b.vehicle.busy.filter(([x]) => x !== b.depart.getTime());
        const paid = b.mode === 'deux_fois' ? b.paye! : paye;
        let frais = 0;
        let sp = paid > 0 ? 'rembourse' : 'non_paye';
        if (paid > 0 && b.annul === 'avoir') {
          await c.query('INSERT INTO avoirs (contact_id, commande_id, montant, solde, motif, created_at) VALUES ($1,$2,$3,$3,$4,$5)',
            [b.contactId, row.id, paid, `Annulation de la réservation ${reference}`, when]);
          sp = 'avoir';
          avoirTotal += paid;
        } else if (paid > 0) {
          const t = cancellationTerms(total, paid, b.depart, when, b.options.some((o) => o.code === 'assurance_annulation'), settings.tarification);
          frais = t.retenue;
          await c.query(`INSERT INTO paiements (commande_id, montant, methode, statut, reference, created_at) VALUES ($1,$2,$3,'rembourse',$4,$5)`, [row.id, -t.rembourse, methode, `REM-${reference}`, when]);
        }
        await c.query(`DELETE FROM paiements WHERE commande_id = $1 AND methode = 'especes'`, [row.id]);
        await c.query(`UPDATE commandes SET statut = 'annulee', statut_paiement = $2, montant_paye = $3, frais_annulation = $4, annulee_at = $5, updated_at = $5 WHERE id = $1`,
          [row.id, sp, paid, frais, when]);
      } else if (statut === 'terminee') {
        completedBefore.set(b.contactId, [...(completedBefore.get(b.contactId) ?? []), b.retour.getTime()]);
        const km = q.jours * int(60, 240);
        await c.query('UPDATE vehicules SET kilometrage = kilometrage + $1 WHERE id = $2', [km, b.vehicle.id]);
      }
      if (b.promo) await c.query('UPDATE coupons SET utilisations = utilisations + 1 WHERE code = $1', [b.promo]);
      const d = demoRefs.find((x) => x.b === b);
      if (d) demoBookingIds.push({ id: row.id, avis: d.avis });
    }

    console.log('Avis…');
    for (const rv of reviews) {
      const [dd, mm, yy] = rv.date.split('/').map(Number);
      await c.query(`INSERT INTO avis (auteur, note, observation_reservation, observation_place, created_at) VALUES ($1,$2,$3,$4,$5)`,
        [rv.author, Math.max(1, rv.rating), rv.comment_booking, rv.comment_onsite, new Date(Date.UTC(yy, mm - 1, dd, 12))]);
    }
    for (const d of demoBookingIds.filter((x) => x.avis))
      await c.query(`INSERT INTO avis (contact_id, commande_id, auteur, note, observation_reservation, observation_place, created_at)
        SELECT contact_id, id, 'Karim Benali', 5, 'Réservation simple et rapide, confirmation reçue tout de suite.', 'Agent à l''heure à l''aéroport, voiture propre avec le plein. (exemple)', date_retour + interval '1 day'
        FROM commandes WHERE id = $1`, [d.id]);

    console.log('Occasions, messages, transferts…');
    const occ = await c.query(`SELECT v.id, v.annee, v.kilometrage, m.id AS modele_id, m.nom_affiche, m.caution FROM vehicules v JOIN modeles m ON m.id = v.modele_id
      WHERE m.site = 'dz' AND v.annee <= 2024 ORDER BY v.kilometrage DESC LIMIT 6`);
    for (const v of occ.rows)
      await c.query('INSERT INTO occasions (titre, description, modele_id, annee, kilometrage, prix) VALUES ($1,$2,$3,$4,$5,$6)',
        [`${v.nom_affiche} ${v.annee}`, `Véhicule récent à prix cassé, entretenu par notre réseau de techniciens. Carnet d'entretien à jour. (annonce exemple)`, v.modele_id, v.annee, v.kilometrage,
         round2(int(8, 22) * 1000 + Number(v.caution) * 2)]);

    const msgs = [
      ['Bonjour, est-il possible de récupérer la voiture au port d\'Alger au lieu de l\'aéroport ?', false],
      ['Je souhaite modifier les dates de ma réservation, pouvez-vous me rappeler ?', false],
      ['Avez-vous des sièges bébé disponibles à Constantine en août ?', true],
      ['Merci pour la location, tout s\'est très bien passé. À l\'année prochaine !', true],
      ['Bonjour, je voudrais un devis pour un minibus 9 places pour 3 semaines en juillet.', false],
      ['Mon chèque de caution a-t-il bien été restitué ? Réservation du mois dernier.', true],
      ['Est-ce que l\'option Tunisie est disponible pour un départ d\'Annaba ?', false],
      ['Je n\'arrive pas à télécharger mon contrat depuis mon compte client.', true],
      ['Bonjour, vous livrez à Tizi Ouzou ? Merci de me donner le tarif.', false],
      ['Pouvez-vous me confirmer le point de rendez-vous à l\'aéroport d\'Oran ?', true],
    ] as const;
    for (const [i, [m, lu]] of msgs.entries()) {
      const ct = pick(contacts);
      await c.query('INSERT INTO messages_contact (email, nom, prenom, tel, message, lu, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7)',
        [`${slugify(ct.prenom)}.${slugify(ct.nom)}@example.com`, ct.nom, ct.prenom, '+33 6 00 00 00 00', m, lu, new Date(NOW.getTime() - (i * 2 + 1) * DAY - int(0, 20) * 3600_000)]);
    }
    const aeroports = villes.filter((v) => ['Alger', 'Oran', 'Constantine', 'Bejaia', 'Setif', 'Tlemcen'].includes(v.nom));
    const dests = ['Hôtel Sheraton Club des Pins', 'Hôtel Le Méridien Oran', 'Centre-ville de Bejaia', 'Tizi Ouzou', 'Hôtel Marriott Constantine', 'Sétif centre', 'Tipaza', 'Boumerdès'];
    for (let i = 0; i < 9; i++) {
      const ct = pick(contacts);
      await c.query(`INSERT INTO demandes_transfert (nom, email, tel, aeroport_id, destination, date_arrivee, passagers, num_vol, message, statut, created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
        [`${ct.prenom} ${ct.nom}`, `${slugify(ct.prenom)}.${slugify(ct.nom)}@example.com`, '+33 6 00 00 00 00', pick(aeroports).id, dests[i % dests.length],
         atHour(new Date(NOW.getTime() + int(3, 60) * DAY), int(6, 22)), int(1, 6), `AH${int(1000, 9999)}`, chance(0.5) ? 'Nous avons 4 grosses valises.' : null,
         pick(['nouvelle', 'nouvelle', 'devis_envoye', 'confirmee', 'annulee']), new Date(NOW.getTime() - int(0, 20) * DAY)]);
    }

    const admin = (await c.query(`SELECT id FROM contacts WHERE role = 10`)).rows[0].id;
    const sample = (await c.query(`SELECT id, reference FROM commandes ORDER BY random() LIMIT 6`)).rows;
    for (const [i, s] of sample.entries())
      await c.query(`INSERT INTO audit_log (admin_id, action, table_name, record_id, details, created_at) VALUES ($1,$2,'commandes',$3,$4,$5)`,
        [admin, pick(['modification', 'paiement']), s.id, JSON.stringify({ note: 'Action exemple' }), new Date(NOW.getTime() - (i + 1) * 3 * DAY)]);

    await c.query('COMMIT');
    const stats = (await c.query(`SELECT (SELECT count(*) FROM modeles) AS modeles, (SELECT count(*) FROM vehicules) AS vehicules, (SELECT count(*) FROM contacts) AS contacts,
      (SELECT count(*) FROM commandes) AS commandes, (SELECT count(*) FROM avis) AS avis, (SELECT count(*) FROM paiements) AS paiements, (SELECT count(*) FROM avoirs) AS avoirs`)).rows[0];
    console.log('OK', stats, `avoirs ${round2(avoirTotal)} €`);
    console.log('Admin: admin@taltour.com / Admin2026!   Client démo: client@taltour.com / Client2026!   Autres clients: <email> / Taltour2026!');
  } catch (e) {
    await c.query('ROLLBACK').catch(() => undefined);
    throw e;
  } finally {
    c.release();
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Printer } from 'lucide-react';
import { dateFr, dateLong, euro, heureFr, MODE_PAIEMENT } from '@/lib/format';
import type { Commande } from '@/lib/types';
import { useSite } from '@/components/providers';
import { Alert, Button, Loading } from '@/components/ui';
import { useApi } from '@/components/compte/hooks';
import { hasOption } from '@/components/compte/lib';
import { cautionText, kmText, priceLines, totals } from '@/components/compte/pricing';

const PRINT_CSS = `
@media print {
  @page { size: A4; margin: 12mm; }
  html, body { background: #fff !important; background-image: none !important; }
  header, footer, .fixed, nextjs-portal { display: none !important; }
  main { min-height: 0 !important; }
}`;

function Section({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`break-inside-avoid ${className}`}>
      <h2 className="mb-2 border-b border-slate-300 pb-1 font-display text-xs font-bold uppercase tracking-wider text-slate-900">{title}</h2>
      {children}
    </section>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex gap-2 py-0.5 text-[13px]">
      <dt className="w-36 shrink-0 text-slate-500">{k}</dt>
      <dd className="min-w-0 font-medium text-slate-900">{v || <span className="text-slate-400">Non renseigné</span>}</dd>
    </div>
  );
}

export default function ContratPage() {
  const { ref } = useParams<{ ref: string }>();
  const reference = decodeURIComponent(ref);
  const site = useSite();
  const { data: c, error } = useApi<Commande>(`/compte/commandes/${reference}`);

  if (error) return <div className="container-x py-10"><Alert tone="danger">{error.message}</Alert></div>;
  if (!c) return <Loading />;

  const t = site.tarification;
  const e = site.entreprise;
  const { total, paye, reste } = totals(c);
  const caution = cautionText(c, t.reserve_gold);
  const adresse = [c.adresse, [c.code_postal, c.commune].filter(Boolean).join(' '), c.pays].filter(Boolean).join(', ');
  const vRetour = site.villes.find((v) => v.id === c.ville_retour_id);

  return (
    <div className="container-x py-8 print:max-w-none print:p-0">
      <style>{PRINT_CSS}</style>
      <div className="mb-6 flex flex-col gap-4 print:hidden sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link href={`/mon-compte/reservations/${c.reference}`} className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-white"><ArrowLeft className="h-4 w-4" /> Retour à la réservation</Link>
          <p className="mt-2 text-sm text-soft">Imprimez votre contrat en double exemplaire et présentez-le à notre agent au départ.</p>
        </div>
        <Button onClick={() => window.print()}><Printer className="h-4 w-4" /> Imprimer / Enregistrer en PDF</Button>
      </div>
      {c.statut === 'annulee' && <Alert tone="danger" className="mb-6 print:hidden">Cette réservation est annulée : ce contrat n’est plus valable.</Alert>}

      <article className="mx-auto max-w-[210mm] rounded-2xl bg-white p-5 text-slate-800 shadow-card sm:p-10 print:max-w-none print:rounded-none print:p-0 print:shadow-none">
        <div className="flex flex-col gap-4 border-b-2 border-slate-900 pb-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="font-display text-2xl font-extrabold tracking-tight text-slate-900">{e.nom}<span className="text-[#FF6B1A]">.</span></div>
            <div className="mt-1 text-xs leading-relaxed text-slate-600">
              {e.adresse_cheque.slice(1).map((l) => <div key={l}>{l}</div>)}
              {site.hotline && <div>Hotline : {site.hotline}</div>}
              {e.hotline_contact.length > 0 && <div>Contact : {e.hotline_contact.join(' / ')}</div>}
              {e.panne && <div>Assistance panne : {e.panne}</div>}
            </div>
          </div>
          <div className="sm:text-right">
            <h1 className="font-display text-xl font-extrabold uppercase tracking-wide text-slate-900">Contrat de location</h1>
            <div className="mt-1 text-sm text-slate-600">Référence <span className="font-mono font-bold text-slate-900">{c.reference}</span></div>
            <div className="text-xs text-slate-500">Réservation du {dateFr(c.created_at)} · édité le {dateFr(new Date())}</div>
          </div>
        </div>

        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <Section title="Locataire">
            <dl>
              <Row k="Nom" v={c.nom} />
              <Row k="Prénom" v={c.prenom} />
              {c.societe && <Row k="Société" v={c.societe} />}
              <Row k="Date de naissance" v={c.date_naissance && dateFr(c.date_naissance)} />
              <Row k="Adresse" v={adresse} />
              <Row k="Tél." v={c.tel} />
              <Row k="Email" v={<span className="break-all">{c.email}</span>} />
              <Row k="Permis n°" v={c.num_permis} />
              <Row k="Permis délivré le" v={c.date_permis && dateFr(c.date_permis)} />
            </dl>
          </Section>
          <Section title="Véhicule">
            <dl>
              <Row k="Modèle" v={c.modele_nom} />
              <Row k="Immatriculation" v={c.immatriculation ? <span className="font-mono">{c.immatriculation}</span> : 'Attribuée au départ'} />
              <Row k="Catégorie" v={c.categorie && `Cat. ${c.categorie}`} />
              <Row k="Carburant" v={<span className="capitalize">{c.carburant}</span>} />
              <Row k="Boîte" v={<span className="capitalize">{c.boite}</span>} />
              {c.vehicule_couleur && <Row k="Couleur" v={c.vehicule_couleur} />}
              <Row k="Kilométrage" v={kmText(c, t.km_inclus_jour)} />
            </dl>
          </Section>
        </div>

        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <Section title="Départ">
            <dl>
              <Row k="Ville" v={c.ville_depart} />
              <Row k="Date et heure" v={`${dateLong(c.date_depart)} à ${heureFr(c.date_depart)}`} />
              <Row k="Point de rendez-vous" v={c.point_rdv} />
              {c.agent_nom && <Row k="Agent" v={`${c.agent_nom}${c.agent_tel ? `, ${c.agent_tel}` : ''}`} />}
              {c.num_vol && <Row k="Num. vol" v={c.num_vol} />}
            </dl>
          </Section>
          <Section title="Retour">
            <dl>
              <Row k="Ville" v={c.ville_retour} />
              <Row k="Date et heure" v={`${dateLong(c.date_retour)} à ${heureFr(c.date_retour)}`} />
              <Row k="Point de rendez-vous" v={vRetour?.point_rdv} />
              <Row k="Durée" v={`${c.jours} jour${c.jours > 1 ? 's' : ''}`} />
            </dl>
          </Section>
        </div>

        <Section title="Tarification" className="mt-6">
          <table className="w-full text-[13px]">
            <tbody>
              {priceLines(c).map((l) => (
                <tr key={l.label} className="border-b border-slate-100">
                  <td className="py-1.5 pr-3">
                    <div className="text-slate-900">{l.label}</div>
                    {l.sub && <div className="text-[11px] text-slate-500">{l.sub}</div>}
                  </td>
                  <td className="whitespace-nowrap py-1.5 text-right font-medium text-slate-900">{euro(l.value)}</td>
                </tr>
              ))}
              <tr className="border-t-2 border-slate-900">
                <td className="pt-2 font-bold text-slate-900">Total TTC</td>
                <td className="pt-2 text-right text-base font-bold text-slate-900">{euro(total)}</td>
              </tr>
              <tr><td className="text-slate-600">Déjà payé ({MODE_PAIEMENT[c.mode_paiement] ?? c.mode_paiement})</td><td className="text-right text-slate-900">{euro(paye)}</td></tr>
              <tr><td className="text-slate-600">Reste à payer</td><td className="text-right font-semibold text-slate-900">{euro(reste)}</td></tr>
            </tbody>
          </table>
          <p className="mt-2 text-[12px] text-slate-600">
            Options : {c.options.length ? c.options.map((o) => o.libelle).join(', ') : 'aucune'}.
          </p>
        </Section>

        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <Section title="Caution">
            <p className="text-[13px] text-slate-800">{caution.text}.</p>
            {!caution.gold && <p className="mt-1 text-[12px] text-slate-500">Le chèque de caution est restitué au retour du véhicule, sans encaissement en l’absence de dommage.</p>}
          </Section>
          <Section title="Conditions principales">
            <ul className="list-disc space-y-1 pl-4 text-[12px] leading-snug text-slate-700">
              <li>{t.km_inclus_jour} km/jour inclus{hasOption(c, 'km_illimite') ? ' (option kilométrage illimité souscrite)' : ''}.</li>
              <li>Tolérance de {t.tolerance_heures}h au retour, au-delà une journée supplémentaire est facturée.</li>
              <li>Véhicule restitué propre et avec le plein de carburant.</li>
              <li>Circulation autorisée sur le territoire algérien uniquement.</li>
              <li>Annulation : {t.annulation_plus_48h_pct}% retenus plus de 48h avant le départ, {t.annulation_moins_48h_pct}% dans les 48h (sans retenue avec l’assurance annulation ou en avoir).</li>
            </ul>
          </Section>
        </div>

        <section className="mt-8 break-inside-avoid">
          <p className="text-[13px] text-slate-700">Fait en deux exemplaires, à ____________________, le ____ / ____ / ________</p>
          <div className="mt-4 grid grid-cols-2 gap-4">
            {['Le loueur', 'Le locataire'].map((s) => (
              <div key={s} className="flex h-32 flex-col rounded-lg border border-slate-400 p-3">
                <div className="text-xs font-bold uppercase tracking-wide text-slate-900">{s}</div>
                <div className="text-[11px] text-slate-500">Signature précédée de la mention « lu et approuvé »</div>
              </div>
            ))}
          </div>
        </section>
      </article>
    </div>
  );
}

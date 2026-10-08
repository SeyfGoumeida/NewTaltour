'use client';

import Link from 'next/link';
import useSWR from 'swr';
import { CalendarDays, CheckCircle2, Clock3, FileText, MapPin, Plane, UserRound } from 'lucide-react';
import { useAuth } from '@/components/providers';
import { Alert, Badge, LinkButton, Loading } from '@/components/ui';
import { api } from '@/lib/api';
import { dateHeure, euro, MODE_PAIEMENT, STATUT_COMMANDE } from '@/lib/format';
import type { Commande } from '@/lib/types';

export default function Confirmation({ params }: { params: { ref: string } }) {
  const { user, ready } = useAuth();
  const { data: c, error } = useSWR<Commande>(ready && user ? `/compte/commandes/${params.ref}` : null, (p: string) => api(p));
  const { data: instr } = useSWR<{ adresse_cheque: string[]; banque: { titulaire: string; iban: string; bic: string } }>('/reservations/instructions', (p: string) => api(p));

  if (!ready) return <Loading />;
  if (!user) return (
    <div className="container-x py-16">
      <Alert tone="info" title="Réservation enregistrée">Connectez-vous à votre compte client pour retrouver votre réservation {params.ref}. <Link href={`/mon-compte?redirect=/reservation/confirmation/${params.ref}`} className="link">Se connecter</Link></Alert>
    </div>
  );
  if (error) return <div className="container-x py-16"><Alert tone="danger">{(error as Error).message}</Alert></div>;
  if (!c) return <Loading />;

  const reste = Math.round((c.montant_total - c.montant_paye) * 100) / 100;
  const st = STATUT_COMMANDE[c.statut];

  return (
    <div className="container-x max-w-4xl pb-10 pt-12">
      <div className="text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-ok/15 text-ok"><CheckCircle2 className="h-9 w-9" /></span>
        <h1 className="mt-5 text-3xl font-extrabold sm:text-4xl">Réservation <span className="text-grad">enregistrée</span></h1>
        <p className="mt-3 text-soft">Référence <span className="font-semibold text-white">{c.reference}</span> · <Badge tone={st.tone}>{st.label}</Badge></p>
      </div>

      <div className="mt-8">
        {c.mode_paiement === 'cheque' && c.statut_paiement === 'non_paye' && (
          <Alert tone="warn" title="En attente de votre chèque">
            Votre réservation sera valide dès réception d&apos;un chèque de {euro(c.montant_total)}, libellé à l&apos;ordre de :
            <div className="mt-2 font-medium text-white">{instr?.adresse_cheque.map((l) => <div key={l}>{l}</div>)}</div>
          </Alert>
        )}
        {c.mode_paiement === 'virement' && c.statut_paiement === 'non_paye' && (
          <Alert tone="warn" title="En attente de votre virement">
            Votre réservation sera valide dès réception d&apos;un virement bancaire de {euro(c.montant_total)} sur le compte de Taltour
            {instr && <div className="mt-2 grid gap-0.5 font-medium text-white"><div>Titulaire : {instr.banque.titulaire}</div><div>IBAN : {instr.banque.iban}</div><div>BIC : {instr.banque.bic}</div><div className="text-xs font-normal opacity-80">Référence à indiquer : {c.reference}</div></div>}
          </Alert>
        )}
        {c.mode_paiement === 'deux_fois' && (
          <Alert tone="ok" title={`Acompte de ${euro(c.montant_paye)} payé par PayPal`}>Votre réservation sera valide dès réception du paiement de {euro(reste)} en espèces à votre arrivée.</Alert>
        )}
        {(c.mode_paiement === 'cb' || c.mode_paiement === 'paypal') && (
          <Alert tone="ok" title={`Paiement de ${euro(c.montant_paye)} accepté (${MODE_PAIEMENT[c.mode_paiement]})`}>Votre réservation est confirmée. Vous pouvez télécharger votre contrat de location depuis votre compte client.</Alert>
        )}
      </div>

      <div className="glass mt-6 grid gap-6 p-6 sm:grid-cols-[180px_1fr]">
        <div className="self-start overflow-hidden rounded-xl bg-white">{c.modele_image && <img src={c.modele_image} alt={c.modele_nom} className="aspect-[4/3] w-full object-cover" />}</div>
        <div className="grid gap-3 text-sm">
          <h2 className="text-lg font-bold">{c.modele_nom}</h2>
          <div className="flex gap-3"><MapPin className="h-4 w-4 shrink-0 text-brand-cyan" /><span><span className="font-medium text-white">{c.ville_depart}</span> → <span className="font-medium text-white">{c.ville_retour}</span></span></div>
          <div className="flex gap-3"><CalendarDays className="h-4 w-4 shrink-0 text-brand-cyan" /><span>Du {dateHeure(c.date_depart)} au {dateHeure(c.date_retour)} ({c.jours} jours)</span></div>
          {c.point_rdv && <div className="flex gap-3"><Plane className="h-4 w-4 shrink-0 text-brand-cyan" /><span>Point de rendez-vous : {c.point_rdv}</span></div>}
          {c.agent_tel && <div className="flex gap-3"><UserRound className="h-4 w-4 shrink-0 text-brand-cyan" /><span>Agent {c.ville_depart} : {c.agent_tel}{c.agent_nom ? ` [${c.agent_nom}]` : ''}</span></div>}
          <div className="flex gap-3"><Clock3 className="h-4 w-4 shrink-0 text-brand-cyan" /><span>Une heure de tolérance est accordée pour les retards à la livraison ou à la restitution.</span></div>
          <div className="mt-2 flex flex-wrap items-baseline justify-between gap-2 border-t border-line pt-3">
            <span className="text-muted">Total TTC</span>
            <span className="font-display text-2xl font-bold text-accent">{euro(c.montant_total)}</span>
          </div>
          <div className="text-xs text-muted">Caution : {c.caution > 0 ? euro(c.caution) : 'aucune (Assurance Gold)'} · 250 km / jour inclus</div>
        </div>
      </div>

      <div className="glass mt-6 p-6 text-sm text-soft">
        <h3 className="mb-3 text-base font-semibold">Quel documents remettre à la prise du véhicule ?</h3>
        Votre contrat téléchargé via votre compte client imprimé en double examplaires , une copie de votre permis de conduire , un chèque de caution si vous n&apos;avez pas l&apos;assurance gold .
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <LinkButton href={`/mon-compte/reservations/${c.reference}`}>Voir ma réservation</LinkButton>
        <LinkButton href={`/mon-compte/reservations/${c.reference}/contrat`} variant="secondary"><FileText className="h-4 w-4" /> Télécharger mon contrat</LinkButton>
        <LinkButton href="/" variant="ghost">Retour à l&apos;accueil</LinkButton>
      </div>
    </div>
  );
}

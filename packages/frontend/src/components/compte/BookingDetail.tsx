'use client';

import Link from 'next/link';
import { useState } from 'react';
import clsx from 'clsx';
import { useSWRConfig } from 'swr';
import { ArrowLeft, ArrowRight, Banknote, CalendarDays, Car, CreditCard, FileText, Gauge, IdCard, Info, MapPin, Phone, Plane, Printer, Repeat, ShieldCheck, Shirt, UserRound, XCircle } from 'lucide-react';
import { dateHeure, dateLong, euro, heureFr, MODE_PAIEMENT } from '@/lib/format';
import type { Commande, Ville } from '@/lib/types';
import { useSite } from '@/components/providers';
import { Alert, Badge, Button, Card, CardTitle, LinkButton, Loading } from '@/components/ui';
import CarSpecs from '@/components/CarSpecs';
import { CarThumb, StatusBadges } from './BookingCard';
import { CancelModal, ChangeModelModal, PayModal } from './Actions';
import { ReviewDisplay, ReviewForm } from './Review';
import Timeline from './Timeline';
import { useApi } from './hooks';
import { AGENT_TENUE, ALGER_RDV, hasOption, modifiable, n } from './lib';
import { cautionText, kmText, priceLines, totals } from './pricing';

type VilleAgent = Ville & { agent_nom?: string | null; agent_tel?: string | null };
type Flash = { tone: 'ok' | 'info'; text: string } | null;

function Leg({ title, ville, date, rdv, agent, tel, vol }: { title: string; ville: string; date: string; rdv: string | null; agent?: string | null; tel?: string | null; vol?: string | null }) {
  return (
    <div className="glass-soft p-4">
      <div className="text-xs font-medium uppercase tracking-wide text-muted">{title}</div>
      <div className="mt-1.5 flex items-center gap-2 text-lg font-semibold text-white"><MapPin className="h-4 w-4 text-brand-cyan" /> {ville}</div>
      <div className="mt-1 flex items-center gap-2 text-sm text-soft"><CalendarDays className="h-4 w-4 text-muted" /> {dateLong(date)} à {heureFr(date)}</div>
      {rdv && <div className="mt-3 text-sm"><span className="text-muted">Point de rendez-vous : </span><span className="text-white">{rdv}</span></div>}
      {(agent || tel) && (
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          {agent && <span className="inline-flex items-center gap-1.5 text-soft"><UserRound className="h-4 w-4 text-muted" /> {agent}</span>}
          {tel && <a href={`tel:${tel.replace(/[^+\d]/g, '')}`} className="link inline-flex items-center gap-1.5"><Phone className="h-4 w-4" /> {tel}</a>}
        </div>
      )}
      {vol && <div className="mt-2 inline-flex items-center gap-1.5 text-sm text-soft"><Plane className="h-4 w-4 text-muted" /> Vol {vol}</div>}
    </div>
  );
}

function PaymentInstructions({ c, montant }: { c: Commande; montant: number }) {
  const { data } = useApi<{ adresse_cheque: string[]; banque: { titulaire: string; iban: string; bic: string } }>('/reservations/instructions');
  if (!data) return <Loading />;
  if (c.mode_paiement === 'cheque')
    return (
      <Card className="border-warn/30">
        <CardTitle>Paiement par chèque</CardTitle>
        <p className="text-sm text-soft">Envoyez un chèque de <span className="font-semibold text-white">{euro(montant)}</span> à l’ordre de Taltour, en indiquant la référence <span className="font-mono text-white">{c.reference}</span> au dos, à l’adresse :</p>
        <address className="mt-3 rounded-xl border border-line bg-white/[0.03] p-4 text-sm not-italic text-white">
          {data.adresse_cheque.map((l) => <div key={l}>{l}</div>)}
        </address>
        <p className="mt-3 text-xs text-muted">Votre réservation est confirmée dès réception du chèque.</p>
      </Card>
    );
  return (
    <Card className="border-warn/30">
      <CardTitle>Paiement par virement</CardTitle>
      <p className="text-sm text-soft">Effectuez un virement de <span className="font-semibold text-white">{euro(montant)}</span> en indiquant la référence <span className="font-mono text-white">{c.reference}</span> dans le libellé.</p>
      <dl className="mt-3 grid gap-2 rounded-xl border border-line bg-white/[0.03] p-4 text-sm">
        <div className="flex justify-between gap-3"><dt className="text-muted">Titulaire</dt><dd className="text-right text-white">{data.banque.titulaire}</dd></div>
        <div className="flex justify-between gap-3"><dt className="text-muted">IBAN</dt><dd className="break-all text-right font-mono text-white">{data.banque.iban}</dd></div>
        <div className="flex justify-between gap-3"><dt className="text-muted">BIC</dt><dd className="text-right font-mono text-white">{data.banque.bic}</dd></div>
      </dl>
      <p className="mt-3 text-xs text-muted">Votre réservation est confirmée dès réception du virement.</p>
    </Card>
  );
}

export default function BookingDetail({ reference }: { reference: string }) {
  const site = useSite();
  const key = `/compte/commandes/${reference}`;
  const { data: c, error, mutate } = useApi<Commande>(key);
  const { mutate: globalMutate } = useSWRConfig();
  const [modal, setModal] = useState<'pay' | 'change' | 'cancel' | null>(null);
  const [flash, setFlash] = useState<Flash>(null);

  if (error) return (
    <div className="grid gap-4">
      <Link href="/mon-compte/reservations" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-white"><ArrowLeft className="h-4 w-4" /> Mes réservations</Link>
      <Alert tone="danger">{error.message}</Alert>
    </div>
  );
  if (!c) return <Loading />;

  const refreshAll = () => ['/compte/commandes', '/compte/resume', '/compte/avoirs'].forEach((k) => globalMutate(k));
  const updated = (next: Commande, text: string) => {
    mutate(next, { revalidate: false });
    refreshAll();
    setModal(null);
    setFlash({ tone: 'ok', text });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const villes = site.villes as VilleAgent[];
  const vRetour = villes.find((v) => v.id === c.ville_retour_id);
  const { total, paye, reste } = totals(c);
  const cancelled = c.statut === 'annulee';
  const canPay = site.paiement_en_ligne && reste > 0 && !cancelled && c.statut !== 'terminee';
  const canModify = modifiable(c);
  const gold = hasOption(c, 'gold');
  const caution = cautionText(c, site.tarification.reserve_gold);
  const lines = priceLines(c);
  const alger = c.ville_depart.toLowerCase() === 'alger';
  const unpaidManual = (c.mode_paiement === 'cheque' || c.mode_paiement === 'virement') && reste > 0 && !cancelled;

  return (
    <div className="grid gap-6">
      <Link href="/mon-compte/reservations" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-white"><ArrowLeft className="h-4 w-4" /> Mes réservations</Link>

      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm text-muted">{c.reference}</span>
            <StatusBadges statut={c.statut} statut_paiement={c.statut_paiement} />
          </div>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">{c.modele_nom}</h1>
          <p className="mt-1 text-sm text-muted">Réservée le {dateHeure(c.created_at)} · {MODE_PAIEMENT[c.mode_paiement] ?? c.mode_paiement}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canPay && <Button onClick={() => setModal('pay')}><CreditCard className="h-4 w-4" /> Payer le solde</Button>}
          {!cancelled && <LinkButton href={`/mon-compte/reservations/${c.reference}/contrat`} variant="blue"><FileText className="h-4 w-4" /> Télécharger mon contrat</LinkButton>}
          {canModify && <Button variant="secondary" onClick={() => setModal('change')}><Repeat className="h-4 w-4" /> Changer de modèle</Button>}
          {canModify && <Button variant="danger" onClick={() => setModal('cancel')}><XCircle className="h-4 w-4" /> Annuler</Button>}
        </div>
      </div>

      {flash && <Alert tone={flash.tone}>{flash.text}</Alert>}

      <Timeline c={c} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="grid content-start gap-6">
          <Card>
            <CardTitle>Itinéraire</CardTitle>
            <div className="grid gap-3 md:grid-cols-2">
              <Leg title="Départ" ville={c.ville_depart} date={c.date_depart} rdv={c.point_rdv} agent={c.agent_nom} tel={c.agent_tel} vol={c.num_vol} />
              <Leg title="Restitution" ville={c.ville_retour} date={c.date_retour} rdv={vRetour?.point_rdv ?? null} agent={vRetour?.agent_nom} tel={vRetour?.agent_tel} />
            </div>
            {!cancelled && <div className="mt-4 flex gap-3 rounded-xl border border-gold/25 bg-gold/[0.06] p-4 text-sm">
              <Shirt className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
              <div>
                <div className="font-semibold text-white">Comment reconnaître votre agent ?</div>
                <p className="mt-1 text-soft">{AGENT_TENUE} Descendez de l’avion, notre agent vous attend !</p>
                {alger && <p className="mt-2 text-soft">À Alger, rendez-vous à l’entrée du parking : <span className="rounded-md bg-white/10 px-1.5 py-0.5 font-mono font-semibold text-white">{ALGER_RDV}</span></p>}
              </div>
            </div>}
          </Card>

          <Card>
            <CardTitle>Véhicule</CardTitle>
            <div className="flex flex-col gap-4 sm:flex-row">
              <CarThumb src={c.modele_image} alt={c.modele_nom} className="aspect-[16/10] w-full sm:h-28 sm:w-44 sm:shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="text-lg font-semibold text-white">{c.modele_nom}</div>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {c.categorie && <Badge tone="info">Cat. {c.categorie}</Badge>}
                  {gold && <Badge tone="gold">Assurance Gold</Badge>}
                </div>
                <CarSpecs m={c} withFuel className="mt-3" />
                <dl className="mt-3 grid gap-1 text-sm sm:grid-cols-2">
                  <div><dt className="inline text-muted">Immatriculation : </dt><dd className="inline font-mono text-white">{c.immatriculation ?? 'communiquée avant le départ'}</dd></div>
                  {c.vehicule_couleur && <div><dt className="inline text-muted">Couleur : </dt><dd className="inline text-white">{c.vehicule_couleur}</dd></div>}
                  {c.vehicule_annee && <div><dt className="inline text-muted">Année : </dt><dd className="inline text-white">{c.vehicule_annee}</dd></div>}
                </dl>
              </div>
            </div>
          </Card>

          {!cancelled && (
            <Card>
              <CardTitle>Documents à présenter à l’agent</CardTitle>
              <ul className="grid gap-3 text-sm text-soft">
                <li className="flex items-start gap-3"><Printer className="mt-0.5 h-4 w-4 shrink-0 text-brand-cyan" /><span>Votre contrat téléchargé via votre compte client, imprimé en double exemplaire. <Link href={`/mon-compte/reservations/${c.reference}/contrat`} className="link">Télécharger le contrat</Link></span></li>
                <li className="flex items-start gap-3"><IdCard className="mt-0.5 h-4 w-4 shrink-0 text-brand-cyan" />Une copie de votre permis de conduire</li>
                {!gold && <li className="flex items-start gap-3"><Banknote className="mt-0.5 h-4 w-4 shrink-0 text-brand-cyan" />Le chèque de caution de {euro(c.caution)} (pas de caution avec l’Assurance Gold)</li>}
              </ul>
            </Card>
          )}

          {c.paiements.length > 0 && (
            <Card>
              <CardTitle>Historique des paiements</CardTitle>
              <ul className="divide-y divide-line">
                {c.paiements.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-white">{MODE_PAIEMENT[p.methode] ?? p.methode}{p.statut === 'rembourse' && ' · remboursement'}</div>
                      <div className="truncate text-xs text-muted">{dateHeure(p.created_at)}{p.reference && ` · ${p.reference}`}</div>
                    </div>
                    <span className={clsx('shrink-0 font-semibold', n(p.montant) < 0 ? 'text-ok' : 'text-white')}>{euro(p.montant)}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {c.statut === 'terminee' && (c.avis ? <ReviewDisplay avis={c.avis} /> : <ReviewForm c={c} onDone={() => { mutate(); refreshAll(); setFlash({ tone: 'ok', text: 'Merci pour votre avis !' }); }} />)}
        </div>

        <div className="grid content-start gap-6 lg:sticky lg:top-28 lg:self-start">
          <Card>
            <CardTitle>Détail du prix</CardTitle>
            <ul className="grid gap-3 text-sm">
              {lines.map((l) => (
                <li key={l.label} className="flex justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-soft">{l.label}</div>
                    {l.sub && <div className="text-xs text-muted">{l.sub}</div>}
                  </div>
                  <span className={clsx('shrink-0 font-medium', l.tone === 'discount' ? 'text-ok' : 'text-white')}>{euro(l.value)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 grid gap-2 border-t border-line pt-4 text-sm">
              <div className="flex justify-between"><span className="font-semibold text-white">Total</span><span className="font-display text-xl font-bold text-white">{euro(total)}</span></div>
              <div className="flex justify-between"><span className="text-muted">Payé</span><span className="text-white">{euro(paye)}</span></div>
              {cancelled ? (
                c.frais_annulation != null && n(c.frais_annulation) > 0 && <div className="flex justify-between"><span className="text-muted">Frais d’annulation retenus</span><span className="text-white">{euro(c.frais_annulation)}</span></div>
              ) : (
                <div className="flex justify-between"><span className="text-muted">Reste à payer</span><span className={clsx('font-semibold', reste > 0 ? 'text-accent' : 'text-ok')}>{euro(reste)}</span></div>
              )}
            </div>
            {canPay && <Button full className="mt-4" onClick={() => setModal('pay')}>Payer le solde</Button>}
            {c.mode_paiement === 'deux_fois' && reste > 0 && !cancelled && (
              <p className="mt-3 text-xs text-muted">Paiement en deux fois : le solde peut être réglé en espèces à la remise du véhicule, ou en ligne dès maintenant.</p>
            )}
          </Card>

          {unpaidManual && <PaymentInstructions c={c} montant={reste} />}

          <Card>
            <CardTitle>Caution et kilométrage</CardTitle>
            <ul className="grid gap-3 text-sm text-soft">
              <li className="flex items-start gap-3"><ShieldCheck className={clsx('mt-0.5 h-4 w-4 shrink-0', caution.gold ? 'text-gold' : 'text-brand-cyan')} />{caution.text}</li>
              <li className="flex items-start gap-3"><Gauge className="mt-0.5 h-4 w-4 shrink-0 text-brand-cyan" />{kmText(c, site.tarification.km_inclus_jour)}</li>
              <li className="flex items-start gap-3"><Car className="mt-0.5 h-4 w-4 shrink-0 text-brand-cyan" />Véhicule à restituer propre et avec le plein, {site.tarification.tolerance_heures}h de tolérance au retour</li>
            </ul>
          </Card>

          {cancelled && c.statut_paiement === 'avoir' && (
            <Alert tone="info" title="Montant converti en avoir">
              Le montant versé a été crédité sur votre compte. <Link href="/mon-compte/avoirs" className="font-semibold underline underline-offset-2">Voir mes avoirs</Link>
            </Alert>
          )}
          {canModify && (
            <p className="flex items-start gap-2 px-1 text-xs text-muted">
              <Info className="h-4 w-4 shrink-0" />
              Annulation : {site.tarification.annulation_plus_48h_pct}% retenus plus de 48h avant le départ, {site.tarification.annulation_moins_48h_pct}% dans les 48h, ou la totalité conservée en avoir.{hasOption(c, 'assurance_annulation') && ' Assurance annulation souscrite : aucune retenue.'}
            </p>
          )}
          <LinkButton href="/" variant="outline" full>Réserver un autre véhicule <ArrowRight className="h-4 w-4" /></LinkButton>
        </div>
      </div>

      <PayModal c={c} open={modal === 'pay'} onClose={() => setModal(null)} onDone={(next) => updated(next, `Paiement de ${euro(reste)} enregistré. Merci !`)} />
      <ChangeModelModal c={c} open={modal === 'change'} onClose={() => setModal(null)}
        onDone={(next) => updated(next, `Modèle changé : ${next.modele_nom}. Nouveau total ${euro(next.montant_total)}.`)} />
      <CancelModal c={c} open={modal === 'cancel'} onClose={() => setModal(null)}
        onDone={(r) => {
          mutate();
          refreshAll();
          setModal(null);
          setFlash({ tone: 'info', text: r.mode === 'avoir' && n(r.rembourse) > 0 ? `Réservation annulée. ${euro(r.rembourse)} crédités en avoir.` : n(r.rembourse) > 0 ? `Réservation annulée. ${euro(r.rembourse)} vous seront remboursés${n(r.retenue) > 0 ? ` (retenue de ${euro(r.retenue)})` : ''}.` : 'Réservation annulée.' });
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }} />
    </div>
  );
}


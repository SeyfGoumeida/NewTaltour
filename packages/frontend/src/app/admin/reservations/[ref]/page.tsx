'use client';

import clsx from 'clsx';
import Link from 'next/link';
import { useState } from 'react';
import { ArrowLeft, Ban, Car, CheckCircle2, CirclePlay, CreditCard, Flag, MapPin, Phone, Plane, Printer, Star, User } from 'lucide-react';
import { api } from '@/lib/api';
import { useSite } from '@/components/providers';
import { ConfirmModal, errMsg, KV, PageHead, PaiementBadge, StatutBadge, Thumb, useAdmin, useToast } from '@/components/admin/kit';
import { Alert, Badge, Button, Card, CardTitle, Field, Input, Loading, Modal, Select, Stars, Textarea } from '@/components/ui';
import { dateFr, dateHeure, dateLong, euro, heureFr, MODE_PAIEMENT, STATUT_COMMANDE } from '@/lib/format';
import type { Commande } from '@/lib/types';

type Detail = Commande & {
  vehicules_disponibles: { id: number; immatriculation: string; annee: number; ville: string }[];
  historique: { action: string; details: any; created_at: string; prenom: string | null; nom: string | null }[];
};

const METHODES = [
  { value: 'cb', label: 'Carte bancaire' },
  { value: 'paypal', label: 'PayPal' },
  { value: 'cheque', label: 'Chèque' },
  { value: 'virement', label: 'Virement bancaire' },
  { value: 'especes', label: 'Espèces' },
];

const NEXT: Record<string, { statut: string; label: string; icon: React.ReactNode; text: string } | undefined> = {
  en_attente: { statut: 'confirmee', label: 'Confirmer', icon: <CheckCircle2 className="h-4 w-4" />, text: 'La réservation passera au statut « Confirmée ».' },
  confirmee: { statut: 'en_cours', label: 'Marquer départ effectué', icon: <CirclePlay className="h-4 w-4" />, text: 'Le véhicule a été remis au client : la location passe « En cours ».' },
  en_cours: { statut: 'terminee', label: 'Marquer restituée', icon: <Flag className="h-4 w-4" />, text: 'Le véhicule a été restitué : la location passe « Terminée ».' },
};

function describe(h: Detail['historique'][number]) {
  const d = h.details || {};
  if (h.action === 'paiement') return `Paiement de ${euro(d.montant)} (${MODE_PAIEMENT[d.methode] || d.methode})${d.reference ? `, réf. ${d.reference}` : ''}`;
  if (h.action === 'annulation') return `Annulation (${d.mode === 'avoir' ? 'avoir' : 'remboursement'})${d.rembourse != null ? ` : ${euro(d.rembourse)} ${d.mode === 'avoir' ? 'en avoir' : 'remboursé'}` : ''}${d.retenue ? `, ${euro(d.retenue)} retenus` : ''}`;
  const parts: string[] = [];
  if (d.statut) parts.push(`statut → ${STATUT_COMMANDE[d.statut]?.label || d.statut}`);
  if (d.vehicule_id !== undefined) parts.push(d.vehicule_id ? `véhicule #${d.vehicule_id} affecté` : 'véhicule retiré');
  if (d.remarques !== undefined) parts.push('remarques modifiées');
  if (d.num_vol !== undefined) parts.push(`n° de vol : ${d.num_vol || '—'}`);
  if (d.note) parts.push(d.note);
  return parts.length ? parts.join(', ') : h.action;
}

function PriceRow({ label, value, minus, strong, muted }: { label: React.ReactNode; value: number; minus?: boolean; strong?: boolean; muted?: boolean }) {
  return (
    <div className={clsx('flex items-baseline justify-between gap-4 py-1.5 text-sm', strong && 'border-t border-line pt-3 text-base', muted && 'text-muted')}>
      <span className={strong ? 'font-semibold text-white' : 'text-soft'}>{label}</span>
      <span className={clsx('font-medium tabular-nums', strong ? 'font-display text-lg font-bold text-white' : minus ? 'text-ok' : 'text-white')}>{minus ? `- ${euro(value)}` : euro(value)}</span>
    </div>
  );
}

export default function ReservationDetail({ params }: { params: { ref: string } }) {
  const ref = decodeURIComponent(params.ref);
  const toast = useToast();
  const site = useSite();
  const { data: b, error, isLoading, mutate } = useAdmin<Detail>(`/admin/commandes/${encodeURIComponent(ref)}`);
  const [statusModal, setStatusModal] = useState(false);
  const [payModal, setPayModal] = useState(false);
  const [cancelModal, setCancelModal] = useState(false);
  const [pay, setPay] = useState({ montant: '', methode: 'cb', reference: '' });
  const [cancelMode, setCancelMode] = useState<'remboursement' | 'avoir'>('avoir');
  const [busy, setBusy] = useState<string | null>(null);
  const [modalErr, setModalErr] = useState<string | null>(null);
  const [notes, setNotes] = useState<{ remarques: string; num_vol: string } | null>(null);

  if (error) return <div className="space-y-4"><BackLink /><Alert tone="danger">{errMsg(error)}</Alert></div>;
  if (isLoading || !b) return <Loading />;

  const reste = Math.max(0, Number(b.montant_total) - Number(b.montant_paye));
  const next = NEXT[b.statut];
  const cancellable = b.statut === 'en_attente' || b.statut === 'confirmee';
  const editable = b.statut !== 'annulee';
  const n = notes ?? { remarques: b.remarques || '', num_vol: b.num_vol || '' };
  const notesDirty = n.remarques !== (b.remarques || '') || n.num_vol !== (b.num_vol || '');
  const refresh = (d: Detail | Commande) => mutate({ ...b, ...d } as Detail, { revalidate: true });

  const update = async (body: Record<string, unknown>, ok: string, tag: string) => {
    setBusy(tag);
    try {
      const d = await api<Commande>(`/admin/commandes/${encodeURIComponent(ref)}`, { method: 'PUT', body });
      await refresh(d);
      toast(ok);
      return true;
    } catch (e) {
      toast(errMsg(e), 'danger');
      return false;
    } finally {
      setBusy(null);
    }
  };

  const submitPay = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy('pay');
    setModalErr(null);
    try {
      const d = await api<Commande>(`/admin/commandes/${encodeURIComponent(ref)}/paiement`, { body: { montant: Number(pay.montant), methode: pay.methode, reference: pay.reference.trim() || null } });
      await refresh(d);
      toast(`Paiement de ${euro(pay.montant)} enregistré`);
      setPayModal(false);
    } catch (e) {
      setModalErr(errMsg(e));
    } finally {
      setBusy(null);
    }
  };

  const submitCancel = async () => {
    setBusy('cancel');
    setModalErr(null);
    try {
      const d = await api<Commande>(`/admin/commandes/${encodeURIComponent(ref)}/annuler`, { body: { mode: cancelMode } });
      await refresh(d);
      toast('Réservation annulée');
      setCancelModal(false);
    } catch (e) {
      setModalErr(errMsg(e));
    } finally {
      setBusy(null);
    }
  };

  const t = site?.tarification;

  return (
    <div>
      <div className="print:hidden">
        <PageHead
          back={<BackLink />}
          title={<span className="flex flex-wrap items-center gap-3"><span className="font-mono">{b.reference}</span><StatutBadge statut={b.statut} /><PaiementBadge statut={b.statut_paiement} /></span>}
          sub={<>Réservée le {dateHeure(b.created_at)} · {b.site === 'ma' ? 'Ouziad Marrakech Cars' : 'Taltour Algérie'} · {MODE_PAIEMENT[b.mode_paiement] || b.mode_paiement}</>}
          actions={<>
            <Button variant="secondary" size="sm" onClick={() => window.print()}><Printer className="h-4 w-4" /> Imprimer</Button>
            {editable && <Button variant="blue" size="sm" onClick={() => { setModalErr(null); setPay({ montant: reste ? String(reste) : '', methode: 'cb', reference: '' }); setPayModal(true); }}><CreditCard className="h-4 w-4" /> Enregistrer un paiement</Button>}
            {next && <Button size="sm" onClick={() => setStatusModal(true)}>{next.icon} {next.label}</Button>}
            {cancellable && <Button variant="danger" size="sm" onClick={() => { setModalErr(null); setCancelModal(true); }}><Ban className="h-4 w-4" /> Annuler</Button>}
          </>}
        />

        {b.statut === 'annulee' && (
          <Alert tone="danger" className="mb-6" title={`Réservation annulée le ${b.annulee_at ? dateHeure(b.annulee_at) : '—'}`}>
            {b.frais_annulation ? `Frais d'annulation retenus : ${euro(b.frais_annulation)}.` : 'Aucun frais retenu.'} Statut du paiement : {b.statut_paiement === 'avoir' ? 'converti en avoir' : b.statut_paiement === 'rembourse' ? 'remboursé' : 'non payé'}.
          </Alert>
        )}
        {editable && !b.vehicule_id && <Alert tone="warn" className="mb-6">Aucun véhicule n&apos;est encore affecté à cette réservation.</Alert>}

        <div className="grid gap-6 xl:grid-cols-3">
          <div className="space-y-6 xl:col-span-2">
            <Card>
              <CardTitle>Itinéraire</CardTitle>
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  { k: 'Départ', ville: b.ville_depart, date: b.date_depart, extra: b.point_rdv },
                  { k: 'Retour', ville: b.ville_retour, date: b.date_retour, extra: b.ville_retour !== b.ville_depart ? 'Aller simple' : null },
                ].map((s) => (
                  <div key={s.k} className="glass-soft p-4">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-muted">{s.k}</div>
                    <div className="mt-1 flex items-center gap-2 text-lg font-semibold text-white"><MapPin className="h-4 w-4 text-accent" />{s.ville}</div>
                    <div className="mt-0.5 text-sm text-soft"><span className="capitalize">{dateLong(s.date)}</span> à {heureFr(s.date)}</div>
                    {s.extra && <div className="mt-2 text-xs text-muted">{s.extra}</div>}
                  </div>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                <span className="chip">{b.jours} jour{b.jours > 1 ? 's' : ''} (forfait {b.forfait_jours} j)</span>
                {b.num_vol && <span className="chip"><Plane className="h-3 w-3" /> Vol {b.num_vol}</span>}
                {b.agent_nom && <span className="chip"><User className="h-3 w-3" /> Agent : {b.agent_nom}</span>}
                {b.agent_tel && <a href={`tel:${b.agent_tel}`} className="chip hover:text-white"><Phone className="h-3 w-3" /> {b.agent_tel}</a>}
              </div>
            </Card>

            <Card>
              <CardTitle>Véhicule</CardTitle>
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                <Thumb src={b.modele_image} className="h-24 w-40" />
                <div className="min-w-0 flex-1">
                  <div className="text-lg font-semibold text-white">{b.modele_nom}</div>
                  <div className="mt-1 flex flex-wrap gap-1.5 text-xs">
                    {b.categorie && <span className="chip">Catégorie {b.categorie}</span>}
                    <span className="chip capitalize">{b.carburant}</span>
                    <span className="chip capitalize">{b.boite}</span>
                    {b.places && <span className="chip">{b.places} places</span>}
                  </div>
                  <div className="mt-2 text-sm text-soft">
                    {b.immatriculation ? <><Car className="mr-1 inline h-4 w-4 text-brand-cyan" /><span className="font-mono text-white">{b.immatriculation}</span> · {b.vehicule_annee}{b.vehicule_couleur ? ` · ${b.vehicule_couleur}` : ''}</> : <span className="text-warn">Non affecté</span>}
                  </div>
                </div>
                {editable && (
                  <div className="w-full sm:w-64">
                    <span className="label">Affecter un véhicule</span>
                    <Select value={b.vehicule_id ?? ''} disabled={busy === 'veh'}
                      onChange={(e) => update({ vehicule_id: e.target.value ? Number(e.target.value) : null }, e.target.value ? 'Véhicule affecté' : 'Véhicule retiré', 'veh')}>
                      <option value="">Aucun véhicule</option>
                      {b.vehicules_disponibles.map((v) => <option key={v.id} value={v.id}>{v.immatriculation} · {v.ville} · {v.annee}</option>)}
                    </Select>
                    <span className="mt-1 block text-[11px] text-muted">{b.vehicules_disponibles.length} véhicule(s) de ce modèle libre(s) sur la période</span>
                  </div>
                )}
              </div>
            </Card>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardTitle>Détail du prix</CardTitle>
                <div className="mb-2 text-xs text-muted">
                  Forfait {b.forfait_jours} j · {euro(b.prix_jour)} / jour
                  {Number(b.coefficient_saison) !== 1 && <> · saison × {Number(b.coefficient_saison).toFixed(2)}</>}
                  {b.remise_age_pct > 0 && <> · remise âge du véhicule {b.remise_age_pct} %</>}
                </div>
                <PriceRow label={`Location (${b.jours} j)`} value={b.montant_location} />
                {Number(b.frais_aller_simple) > 0 && <PriceRow label="Frais d'aller simple" value={b.frais_aller_simple} />}
                {Number(b.frais_rapatriement) > 0 && <PriceRow label="Frais de rapatriement" value={b.frais_rapatriement} />}
                {b.options.map((o) => <PriceRow key={o.option_id} label={o.libelle} value={o.montant} />)}
                {Number(b.remise_fidelite) > 0 && <PriceRow label="Remise fidélité" value={b.remise_fidelite} minus />}
                {Number(b.remise_promo) > 0 && <PriceRow label={<>Code promo <span className="font-mono text-accent">{b.code_promo}</span></>} value={b.remise_promo} minus />}
                {Number(b.avoir_utilise) > 0 && <PriceRow label="Avoir utilisé" value={b.avoir_utilise} minus />}
                <PriceRow label="Total" value={b.montant_total} strong />
                <div className="mt-3 flex items-center justify-between rounded-xl bg-white/[0.03] px-3 py-2 text-sm">
                  <span className="text-muted">Caution</span>
                  <span className="font-semibold text-white">{Number(b.caution) > 0 ? euro(b.caution) : 'Aucune (assurance Gold)'} {b.caution_doublee && <Badge tone="warn" className="ml-1">Doublée</Badge>}</span>
                </div>
              </Card>

              <Card>
                <CardTitle action={<span className="text-xs text-muted">{MODE_PAIEMENT[b.mode_paiement]}</span>}>Paiements</CardTitle>
                <div className="mb-4 grid grid-cols-2 gap-3">
                  <div className="glass-soft p-3"><div className="text-[11px] text-muted">Encaissé</div><div className="font-display text-lg font-bold text-ok">{euro(b.montant_paye)}</div></div>
                  <div className="glass-soft p-3"><div className="text-[11px] text-muted">Reste à payer</div><div className={clsx('font-display text-lg font-bold', reste > 0 && b.statut !== 'annulee' ? 'text-warn' : 'text-white')}>{euro(reste)}</div></div>
                </div>
                {b.paiements.length ? (
                  <ul className="divide-y divide-line/60">
                    {b.paiements.map((p) => (
                      <li key={p.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                        <div className="min-w-0">
                          <div className="text-white">{MODE_PAIEMENT[p.methode] || p.methode}</div>
                          <div className="truncate text-xs text-muted">{dateHeure(p.created_at)}{p.reference ? ` · ${p.reference}` : ''}</div>
                        </div>
                        <div className="text-right">
                          <div className={clsx('font-semibold tabular-nums', Number(p.montant) < 0 ? 'text-danger' : 'text-white')}>{euro(p.montant)}</div>
                          <Badge tone={p.statut === 'valide' ? 'ok' : p.statut === 'rembourse' ? 'muted' : p.statut === 'echoue' ? 'danger' : 'warn'}>{p.statut === 'valide' ? 'Validé' : p.statut === 'rembourse' ? 'Remboursement' : p.statut === 'echoue' ? 'Échoué' : 'En attente'}</Badge>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : <div className="py-6 text-center text-sm text-muted">Aucun paiement enregistré</div>}
              </Card>
            </div>

            <Card>
              <CardTitle>Historique</CardTitle>
              {b.historique.length ? (
                <ol className="relative space-y-4 border-l border-line pl-5">
                  {b.historique.map((h, i) => (
                    <li key={i} className="relative">
                      <span className="absolute -left-[25px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-ink-850 bg-brand-blue" />
                      <div className="text-sm text-white">{describe(h)}</div>
                      <div className="text-xs text-muted">{dateHeure(h.created_at)} · {h.prenom ? `${h.prenom} ${h.nom}` : 'Système'}</div>
                    </li>
                  ))}
                </ol>
              ) : <div className="text-sm text-muted">Aucune action administrateur enregistrée sur cette réservation.</div>}
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardTitle action={<Link href={`/admin/clients/${b.contact_id}`} className="text-xs font-medium text-brand-cyan hover:underline">Fiche client</Link>}>Client</CardTitle>
              <div className="mb-3 flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-blue/20 font-bold text-[#B9CCFF]">{(b.prenom?.[0] || '') + (b.nom?.[0] || '')}</span>
                <div className="min-w-0">
                  <div className="truncate font-semibold text-white">{b.prenom} {b.nom}</div>
                  <a href={`mailto:${b.email}`} className="block truncate text-xs text-brand-cyan hover:underline">{b.email}</a>
                </div>
              </div>
              <div className="divide-y divide-line/60">
                <KV label="Téléphone">{b.tel ? <a href={`tel:${b.tel}`} className="hover:text-brand-cyan">{b.tel}</a> : '—'}</KV>
                {b.societe && <KV label="Société">{b.societe}</KV>}
                <KV label="Adresse">{[b.adresse, [b.code_postal, b.commune].filter(Boolean).join(' '), b.pays].filter(Boolean).join(', ') || '—'}</KV>
                <KV label="Date de naissance">{b.date_naissance ? dateFr(b.date_naissance) : '—'}</KV>
                <KV label="N° de permis">{b.num_permis || '—'}</KV>
                <KV label="Permis obtenu le">{b.date_permis ? dateFr(b.date_permis) : '—'}</KV>
              </div>
            </Card>

            <Card>
              <CardTitle>Informations complémentaires</CardTitle>
              <form className="space-y-4" onSubmit={async (e) => { e.preventDefault(); if (await update({ remarques: n.remarques.trim() || null, num_vol: n.num_vol.trim() || null }, 'Informations enregistrées', 'notes')) setNotes(null); }}>
                <Field label="Numéro de vol">
                  <Input value={n.num_vol} disabled={!editable} onChange={(e) => setNotes({ ...n, num_vol: e.target.value })} placeholder="ex. AH1017" maxLength={30} />
                </Field>
                <Field label="Remarques">
                  <Textarea value={n.remarques} disabled={!editable} onChange={(e) => setNotes({ ...n, remarques: e.target.value })} placeholder="Notes internes, demandes du client…" maxLength={2000} />
                </Field>
                {editable && <Button type="submit" size="sm" disabled={!notesDirty} loading={busy === 'notes'}>Enregistrer</Button>}
              </form>
            </Card>

            {b.avis && (
              <Card>
                <CardTitle action={<Stars value={b.avis.note} />}>Avis du client</CardTitle>
                {b.avis.observation_reservation && <p className="text-sm text-soft">{b.avis.observation_reservation}</p>}
                {b.avis.observation_place && <p className="mt-2 text-sm text-soft">{b.avis.observation_place}</p>}
                <div className="mt-2 flex items-center gap-1 text-xs text-muted"><Star className="h-3 w-3" /> {dateFr(b.avis.created_at)}</div>
              </Card>
            )}
          </div>
        </div>
      </div>

      <PrintSummary b={b} reste={reste} />

      <ConfirmModal open={statusModal} onClose={() => setStatusModal(false)} danger={false} title={next?.label} confirmLabel={next?.label || 'Confirmer'}
        onConfirm={async () => { if (next && !(await update({ statut: next.statut }, `Statut : ${STATUT_COMMANDE[next.statut].label}`, 'statut'))) throw new Error('Mise à jour impossible'); }}>
        {next?.text}
        {next?.statut === 'en_cours' && !b.vehicule_id && <Alert tone="warn" className="mt-3">Aucun véhicule n&apos;est affecté à cette réservation.</Alert>}
        {next?.statut === 'en_cours' && reste > 0 && <Alert tone="warn" className="mt-3">Il reste {euro(reste)} à encaisser.</Alert>}
      </ConfirmModal>

      <Modal open={payModal} onClose={() => setPayModal(false)} title="Enregistrer un paiement"
        footer={<><Button variant="ghost" onClick={() => setPayModal(false)}>Annuler</Button><Button type="submit" form="pay-form" loading={busy === 'pay'}>Enregistrer</Button></>}>
        <form id="pay-form" onSubmit={submitPay} className="space-y-4">
          {modalErr && <Alert tone="danger">{modalErr}</Alert>}
          <div className="flex justify-between rounded-xl bg-white/[0.03] px-4 py-3 text-sm"><span className="text-muted">Reste à payer</span><span className="font-semibold text-white">{euro(reste)}</span></div>
          <Field label="Montant (€)" required><Input type="number" step="0.01" min="0.01" required value={pay.montant} onChange={(e) => setPay({ ...pay, montant: e.target.value })} /></Field>
          <Field label="Moyen de paiement" required>
            <Select value={pay.methode} onChange={(e) => setPay({ ...pay, methode: e.target.value })}>{METHODES.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}</Select>
          </Field>
          <Field label="Référence" hint="N° de chèque, référence de virement ou de transaction"><Input value={pay.reference} maxLength={100} onChange={(e) => setPay({ ...pay, reference: e.target.value })} /></Field>
          {b.statut === 'en_attente' && <p className="text-xs text-muted">La réservation sera automatiquement confirmée.</p>}
        </form>
      </Modal>

      <Modal open={cancelModal} onClose={() => setCancelModal(false)} title={`Annuler la réservation ${b.reference}`}
        footer={<><Button variant="ghost" onClick={() => setCancelModal(false)}>Retour</Button><Button variant="danger" loading={busy === 'cancel'} onClick={submitCancel}>Confirmer l&apos;annulation</Button></>}>
        <div className="space-y-4 text-sm">
          {modalErr && <Alert tone="danger">{modalErr}</Alert>}
          <p className="text-soft">Montant déjà encaissé : <strong className="text-white">{euro(b.montant_paye)}</strong>. Que faire de cette somme ?</p>
          {(['avoir', 'remboursement'] as const).map((m) => (
            <label key={m} className={clsx('flex cursor-pointer gap-3 rounded-xl border p-4 transition', cancelMode === m ? 'border-brand-blue bg-brand-blue/10' : 'border-line hover:border-white/20')}>
              <input type="radio" name="mode" className="mt-1 accent-[#2F6BFF]" checked={cancelMode === m} onChange={() => setCancelMode(m)} />
              <span>
                <span className="block font-semibold text-white">{m === 'avoir' ? 'Convertir en avoir' : 'Rembourser le client'}</span>
                <span className="mt-0.5 block text-xs text-muted">
                  {m === 'avoir' ? "La totalité du montant payé est créditée sur le compte du client, utilisable sur une prochaine réservation."
                    : `Remboursement selon les conditions d'annulation${t ? ` : ${t.annulation_plus_48h_pct} % retenus à plus de 48 h du départ, ${t.annulation_moins_48h_pct} % à moins de 48 h` : ''} (sauf assurance annulation).`}
                </span>
              </span>
            </label>
          ))}
          <p className="text-xs text-danger">L&apos;annulation est définitive.</p>
        </div>
      </Modal>
    </div>
  );
}

function BackLink() {
  return <Link href="/admin/reservations" className="inline-flex items-center gap-1.5 text-xs font-medium text-muted hover:text-white"><ArrowLeft className="h-3.5 w-3.5" /> Réservations</Link>;
}

function PrintSummary({ b, reste }: { b: Detail; reste: number }) {
  const row = (l: string, v: React.ReactNode) => (
    <tr><td className="border border-gray-300 px-2 py-1 text-gray-600">{l}</td><td className="border border-gray-300 px-2 py-1 font-medium">{v}</td></tr>
  );
  return (
    <div className="hidden text-[12px] text-black print:block">
      <div className="mb-4 flex items-start justify-between border-b-2 border-black pb-3">
        <div>
          <div className="text-xl font-bold">{b.site === 'ma' ? 'Ouziad Marrakech Cars' : 'Taltour'}</div>
          <div>Récapitulatif de réservation</div>
        </div>
        <div className="text-right">
          <div className="font-mono text-lg font-bold">{b.reference}</div>
          <div>Édité le {dateFr(new Date())}</div>
          <div>{STATUT_COMMANDE[b.statut]?.label}</div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <table className="w-full border-collapse">
          <tbody>
            <tr><td colSpan={2} className="border border-gray-300 bg-gray-100 px-2 py-1 font-bold">Client</td></tr>
            {row('Nom', `${b.prenom} ${b.nom}`)}
            {row('Email', b.email)}
            {row('Téléphone', b.tel || '—')}
            {row('Adresse', [b.adresse, b.code_postal, b.commune, b.pays].filter(Boolean).join(' ') || '—')}
            {row('Né(e) le', b.date_naissance ? dateFr(b.date_naissance) : '—')}
            {row('Permis', `${b.num_permis || '—'}${b.date_permis ? ` du ${dateFr(b.date_permis)}` : ''}`)}
          </tbody>
        </table>
        <table className="w-full border-collapse">
          <tbody>
            <tr><td colSpan={2} className="border border-gray-300 bg-gray-100 px-2 py-1 font-bold">Location</td></tr>
            {row('Véhicule', b.modele_nom)}
            {row('Immatriculation', b.immatriculation || 'À affecter')}
            {row('Départ', `${b.ville_depart}, ${dateHeure(b.date_depart)}`)}
            {row('Retour', `${b.ville_retour}, ${dateHeure(b.date_retour)}`)}
            {row('Durée', `${b.jours} jour(s)`)}
            {row('Vol', b.num_vol || '—')}
          </tbody>
        </table>
      </div>
      <table className="mt-4 w-full border-collapse">
        <tbody>
          <tr><td colSpan={2} className="border border-gray-300 bg-gray-100 px-2 py-1 font-bold">Tarif</td></tr>
          {row(`Location (forfait ${b.forfait_jours} j, ${euro(b.prix_jour)}/j)`, euro(b.montant_location))}
          {Number(b.frais_aller_simple) > 0 && row("Frais d'aller simple", euro(b.frais_aller_simple))}
          {Number(b.frais_rapatriement) > 0 && row('Frais de rapatriement', euro(b.frais_rapatriement))}
          {b.options.map((o) => <tr key={o.option_id}><td className="border border-gray-300 px-2 py-1 text-gray-600">{o.libelle}</td><td className="border border-gray-300 px-2 py-1 font-medium">{euro(o.montant)}</td></tr>)}
          {Number(b.remise_fidelite) > 0 && row('Remise fidélité', `- ${euro(b.remise_fidelite)}`)}
          {Number(b.remise_promo) > 0 && row(`Code promo ${b.code_promo}`, `- ${euro(b.remise_promo)}`)}
          {Number(b.avoir_utilise) > 0 && row('Avoir utilisé', `- ${euro(b.avoir_utilise)}`)}
          {row('Total', <strong>{euro(b.montant_total)}</strong>)}
          {row('Déjà payé', euro(b.montant_paye))}
          {row('Reste à payer', euro(reste))}
          {row('Caution', `${Number(b.caution) > 0 ? euro(b.caution) : 'Aucune'}${b.caution_doublee ? ' (doublée)' : ''}`)}
        </tbody>
      </table>
      {b.point_rdv && <p className="mt-3"><strong>Point de rendez-vous :</strong> {b.point_rdv}{b.agent_nom ? ` · Agent : ${b.agent_nom} ${b.agent_tel || ''}` : ''}</p>}
      {b.remarques && <p className="mt-2"><strong>Remarques :</strong> {b.remarques}</p>}
      <div className="mt-10 grid grid-cols-2 gap-8">
        <div className="border-t border-black pt-1">Signature du client</div>
        <div className="border-t border-black pt-1">Signature de l&apos;agent</div>
      </div>
    </div>
  );
}

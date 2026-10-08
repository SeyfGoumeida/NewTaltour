'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import { Car, Check, CreditCard, Undo2, Wallet } from 'lucide-react';
import { api } from '@/lib/api';
import { euro } from '@/lib/format';
import type { Commande, Modele } from '@/lib/types';
import { useSite } from '@/components/providers';
import { Alert, Button, Loading, Modal, Spinner, Tabs } from '@/components/ui';
import CarSpecs, { CATEGORY_FILTERS, matchCategory, type CategoryFilter } from '@/components/CarSpecs';
import { useApi } from './hooks';
import { n, reste, type AnnulationPreview, type DevisChangement } from './lib';

function Choice({ active, onClick, icon, title, children }: { active: boolean; onClick: () => void; icon: React.ReactNode; title: React.ReactNode; children?: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick}
      className={clsx('flex w-full items-start gap-3 rounded-xl border p-4 text-left outline-none transition focus-visible:ring-2 focus-visible:ring-brand-blue/40',
        active ? 'border-brand-blue bg-brand-blue/10 ring-2 ring-brand-blue/25' : 'border-line bg-white/[0.03] hover:border-white/25')}>
      <span className={clsx('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', active ? 'bg-brand-blue text-white' : 'bg-white/[0.06] text-soft')}>{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold text-white">{title}</span>
        {children && <span className="mt-1 block text-sm text-muted">{children}</span>}
      </span>
      <span className={clsx('mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border', active ? 'border-brand-blue bg-brand-blue text-white' : 'border-white/25')}>
        {active && <Check className="h-3 w-3" />}
      </span>
    </button>
  );
}

export function PayModal({ c, open, onClose, onDone }: { c: Commande; open: boolean; onClose: () => void; onDone: (c: Commande) => void }) {
  const [mode, setMode] = useState<'cb' | 'paypal'>('cb');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const montant = reste(c);

  const pay = async () => {
    setBusy(true);
    setError(null);
    try {
      onDone(await api<Commande>(`/compte/commandes/${c.reference}/payer`, { body: { mode } }));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Payer le solde"
      footer={<><Button variant="ghost" onClick={onClose}>Annuler</Button><Button onClick={pay} loading={busy}>Payer {euro(montant)}</Button></>}>
      <div className="grid gap-4">
        <div className="glass-soft flex items-center justify-between p-4">
          <span className="text-sm text-muted">Reste à payer</span>
          <span className="font-display text-2xl font-bold text-white">{euro(montant)}</span>
        </div>
        <div className="grid gap-2.5">
          <Choice active={mode === 'cb'} onClick={() => setMode('cb')} icon={<CreditCard className="h-5 w-5" />} title="Carte bancaire">Paiement sécurisé par carte bancaire</Choice>
          <Choice active={mode === 'paypal'} onClick={() => setMode('paypal')} icon={<Wallet className="h-5 w-5" />} title="PayPal">Payez avec votre compte PayPal</Choice>
        </div>
        <p className="text-xs text-muted">Paiement simulé : aucun débit réel n’est effectué sur cette version de démonstration.</p>
        {error && <Alert tone="danger">{error}</Alert>}
      </div>
    </Modal>
  );
}

export function ChangeModelModal({ c, open, onClose, onDone }: { c: Commande; open: boolean; onClose: () => void; onDone: (c: Commande) => void }) {
  const { data: modeles, error: listError } = useApi<Modele[]>(open ? '/modeles' : null);
  const [cat, setCat] = useState<CategoryFilter>('tous');
  const [selected, setSelected] = useState<Modele | null>(null);
  const [devis, setDevis] = useState<DevisChangement | null>(null);
  const [devisError, setDevisError] = useState<string | null>(null);
  const [loadingDevis, setLoadingDevis] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const top = useRef<HTMLDivElement>(null);
  const seq = useRef(0);

  useEffect(() => {
    if (!open) {
      setSelected(null);
      setDevis(null);
      setDevisError(null);
      setError(null);
    }
  }, [open]);

  const list = useMemo(() => (modeles ?? []).filter((m) => m.id !== c.modele_id && matchCategory(m, cat)), [modeles, c.modele_id, cat]);

  const choose = async (m: Modele) => {
    const id = ++seq.current;
    setSelected(m);
    setDevis(null);
    setDevisError(null);
    setError(null);
    setLoadingDevis(true);
    top.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    try {
      const d = await api<DevisChangement>(`/compte/commandes/${c.reference}/changer-modele/devis`, { body: { modele_id: m.id } });
      if (id === seq.current) setDevis(d);
    } catch (e) {
      if (id === seq.current) setDevisError((e as Error).message);
    } finally {
      if (id === seq.current) setLoadingDevis(false);
    }
  };

  const confirm = async () => {
    if (!selected) return;
    setBusy(true);
    setError(null);
    try {
      onDone(await api<Commande>(`/compte/commandes/${c.reference}/changer-modele`, { body: { modele_id: selected.id } }));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const paye = n(c.montant_paye);
  const credit = devis ? Math.max(0, Math.round((paye - devis.montant_total) * 100) / 100) : 0;
  const aPayer = devis ? Math.max(0, Math.round((devis.montant_total - paye) * 100) / 100) : 0;
  const canConfirm = !!devis && devis.erreurs.length === 0 && !loadingDevis;

  return (
    <Modal open={open} onClose={onClose} wide title="Changer de modèle"
      footer={<><Button variant="ghost" onClick={onClose}>Fermer</Button><Button onClick={confirm} loading={busy} disabled={!canConfirm}>Confirmer le changement</Button></>}>
      <div ref={top} className="grid gap-4">
        <p className="text-sm text-muted">
          Mêmes dates, mêmes villes et mêmes options : choisissez un autre modèle, le nouveau tarif est recalculé immédiatement. Modèle actuel : <span className="font-semibold text-white">{c.modele_nom}</span> ({euro(c.montant_total)}).
        </p>

        {selected && (
          <div className="sticky top-0 z-10 rounded-xl border border-brand-blue/30 bg-ink-850 p-4 shadow-card">
            <div className="flex items-center gap-3">
              <div className="h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-ink-700">{selected.image && <img src={selected.image} alt="" className="h-full w-full object-cover" />}</div>
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold text-white">{selected.nom_affiche}</div>
                <div className="text-xs text-muted">{selected.categorie ? `Cat. ${selected.categorie}` : ''} {selected.carburant}</div>
              </div>
              {loadingDevis && <Spinner />}
            </div>
            {devisError && <Alert tone="danger" className="mt-3">{devisError}</Alert>}
            {devis && (
              <div className="mt-3 grid gap-3">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="glass-soft p-2.5"><div className="text-[11px] text-muted">Ancien total</div><div className="text-sm font-semibold text-white">{euro(devis.ancien_total)}</div></div>
                  <div className="glass-soft p-2.5"><div className="text-[11px] text-muted">Nouveau total</div><div className="text-sm font-semibold text-white">{euro(devis.montant_total)}</div></div>
                  <div className="glass-soft p-2.5"><div className="text-[11px] text-muted">Différence</div>
                    <div className={clsx('text-sm font-bold', devis.difference > 0 ? 'text-accent' : devis.difference < 0 ? 'text-ok' : 'text-white')}>{devis.difference > 0 ? '+' : ''}{euro(devis.difference)}</div>
                  </div>
                </div>
                {devis.erreurs.length > 0 ? (
                  <Alert tone="danger" title="Ce modèle n’est pas accessible avec votre profil conducteur">{devis.erreurs.join(' ')}</Alert>
                ) : credit > 0 ? (
                  <Alert tone="ok">{euro(credit)} vous seront crédités en avoir, utilisables sur une prochaine réservation.</Alert>
                ) : aPayer > 0 ? (
                  <Alert tone="warn">Après le changement, il vous restera {euro(aPayer)} à payer.</Alert>
                ) : (
                  <Alert tone="info">Aucune différence à régler.</Alert>
                )}
              </div>
            )}
            {error && <Alert tone="danger" className="mt-3">{error}</Alert>}
          </div>
        )}

        <div className="-mx-1 overflow-x-auto px-1">
          <Tabs value={cat} onChange={setCat} className="flex-nowrap" items={CATEGORY_FILTERS.map((f) => ({ value: f.value, label: <span className="whitespace-nowrap">{f.label}</span> }))} />
        </div>
        {listError && <Alert tone="danger">{listError.message}</Alert>}
        {!modeles && !listError && <Loading />}
        <div className="grid gap-2.5 sm:grid-cols-2">
          {list.map((m) => (
            <button key={m.id} type="button" onClick={() => choose(m)}
              className={clsx('flex items-center gap-3 rounded-xl border p-2.5 text-left transition',
                selected?.id === m.id ? 'border-brand-blue bg-brand-blue/10' : 'border-line bg-white/[0.03] hover:border-white/25')}>
              <div className="flex h-14 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-ink-700">
                {m.image ? <img src={m.image} alt="" className="h-full w-full object-cover" /> : <Car className="h-5 w-5 text-muted" />}
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-white">{m.nom_affiche}</div>
                <CarSpecs m={m} className="mt-1" withFuel />
              </div>
            </button>
          ))}
        </div>
      </div>
    </Modal>
  );
}

export function CancelModal({ c, open, onClose, onDone }: { c: Commande; open: boolean; onClose: () => void; onDone: (r: { mode: string; rembourse: number; retenue: number }) => void }) {
  const site = useSite();
  const { data, error } = useApi<AnnulationPreview>(open ? `/compte/commandes/${c.reference}/annulation` : null, { revalidateOnFocus: false });
  const [mode, setMode] = useState<'remboursement' | 'avoir'>('avoir');
  const [busy, setBusy] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);
  const t = site.tarification;
  const rien = data ? data.montant_paye <= 0 : false;

  const cancel = async () => {
    setBusy(true);
    setPostError(null);
    try {
      onDone(await api(`/compte/commandes/${c.reference}/annuler`, { body: { mode: rien ? 'remboursement' : mode } }));
    } catch (e) {
      setPostError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Annuler ma réservation"
      footer={<><Button variant="ghost" onClick={onClose}>Garder ma réservation</Button><Button variant="danger" onClick={cancel} loading={busy} disabled={!data?.annulable}>Confirmer l’annulation</Button></>}>
      {error && <Alert tone="danger">{error.message}</Alert>}
      {!data && !error && <Loading />}
      {data && (
        <div className="grid gap-4">
          {!data.annulable ? (
            <Alert tone="warn">Cette réservation ne peut plus être annulée en ligne. Contactez notre hotline {site.hotline}.</Alert>
          ) : rien ? (
            <Alert tone="info">Aucun montant n’a été versé pour cette réservation : l’annulation est sans frais.</Alert>
          ) : (
            <>
              <p className="text-sm text-muted">
                Vous avez versé <span className="font-semibold text-white">{euro(data.montant_paye)}</span>. Choisissez comment récupérer ce montant.
              </p>
              <div className="grid gap-2.5">
                <Choice active={mode === 'avoir'} onClick={() => setMode('avoir')} icon={<Wallet className="h-5 w-5" />} title={<>Garder la totalité en avoir : {euro(data.avoir)}</>}>
                  Aucune retenue. L’avoir est utilisable lors de votre prochaine réservation.
                </Choice>
                <Choice active={mode === 'remboursement'} onClick={() => setMode('remboursement')} icon={<Undo2 className="h-5 w-5" />} title={<>Être remboursé : {euro(data.remboursement.rembourse)}</>}>
                  {data.assurance_annulation
                    ? 'Assurance annulation souscrite : remboursement intégral, sans retenue.'
                    : <>Retenue de {data.remboursement.retenue_pct}% du montant de la réservation, soit {euro(data.remboursement.retenue)}.</>}
                </Choice>
              </div>
              <p className="text-xs text-muted">
                Conditions d’annulation : {t.annulation_plus_48h_pct}% retenus si vous annulez plus de 48h avant le départ, {t.annulation_moins_48h_pct}% dans les 48h précédant le départ. Aucune retenue avec l’assurance annulation ou si vous gardez la totalité du montant en avoir.
              </p>
            </>
          )}
          {postError && <Alert tone="danger">{postError}</Alert>}
        </div>
      )}
    </Modal>
  );
}

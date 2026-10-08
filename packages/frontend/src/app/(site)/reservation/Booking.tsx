'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import clsx from 'clsx';
import {
  ArrowLeft, ArrowRight, Baby, Banknote, Car, Check, CreditCard, Crown, FileSignature, Gauge, Home, Landmark, LogIn, ShieldCheck, ShieldPlus, UserPlus, Users, Wallet,
} from 'lucide-react';
import Summary from './Summary';
import { useAuth, useSite } from '@/components/providers';
import { Alert, Button, Checkbox, Field, Input, Loading, Modal, Textarea } from '@/components/ui';
import { api, ApiError } from '@/lib/api';
import { defaultDates, euro, optionPrixLabel } from '@/lib/format';
import type { Devis, ModePaiement, Option, User } from '@/lib/types';

const STEPS = ['Mes coordonnées', 'Mes options', 'Mon paiement'];

const OPTION_ICON: Record<string, React.ReactNode> = {
  multiconducteur: <Users className="h-5 w-5" />, km_illimite: <Gauge className="h-5 w-5" />, chauffeur: <Car className="h-5 w-5" />,
  siege_bebe: <Baby className="h-5 w-5" />, siege_enfant: <Baby className="h-5 w-5" />, rehausseur: <Baby className="h-5 w-5" />,
  livraison_domicile: <Home className="h-5 w-5" />, assurance_annulation: <ShieldPlus className="h-5 w-5" />, gold: <ShieldCheck className="h-5 w-5" />, vip: <Crown className="h-5 w-5" />,
};

type Form = Record<'email' | 'email_confirmation' | 'nom' | 'prenom' | 'tel' | 'societe' | 'adresse' | 'code_postal' | 'commune' | 'pays' | 'num_permis' | 'date_permis' | 'date_naissance' | 'num_vol' | 'remarques' | 'password', string>;
const EMPTY: Form = { email: '', email_confirmation: '', nom: '', prenom: '', tel: '', societe: '', adresse: '', code_postal: '', commune: '', pays: '', num_permis: '', date_permis: '', date_naissance: '', num_vol: '', remarques: '', password: '' };
const isDate = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s);
const r2 = (n: number) => Math.round(n * 100) / 100;

function Stepper({ step, onGo }: { step: number; onGo: (i: number) => void }) {
  return (
    <ol className="flex items-center gap-2 sm:gap-4">
      {STEPS.map((s, i) => (
        <li key={s} className="flex flex-1 items-center gap-2 sm:gap-4 last:flex-none">
          <button type="button" disabled={i > step} onClick={() => onGo(i)} className="flex items-center gap-2.5 disabled:cursor-default">
            <span className={clsx('flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold transition',
              i < step ? 'bg-ok text-white' : i === step ? 'bg-brand-blue text-white shadow-[0_0_0_6px_rgba(47,107,255,0.18)]' : 'border border-line bg-white/[0.04] text-muted')}>
              {i < step ? <Check className="h-4 w-4" /> : i + 1}
            </span>
            <span className={clsx('hidden text-sm font-medium sm:inline', i === step ? 'text-white' : 'text-muted')}>{s}</span>
          </button>
          {i < STEPS.length - 1 && <span className={clsx('h-px flex-1', i < step ? 'bg-ok/60' : 'bg-line')} />}
        </li>
      ))}
    </ol>
  );
}

function LoginModal({ open, onClose, email }: { open: boolean; onClose: () => void; email: string }) {
  const { setSession } = useAuth();
  const [e, setE] = useState(email);
  const [p, setP] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (open) setE(email); }, [open, email]);
  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setBusy(true); setErr(null);
    try {
      const r = await api<{ user: User }>('/auth/login', { body: { email: e, password: p } });
      setSession(r.user);
      onClose();
    } catch (x) { setErr((x as Error).message); } finally { setBusy(false); }
  };
  return (
    <Modal open={open} onClose={onClose} title="Déjà client ?">
      <form onSubmit={submit} className="grid gap-4">
        <Field label="Email" required><Input type="email" value={e} onChange={(x) => setE(x.target.value)} required autoComplete="email" /></Field>
        <Field label="Mot de passe" required><Input type="password" value={p} onChange={(x) => setP(x.target.value)} required autoComplete="current-password" /></Field>
        {err && <Alert tone="danger">{err}</Alert>}
        <div className="flex items-center justify-between">
          <Link href="/mon-compte/mot-de-passe-oublie" className="text-sm text-brand-cyan hover:underline">Mot de passe oublié ?</Link>
          <Button type="submit" loading={busy}><LogIn className="h-4 w-4" /> Se connecter</Button>
        </div>
      </form>
    </Modal>
  );
}

export default function Booking() {
  const site = useSite();
  const { user, ready, setSession } = useAuth();
  const router = useRouter();
  const sp = useSearchParams();
  const defaults = useMemo(defaultDates, []);
  const modeleId = Number(sp.get('modele'));
  const depart = Number(sp.get('depart')) || site.villes[0]?.id;
  const retour = Number(sp.get('retour')) || depart;
  const date_depart = sp.get('date_depart') || defaults.date_depart;
  const date_retour = sp.get('date_retour') || defaults.date_retour;
  const backQs = new URLSearchParams({ depart: String(depart), retour: String(retour), date_depart, date_retour }).toString();

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<Form>(EMPTY);
  const [opts, setOpts] = useState<string[]>([]);
  const [promoInput, setPromoInput] = useState(sp.get('promo') || '');
  const [promo, setPromo] = useState(sp.get('promo') || '');
  const [promoError, setPromoError] = useState<string | null>(null);
  const [goldWarning, setGoldWarning] = useState<string | null>(null);
  const [useAvoir, setUseAvoir] = useState(false);
  const [mode, setMode] = useState<ModePaiement>(site.paiement_en_ligne ? 'cb' : 'virement');
  const [cgv, setCgv] = useState(false);
  const [touched, setTouched] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  useEffect(() => {
    if (!user) return;
    setForm((f) => {
      const pick = (k: keyof Form, v: string | null | undefined) => f[k] || v || '';
      return {
        ...f,
        email: user.email, email_confirmation: user.email,
        nom: pick('nom', user.nom), prenom: pick('prenom', user.prenom), tel: pick('tel', user.tel), societe: pick('societe', user.societe),
        adresse: pick('adresse', user.adresse), code_postal: pick('code_postal', user.code_postal), commune: pick('commune', user.commune), pays: pick('pays', user.pays),
        num_permis: pick('num_permis', user.num_permis), date_permis: pick('date_permis', user.date_permis), date_naissance: pick('date_naissance', user.date_naissance),
      };
    });
  }, [user]);

  const { data: options } = useSWR<Option[]>('/options', (p: string) => api(p));
  const active = (options ?? []).filter((o) => o.actif);

  const quoteBody = {
    depart, retour, date_depart, date_retour, modele_id: modeleId, options: opts, code_promo: promo || null, utiliser_avoir: useAvoir,
    date_naissance: isDate(form.date_naissance) ? form.date_naissance : null, date_permis: isDate(form.date_permis) ? form.date_permis : null,
  };
  const { data: devis, error, isLoading, isValidating } = useSWR<Devis>(modeleId && ready ? ['devis', site.code, user?.id ?? 0, JSON.stringify(quoteBody)] : null,
    () => api('/devis', { body: quoteBody }), { keepPreviousData: true, shouldRetryOnError: false, revalidateOnFocus: false });

  useEffect(() => {
    if (!error) return;
    const msg = (error as Error).message;
    if (promo && /promotion|code/i.test(msg)) { setPromoError(msg); setPromo(''); }
    else if (opts.includes('gold') && /Gold/.test(msg)) { setGoldWarning(msg); setOpts((o) => o.filter((x) => x !== 'gold')); }
  }, [error, promo, opts]);

  if (!modeleId) return (
    <div className="container-x py-16"><Alert tone="warn" title="Aucun véhicule sélectionné">Choisissez d&apos;abord un véhicule. <Link href="/" className="link">Rechercher</Link></Alert></div>
  );

  const fatal = error && !devis && !(error instanceof ApiError && error.status === 400 && (promo || opts.includes('gold')));
  if (!ready || (isLoading && !devis)) return <Loading label="Calcul de votre devis…" />;
  if (fatal) return (
    <div className="container-x py-16">
      <Alert tone="danger" title="Réservation impossible">{(error as Error).message}</Alert>
      <Link href={`/location?${backQs}`} className="mt-4 inline-flex items-center gap-2 text-sm text-brand-cyan"><ArrowLeft className="h-4 w-4" /> Retour aux véhicules disponibles</Link>
    </div>
  );

  const jours = devis?.location.jours ?? 1;
  const loc = devis?.location.montant_location ?? 0;
  const amount = (o: Option) => r2(o.type_prix === 'fixe' ? o.prix : o.type_prix === 'par_jour' ? o.prix * jours : (loc * o.prix) / 100);
  const driverErrors = devis?.conducteur?.erreurs ?? [];
  const goldForbidden = !!devis?.conducteur?.gold_interdit;
  const ville = site.villes.find((v) => v.id === depart);

  const required: (keyof Form)[] = ['email', 'email_confirmation', 'nom', 'prenom', 'date_permis', 'date_naissance'];
  const fieldErr = (k: keyof Form): string | null => {
    if (!touched) return null;
    if (required.includes(k) && !form[k].trim()) return 'Champ obligatoire';
    if (k === 'email_confirmation' && form.email && form.email.trim().toLowerCase() !== form.email_confirmation.trim().toLowerCase()) return 'Les deux adresses email ne correspondent pas';
    if (k === 'password' && !user && form.password.length < 8) return '8 caractères minimum';
    return null;
  };
  const step1Valid = required.every((k) => form[k].trim()) && form.email.trim().toLowerCase() === form.email_confirmation.trim().toLowerCase() && (user || form.password.length >= 8) && driverErrors.length === 0;

  const next = () => {
    if (step === 0) { setTouched(true); if (!step1Valid) return; }
    setStep((s) => Math.min(2, s + 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggle = (code: string) => setOpts((o) => (o.includes(code) ? o.filter((x) => x !== code) : [...o, code]));

  const submit = async () => {
    if (!cgv) return setSubmitError('Vous devez accepter les conditions générales de vente');
    setSubmitting(true); setSubmitError(null);
    try {
      const r = await api<{ reference: string; user?: User }>('/reservations', {
        body: { ...quoteBody, ...form, password: user ? null : form.password, mode_paiement: mode, cgv: true, date_naissance: form.date_naissance, date_permis: form.date_permis },
      });
      if (r.user) setSession(r.user);
      router.push(`/reservation/confirmation/${r.reference}`);
    } catch (x) {
      const msg = (x as Error).message;
      setSubmitError(msg);
      if (x instanceof ApiError && x.status === 409 && /Déjà client/.test(msg)) setLoginOpen(true);
      setSubmitting(false);
    }
  };

  const payCard = (value: ModePaiement, icon: React.ReactNode, title: string, desc: string) => (
    <button type="button" onClick={() => setMode(value)}
      className={clsx('flex items-start gap-3 rounded-xl border p-4 text-left transition', mode === value ? 'border-brand-blue bg-brand-blue/10' : 'border-line bg-white/[0.02] hover:border-white/20')}>
      <span className={clsx('mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2', mode === value ? 'border-brand-blue' : 'border-white/25')}>
        {mode === value && <span className="h-2.5 w-2.5 rounded-full bg-brand-blue" />}
      </span>
      <span className="text-brand-cyan">{icon}</span>
      <span><span className="block text-sm font-semibold text-white">{title}</span><span className="mt-0.5 block text-xs text-muted">{desc}</span></span>
    </button>
  );

  const acompte = devis ? r2((devis.montant_total * site.tarification.acompte_deux_fois_pct) / 100) : 0;

  return (
    <div className="container-x pb-10 pt-8">
      <div className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link href={`/location?${backQs}`} className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-white"><ArrowLeft className="h-4 w-4" /> Véhicules disponibles</Link>
          <h1 className="mt-2 text-2xl font-extrabold sm:text-3xl">Ma réservation</h1>
        </div>
        <div className="sm:w-[560px]"><Stepper step={step} onGo={(i) => setStep(i)} /></div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="min-w-0 space-y-6">
          {step === 0 && (
            <section className="glass p-5 sm:p-7">
              <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold">Mes coordonnées</h2>
                  <p className="mt-1 text-sm text-muted">Veuillez remplir le formulaire ci-dessous pour valider votre réservation.</p>
                </div>
                {user ? <span className="chip"><Check className="h-3.5 w-3.5 text-ok" /> Connecté : {user.email}</span>
                  : <Button variant="secondary" size="sm" onClick={() => setLoginOpen(true)}><LogIn className="h-4 w-4" /> Déjà client ?</Button>}
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Email" required error={fieldErr('email')}><Input type="email" value={form.email} onChange={set('email')} disabled={!!user} autoComplete="email" /></Field>
                <Field label="Confirmation Email" required error={fieldErr('email_confirmation')}><Input type="email" value={form.email_confirmation} onChange={set('email_confirmation')} disabled={!!user} autoComplete="off" /></Field>
                <Field label="Nom" required error={fieldErr('nom')}><Input value={form.nom} onChange={set('nom')} autoComplete="family-name" /></Field>
                <Field label="Prénom" required error={fieldErr('prenom')}><Input value={form.prenom} onChange={set('prenom')} autoComplete="given-name" /></Field>
                <Field label="Tél."><Input type="tel" value={form.tel} onChange={set('tel')} autoComplete="tel" /></Field>
                <Field label="Société"><Input value={form.societe} onChange={set('societe')} autoComplete="organization" /></Field>
                <Field label="Adresse postale" className="sm:col-span-2"><Input value={form.adresse} onChange={set('adresse')} autoComplete="street-address" /></Field>
                <div className="grid grid-cols-[110px_1fr] gap-4 sm:col-span-2 sm:grid-cols-[140px_1fr_1fr]">
                  <Field label="Code Postal"><Input value={form.code_postal} onChange={set('code_postal')} autoComplete="postal-code" /></Field>
                  <Field label="Commune"><Input value={form.commune} onChange={set('commune')} autoComplete="address-level2" /></Field>
                  <Field label="Pays" className="col-span-2 sm:col-span-1"><Input value={form.pays} onChange={set('pays')} autoComplete="country-name" /></Field>
                </div>
                <Field label="Num. permis"><Input value={form.num_permis} onChange={set('num_permis')} /></Field>
                <Field label="Date permis" required error={fieldErr('date_permis')}><Input type="date" value={form.date_permis} onChange={set('date_permis')} max={new Date().toISOString().slice(0, 10)} /></Field>
                <Field label="Date de naissance" required error={fieldErr('date_naissance')}><Input type="date" value={form.date_naissance} onChange={set('date_naissance')} max={new Date().toISOString().slice(0, 10)} /></Field>
                <Field label="Num. vol" hint="Notre agent suit votre vol"><Input value={form.num_vol} onChange={set('num_vol')} placeholder="ex. AH1234" /></Field>
                <Field label="Remarques éventuelles" className="sm:col-span-2" hint="Autres conducteurs, demande particulière…"><Textarea value={form.remarques} onChange={set('remarques')} /></Field>
                {!user && (
                  <Field label="Mot de passe de votre compte client" required error={fieldErr('password')} hint="Pour retrouver votre réservation et télécharger votre contrat" className="sm:col-span-2">
                    <Input type="password" value={form.password} onChange={set('password')} autoComplete="new-password" />
                  </Field>
                )}
              </div>
              {driverErrors.length > 0 && <Alert tone="danger" title="Conditions du conducteur" className="mt-5">{driverErrors.map((e) => <div key={e}>{e}</div>)}</Alert>}
              {devis?.conducteur?.caution_doublee && driverErrors.length === 0 && (
                <Alert tone="warn" className="mt-5">Moins de 5 ans de permis ? Plus de 65 ans ? Assurance Gold/caution inapplicable et montant caution doublé.</Alert>
              )}
              <p className="mt-5 text-xs text-muted">( * ) champ obligatoire</p>
            </section>
          )}

          {step === 1 && (
            <section className="glass p-5 sm:p-7">
              <h2 className="text-xl font-bold">Mes options</h2>
              <p className="mt-1 text-sm text-muted">Personnalisez votre location.</p>
              {goldWarning && <Alert tone="warn" className="mt-4">{goldWarning}</Alert>}
              <div className="mt-6 grid gap-3">
                {active.map((o) => {
                  const on = opts.includes(o.code);
                  const disabled = o.code === 'gold' && goldForbidden;
                  return (
                    <button key={o.code} type="button" disabled={disabled} onClick={() => toggle(o.code)}
                      className={clsx('flex items-center gap-4 rounded-xl border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-45',
                        on ? 'border-brand-blue bg-brand-blue/10' : 'border-line bg-white/[0.02] hover:border-white/20')}>
                      <span className={clsx('flex h-5 w-5 shrink-0 items-center justify-center rounded-md border', on ? 'border-brand-blue bg-brand-blue' : 'border-white/25')}>
                        {on && <Check className="h-3.5 w-3.5 text-white" />}
                      </span>
                      <span className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.05] text-brand-cyan sm:flex">{OPTION_ICON[o.code] ?? <ShieldCheck className="h-5 w-5" />}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-white">{o.libelle}</span>
                        <span className="mt-0.5 block text-xs text-muted">{optionPrixLabel(o)}{disabled ? ' · inapplicable (moins de 5 ans de permis ou plus de 65 ans)' : ''}</span>
                      </span>
                      <span className="shrink-0 text-sm font-bold text-white">{euro(amount(o))}</span>
                    </button>
                  );
                })}
              </div>
              <div className="mt-6 grid gap-2 text-sm text-soft">
                <p>Kilométrage inclus dans le forfait de base : {site.tarification.km_inclus_jour}km/jour .</p>
                <p className="text-warn">--&gt; Moins de 5 ans de permis ? Plus de 65 ans ? Assurance Gold/caution inapplicable et montant caution doublé.</p>
                {ville?.agent_tel && <p>Agent {ville.nom} : {ville.agent_tel}{ville.agent_nom ? ` [${ville.agent_nom}]` : ''}</p>}
              </div>
            </section>
          )}

          {step === 2 && (
            <section className="glass p-5 sm:p-7">
              <h2 className="text-xl font-bold">Mon paiement</h2>
              <h3 className="mt-6 text-sm font-semibold text-soft">Paiement intégral :</h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {site.paiement_en_ligne && payCard('cb', <CreditCard className="h-5 w-5" />, 'CB', 'Paiement sécurisé, réservation confirmée immédiatement')}
                {site.paiement_en_ligne && payCard('paypal', <Wallet className="h-5 w-5" />, 'PAYPAL', 'Payez avec votre compte PayPal')}
                {payCard('cheque', <FileSignature className="h-5 w-5" />, 'Chèque', 'Réservation valide dès réception du chèque')}
                {payCard('virement', <Landmark className="h-5 w-5" />, 'Virement bancaire', 'Réservation valide dès réception du virement')}
              </div>
              {site.paiement_en_ligne ? (
                <>
                  <h3 className="mt-6 text-sm font-semibold text-soft">Paiement en deux fois : (solde à régler en espèces à votre arrivée)</h3>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {payCard('deux_fois', <Banknote className="h-5 w-5" />, 'PAYPAL', devis ? `${euro(acompte)} maintenant, ${euro(r2(devis.montant_total - acompte))} en espèces à l'arrivée` : '')}
                  </div>
                </>
              ) : (
                <Alert tone="info" className="mt-4">Le paiement en ligne par carte et PayPal sera bientôt disponible. Réglez par chèque ou virement bancaire.</Alert>
              )}
              {(mode === 'cb' || mode === 'paypal' || mode === 'deux_fois') && (
                <Alert tone="info" className="mt-4">Environnement de démonstration : le paiement {mode === 'cb' ? 'par carte' : 'PayPal'} est simulé, aucune donnée bancaire n&apos;est demandée.</Alert>
              )}

              <div className="mt-8 grid gap-4 border-t border-line pt-6 sm:grid-cols-2">
                <Field label="Code de promotion" error={promoError}>
                  <div className="flex gap-2">
                    <Input value={promoInput} onChange={(e) => { setPromoInput(e.target.value.toUpperCase()); setPromoError(null); }} placeholder="Votre code" className="uppercase" />
                    <Button type="button" variant="secondary" onClick={() => { setPromoError(null); setPromo(promoInput.trim()); }} disabled={!promoInput.trim()}>Appliquer</Button>
                  </div>
                  {devis?.promo && <span className="mt-1 block text-xs text-ok">Code {devis.promo.code} appliqué ({devis.promo.message})</span>}
                </Field>
                {devis && devis.avoir_disponible > 0 && (
                  <div className="glass-soft p-4">
                    <Checkbox checked={useAvoir} onChange={setUseAvoir}>Utiliser mon avoir <span className="font-semibold text-white">({euro(devis.avoir_disponible)} disponibles)</span></Checkbox>
                  </div>
                )}
              </div>

              <div className="mt-6 border-t border-line pt-6">
                <Checkbox checked={cgv} onChange={(v) => { setCgv(v); if (v) setSubmitError(null); }}>
                  J&apos;accepte sans réserve les <Link href="/conditions-de-location" target="_blank" className="link">conditions générales de vente</Link> <span className="text-accent">*</span>
                </Checkbox>
              </div>
              {submitError && <Alert tone="danger" className="mt-4">{submitError}</Alert>}
            </section>
          )}

          <div className="flex items-center justify-between gap-3">
            {step > 0 ? <Button variant="outline" onClick={() => setStep(step - 1)}><ArrowLeft className="h-4 w-4" /> Retour</Button> : <span />}
            {step < 2 ? (
              <Button size="lg" onClick={next} disabled={isValidating && step === 0 && !devis}>Continuer <ArrowRight className="h-4 w-4" /></Button>
            ) : (
              <Button size="lg" onClick={submit} loading={submitting} disabled={!devis || isValidating}>
                Finaliser ma réservation{devis ? ` · ${euro(mode === 'deux_fois' ? acompte : devis.montant_total)}` : ''} <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
          {!user && step === 0 && (
            <p className="flex items-center gap-2 text-xs text-muted"><UserPlus className="h-4 w-4" /> Votre compte client est créé automatiquement avec cette réservation.</p>
          )}
        </div>

        <aside className="lg:sticky lg:top-28 lg:self-start">
          <Summary devis={devis} loading={isValidating} depart={depart} retour={retour} dateDepart={date_depart} dateRetour={date_retour} backHref={`/location?${backQs}`} />
        </aside>
      </div>
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} email={form.email} />
    </div>
  );
}

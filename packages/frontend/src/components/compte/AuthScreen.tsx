'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BadgePercent, ChevronRight, FileText, LogIn, Repeat, UserPlus, Wallet } from 'lucide-react';
import { api } from '@/lib/api';
import type { User } from '@/lib/types';
import { useAuth, useSite } from '@/components/providers';
import { Alert, Button, Field, Input } from '@/components/ui';
import { safeRedirect } from './lib';

type Session = { token: string; user: User };

function useAfterLogin() {
  const router = useRouter();
  const { setSession } = useAuth();
  return (s: Session) => {
    setSession(s.token, s.user);
    const to = safeRedirect(typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('redirect') : null);
    if (to) router.push(to);
  };
}

function LoginForm() {
  const after = useAfterLogin();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      after(await api<Session>('/auth/login', { body: { email, password } }));
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="glass flex flex-col p-6 sm:p-8">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-brand-blue/30 bg-brand-blue/10 text-[#7EA6FF]"><LogIn className="h-5 w-5" /></span>
        <div>
          <h2 className="text-xl font-bold">Déjà client ?</h2>
          <p className="text-sm text-muted">Connectez-vous à votre compte client</p>
        </div>
      </div>
      <div className="mt-6 grid gap-4">
        {error && <Alert tone="danger">{error}</Alert>}
        <Field label="Email" required>
          <Input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@exemple.com" />
        </Field>
        <Field label="Mot de passe" required>
          <Input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        <div className="flex justify-end">
          <Link href="/mon-compte/mot-de-passe-oublie" className="link text-sm">Mot de passe oublié ?</Link>
        </div>
        <Button type="submit" size="lg" full loading={busy}>Se connecter</Button>
      </div>
      <ul className="mt-8 grid gap-3 border-t border-line pt-6 text-sm text-soft">
        <li className="flex items-start gap-3"><Repeat className="mt-0.5 h-4 w-4 shrink-0 text-brand-cyan" /> Changez de modèle directement via votre compte client</li>
        <li className="flex items-start gap-3"><FileText className="mt-0.5 h-4 w-4 shrink-0 text-brand-cyan" /> Téléchargez votre contrat à imprimer en double exemplaire</li>
        <li className="flex items-start gap-3"><Wallet className="mt-0.5 h-4 w-4 shrink-0 text-brand-cyan" /> Retrouvez vos avoirs et utilisez-les lors de votre prochaine réservation</li>
      </ul>
    </form>
  );
}

const EMPTY = { email: '', password: '', nom: '', prenom: '', tel: '', societe: '', adresse: '', code_postal: '', commune: '', pays: '', num_permis: '', date_permis: '', date_naissance: '' };

function RegisterForm() {
  const after = useAfterLogin();
  const site = useSite();
  const [f, setF] = useState(EMPTY);
  const [more, setMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement>) => setF((p) => ({ ...p, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      after(await api<Session>('/auth/register', { body: f }));
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="glass flex flex-col p-6 sm:p-8">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent"><UserPlus className="h-5 w-5" /></span>
        <div>
          <h2 className="text-xl font-bold">Créer mon compte</h2>
          <p className="text-sm text-muted">Nouveau client ? Inscrivez-vous en une minute</p>
        </div>
      </div>
      <div className="mt-6 grid gap-4">
        {error && <Alert tone="danger">{error}</Alert>}
        <Field label="Email" required>
          <Input type="email" autoComplete="email" required value={f.email} onChange={set('email')} />
        </Field>
        <Field label="Mot de passe" required hint="8 caractères minimum">
          <Input type="password" autoComplete="new-password" required minLength={8} value={f.password} onChange={set('password')} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nom" required><Input required autoComplete="family-name" value={f.nom} onChange={set('nom')} /></Field>
          <Field label="Prénom" required><Input required autoComplete="given-name" value={f.prenom} onChange={set('prenom')} /></Field>
        </div>
        <Field label="Tél."><Input type="tel" autoComplete="tel" value={f.tel} onChange={set('tel')} /></Field>
        <button type="button" onClick={() => setMore((v) => !v)} className="flex items-center gap-1.5 text-left text-sm font-medium text-brand-cyan">
          <ChevronRight className={`h-4 w-4 transition ${more ? 'rotate-90' : ''}`} /> Adresse et permis de conduire (facultatif)
        </button>
        {more && (
          <div className="grid gap-4 rounded-xl border border-line bg-white/[0.02] p-4 sm:grid-cols-2">
            <Field label="Société" className="sm:col-span-2"><Input value={f.societe} onChange={set('societe')} /></Field>
            <Field label="Adresse postale" className="sm:col-span-2"><Input autoComplete="street-address" value={f.adresse} onChange={set('adresse')} /></Field>
            <Field label="Code Postal"><Input autoComplete="postal-code" value={f.code_postal} onChange={set('code_postal')} /></Field>
            <Field label="Commune"><Input value={f.commune} onChange={set('commune')} /></Field>
            <Field label="Pays" className="sm:col-span-2"><Input autoComplete="country-name" value={f.pays} onChange={set('pays')} /></Field>
            <Field label="Num. permis"><Input value={f.num_permis} onChange={set('num_permis')} /></Field>
            <Field label="Date permis"><Input type="date" value={f.date_permis} onChange={set('date_permis')} /></Field>
            <Field label="Date de naissance" className="sm:col-span-2"><Input type="date" value={f.date_naissance} onChange={set('date_naissance')} /></Field>
          </div>
        )}
        <Button type="submit" size="lg" full loading={busy}>Créer mon compte</Button>
        <p className="flex items-start gap-2 text-xs text-muted">
          <BadgePercent className="h-4 w-4 shrink-0 text-accent" />
          Votre fidélité est récompensée : -{site.tarification.remise_fidelite_pct}% sur votre prochaine réservation après chaque location.
        </p>
      </div>
    </form>
  );
}

export default function AuthScreen() {
  return (
    <div className="container-x py-12 sm:py-16">
      <div className="mb-8 max-w-2xl">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl">Mon <span className="text-grad">compte</span></h1>
        <p className="mt-3 text-muted">Connectez-vous pour suivre vos réservations, payer le solde, changer de modèle ou télécharger votre contrat.</p>
      </div>
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <LoginForm />
        <RegisterForm />
      </div>
    </div>
  );
}

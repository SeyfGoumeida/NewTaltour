'use client';

import { useEffect, useState } from 'react';
import { KeyRound, UserRound } from 'lucide-react';
import { api } from '@/lib/api';
import type { User } from '@/lib/types';
import { useAuth } from '@/components/providers';
import { Alert, Button, Card, CardTitle, Field, Input } from '@/components/ui';

const FIELDS = ['nom', 'prenom', 'tel', 'societe', 'adresse', 'code_postal', 'commune', 'pays', 'num_permis', 'date_permis', 'date_naissance'] as const;
type Form = Record<(typeof FIELDS)[number], string>;

const toForm = (u: User): Form => Object.fromEntries(FIELDS.map((k) => [k, (u[k] ?? '').toString().slice(0, k.startsWith('date_') ? 10 : undefined)])) as Form;

function ProfileForm() {
  const { user, setUser } = useAuth();
  const [f, setF] = useState<Form>(() => toForm(user!));
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: 'ok' | 'danger'; text: string } | null>(null);
  useEffect(() => {
    if (user) setF(toForm(user));
  }, [user]);
  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setMsg(null);
    setF((p) => ({ ...p, [k]: e.target.value }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      setUser(await api<User>('/auth/me', { method: 'PUT', body: f }));
      setMsg({ tone: 'ok', text: 'Vos informations ont été enregistrées.' });
    } catch (err) {
      setMsg({ tone: 'danger', text: (err as Error).message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardTitle><span className="inline-flex items-center gap-2"><UserRound className="h-4 w-4 text-brand-cyan" /> Mes informations</span></CardTitle>
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <Field label="Email" className="sm:col-span-2" hint="Pour changer d’adresse email, contactez notre service client.">
          <Input value={user?.email ?? ''} readOnly disabled />
        </Field>
        <Field label="Nom" required><Input required value={f.nom} onChange={set('nom')} autoComplete="family-name" /></Field>
        <Field label="Prénom" required><Input required value={f.prenom} onChange={set('prenom')} autoComplete="given-name" /></Field>
        <Field label="Tél."><Input type="tel" value={f.tel} onChange={set('tel')} autoComplete="tel" /></Field>
        <Field label="Société"><Input value={f.societe} onChange={set('societe')} /></Field>
        <Field label="Adresse postale" className="sm:col-span-2"><Input value={f.adresse} onChange={set('adresse')} autoComplete="street-address" /></Field>
        <Field label="Code Postal"><Input value={f.code_postal} onChange={set('code_postal')} autoComplete="postal-code" /></Field>
        <Field label="Commune"><Input value={f.commune} onChange={set('commune')} /></Field>
        <Field label="Pays"><Input value={f.pays} onChange={set('pays')} autoComplete="country-name" /></Field>
        <Field label="Num. permis"><Input value={f.num_permis} onChange={set('num_permis')} /></Field>
        <Field label="Date permis"><Input type="date" value={f.date_permis} onChange={set('date_permis')} /></Field>
        <Field label="Date de naissance"><Input type="date" value={f.date_naissance} onChange={set('date_naissance')} /></Field>
        {msg && <Alert tone={msg.tone} className="sm:col-span-2">{msg.text}</Alert>}
        <div className="sm:col-span-2"><Button type="submit" loading={busy}>Enregistrer</Button></div>
      </form>
    </Card>
  );
}

function PasswordForm() {
  const [ancien, setAncien] = useState('');
  const [nouveau, setNouveau] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: 'ok' | 'danger'; text: string } | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (nouveau !== confirm) return setMsg({ tone: 'danger', text: 'Les deux mots de passe ne correspondent pas' });
    setBusy(true);
    setMsg(null);
    try {
      await api('/auth/password', { body: { ancien, nouveau } });
      setAncien('');
      setNouveau('');
      setConfirm('');
      setMsg({ tone: 'ok', text: 'Votre mot de passe a été modifié.' });
    } catch (err) {
      setMsg({ tone: 'danger', text: (err as Error).message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardTitle><span className="inline-flex items-center gap-2"><KeyRound className="h-4 w-4 text-brand-cyan" /> Changer mon mot de passe</span></CardTitle>
      <form onSubmit={submit} className="grid gap-4">
        <Field label="Mot de passe actuel" required><Input type="password" required autoComplete="current-password" value={ancien} onChange={(e) => setAncien(e.target.value)} /></Field>
        <Field label="Nouveau mot de passe" required hint="8 caractères minimum"><Input type="password" required minLength={8} autoComplete="new-password" value={nouveau} onChange={(e) => setNouveau(e.target.value)} /></Field>
        <Field label="Confirmer le nouveau mot de passe" required><Input type="password" required minLength={8} autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} /></Field>
        {msg && <Alert tone={msg.tone}>{msg.text}</Alert>}
        <div><Button type="submit" variant="secondary" loading={busy}>Modifier le mot de passe</Button></div>
      </form>
    </Card>
  );
}

export default function Profil() {
  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Mon <span className="text-grad">profil</span></h1>
        <p className="mt-2 text-sm text-muted">Ces informations sont reprises sur votre contrat de location et pré-remplies lors de vos prochaines réservations.</p>
      </div>
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <ProfileForm />
        <PasswordForm />
      </div>
    </div>
  );
}

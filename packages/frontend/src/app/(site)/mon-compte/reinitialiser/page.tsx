'use client';

import Link from 'next/link';
import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, KeyRound } from 'lucide-react';
import { api } from '@/lib/api';
import { Alert, Button, Field, Input, LinkButton, Loading } from '@/components/ui';

function ResetForm() {
  const token = useSearchParams().get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) return setError('Les deux mots de passe ne correspondent pas');
    setBusy(true);
    setError(null);
    try {
      await api('/auth/reset', { body: { token, password } });
      setDone(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (!token) return (
    <div className="mt-6 grid gap-4">
      <Alert tone="danger">Lien de réinitialisation invalide.</Alert>
      <LinkButton href="/mon-compte/mot-de-passe-oublie" variant="secondary">Demander un nouveau lien</LinkButton>
    </div>
  );
  if (done) return (
    <div className="mt-6 grid gap-4">
      <Alert tone="ok">Votre mot de passe a été modifié. Vous pouvez vous connecter.</Alert>
      <LinkButton href="/mon-compte" size="lg" full>Se connecter</LinkButton>
    </div>
  );
  return (
    <form onSubmit={submit} className="mt-6 grid gap-4">
      {error && (
        <Alert tone="danger">
          {error}
          {/expir|invalide/i.test(error) && <> · <Link href="/mon-compte/mot-de-passe-oublie" className="underline underline-offset-2">Demander un nouveau lien</Link></>}
        </Alert>
      )}
      <Field label="Nouveau mot de passe" required hint="8 caractères minimum">
        <Input type="password" required minLength={8} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
      </Field>
      <Field label="Confirmer le mot de passe" required>
        <Input type="password" required minLength={8} autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
      </Field>
      <Button type="submit" size="lg" full loading={busy}>Enregistrer mon mot de passe</Button>
    </form>
  );
}

export default function Reinitialiser() {
  return (
    <div className="container-x py-12 sm:py-16">
      <div className="mx-auto max-w-md">
        <Link href="/mon-compte" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-white"><ArrowLeft className="h-4 w-4" /> Retour à la connexion</Link>
        <div className="glass mt-4 p-6 sm:p-8">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent"><KeyRound className="h-5 w-5" /></span>
          <h1 className="mt-4 text-2xl font-bold">Nouveau mot de passe</h1>
          <p className="mt-2 text-sm text-muted">Choisissez un nouveau mot de passe pour votre compte client.</p>
          <Suspense fallback={<Loading />}><ResetForm /></Suspense>
        </div>
      </div>
    </div>
  );
}

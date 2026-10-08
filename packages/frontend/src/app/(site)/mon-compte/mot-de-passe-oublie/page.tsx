'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowLeft, Mail } from 'lucide-react';
import { api } from '@/lib/api';
import { Alert, Button, Field, Input } from '@/components/ui';

export default function MotDePasseOublie() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ lien_dev?: string } | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      setDone(await api<{ ok: true; lien_dev?: string }>('/auth/forgot', { body: { email } }));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container-x py-12 sm:py-16">
      <div className="mx-auto max-w-md">
        <Link href="/mon-compte" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-white"><ArrowLeft className="h-4 w-4" /> Retour à la connexion</Link>
        <div className="glass mt-4 p-6 sm:p-8">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-brand-blue/30 bg-brand-blue/10 text-[#7EA6FF]"><Mail className="h-5 w-5" /></span>
          <h1 className="mt-4 text-2xl font-bold">Mot de passe oublié ?</h1>
          <p className="mt-2 text-sm text-muted">Indiquez l’email de votre compte client : nous vous envoyons un lien pour choisir un nouveau mot de passe.</p>
          {done ? (
            <div className="mt-6 grid gap-4">
              <Alert tone="ok">Si un compte existe pour {email}, un email de réinitialisation vient de vous être envoyé. Le lien est valable une heure.</Alert>
              {done.lien_dev && (
                <div className="rounded-xl border border-warn/30 bg-warn/10 p-4 text-sm">
                  <div className="font-semibold text-[#FCD58A]">Lien de réinitialisation (mode développement)</div>
                  <a href={done.lien_dev} className="link mt-1 block break-all">{done.lien_dev}</a>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={submit} className="mt-6 grid gap-4">
              {error && <Alert tone="danger">{error}</Alert>}
              <Field label="Email" required>
                <Input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </Field>
              <Button type="submit" size="lg" full loading={busy}>Recevoir le lien</Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

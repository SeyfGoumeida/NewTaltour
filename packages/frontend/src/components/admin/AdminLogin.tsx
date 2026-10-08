'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Lock } from 'lucide-react';
import { api } from '@/lib/api';
import type { User } from '@/lib/types';
import { useAuth } from '@/components/providers';
import { Alert, Button, Field, Input } from '@/components/ui';
import { errMsg } from './kit';

export default function AdminLogin({ denied }: { denied: boolean }) {
  const { setSession, logout } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      const r = await api<{ token: string; user: User }>('/auth/login', { body: { email, password } });
      setSession(r.token, r.user);
      if (r.user.role !== 10) setErr('Accès réservé aux administrateurs');
    } catch (e) {
      setErr(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center gap-3">
          <img src="/logo-taltour.png" alt="Taltour" className="h-12 w-auto" />
          <span className="rounded-md border border-accent/30 bg-accent/10 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-accent">Back-office</span>
        </div>
        <form onSubmit={submit} className="glass space-y-5 p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <span className="rounded-xl bg-brand-blue/15 p-2.5 text-brand-cyan"><Lock className="h-5 w-5" /></span>
            <div>
              <h1 className="text-xl font-bold">Connexion administrateur</h1>
              <p className="text-sm text-muted">Accès réservé aux administrateurs</p>
            </div>
          </div>
          {denied && !err && <Alert tone="warn" title="Accès réservé aux administrateurs">Votre compte n&apos;a pas les droits nécessaires. Connectez-vous avec un compte administrateur.</Alert>}
          {err && <Alert tone="danger">{err}</Alert>}
          <Field label="Email" required>
            <Input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </Field>
          <Field label="Mot de passe" required>
            <Input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </Field>
          <Button type="submit" full loading={busy}>Se connecter</Button>
          <div className="flex items-center justify-between text-xs text-muted">
            <Link href="/" className="link">Retour au site</Link>
            {denied && <button type="button" onClick={logout} className="link">Se déconnecter</button>}
          </div>
        </form>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { Send } from 'lucide-react';
import { Alert, Button, Field, Input, Textarea } from '@/components/ui';
import { api } from '@/lib/api';
import { useHoneypot } from '@/components/Honeypot';

interface Values { email: string; nom: string; prenom: string; tel: string; message: string }

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ContactForm({ defaultMessage = '', onSent, submitLabel = 'Envoyer', idPrefix = 'contact' }: { defaultMessage?: string; onSent?: () => void; submitLabel?: string; idPrefix?: string }) {
  const empty: Values = { email: '', nom: '', prenom: '', tel: '', message: defaultMessage };
  const [v, setV] = useState<Values>(empty);
  const [errors, setErrors] = useState<Partial<Record<keyof Values, string>>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const hp = useHoneypot();

  const set = (k: keyof Values) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setV((s) => ({ ...s, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const errs: Partial<Record<keyof Values, string>> = {};
    if (!EMAIL.test(v.email.trim())) errs.email = 'Adresse email invalide';
    if (!v.nom.trim()) errs.nom = 'Champ obligatoire';
    if (!v.message.trim()) errs.message = 'Champ obligatoire';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    setError(null);
    try {
      await api('/contact', { body: { email: v.email.trim(), nom: v.nom.trim(), prenom: v.prenom.trim() || null, tel: v.tel.trim() || null, message: v.message.trim(), website: hp.value() } });
      setSent(true);
      onSent?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "L'envoi a échoué, veuillez réessayer.");
    } finally {
      setBusy(false);
    }
  }

  if (sent)
    return (
      <div className="space-y-4">
        <Alert tone="ok" title="Message envoyé">
          Merci {v.prenom || v.nom}, votre message a bien été transmis. Notre équipe vous répondra dans les plus brefs délais.
        </Alert>
        <Button
          variant="secondary"
          onClick={() => {
            setV(empty);
            setSent(false);
          }}
        >
          Envoyer un autre message
        </Button>
      </div>
    );

  return (
    <form onSubmit={submit} noValidate className="relative grid gap-4">
      {hp.field}
      {error && <Alert tone="danger">{error}</Alert>}
      <Field label="Email" required error={errors.email}>
        <Input id={`${idPrefix}-email`} type="email" autoComplete="email" value={v.email} onChange={set('email')} aria-invalid={!!errors.email} required />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nom" required error={errors.nom}>
          <Input id={`${idPrefix}-nom`} autoComplete="family-name" value={v.nom} onChange={set('nom')} aria-invalid={!!errors.nom} required />
        </Field>
        <Field label="Prénom">
          <Input id={`${idPrefix}-prenom`} autoComplete="given-name" value={v.prenom} onChange={set('prenom')} />
        </Field>
      </div>
      <Field label="Tél.">
        <Input id={`${idPrefix}-tel`} type="tel" autoComplete="tel" value={v.tel} onChange={set('tel')} />
      </Field>
      <Field label="Message" required error={errors.message}>
        <Textarea id={`${idPrefix}-message`} rows={6} value={v.message} onChange={set('message')} aria-invalid={!!errors.message} required />
      </Field>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs text-muted">( * ) champ obligatoire</span>
        <Button type="submit" loading={busy}>
          <Send className="h-4 w-4" /> {submitLabel}
        </Button>
      </div>
    </form>
  );
}

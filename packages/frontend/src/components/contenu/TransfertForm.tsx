'use client';

import { useState } from 'react';
import { Send } from 'lucide-react';
import { Alert, Button, Field, Input, Select, Textarea } from '@/components/ui';
import { api } from '@/lib/api';

interface Values {
  nom: string;
  email: string;
  tel: string;
  aeroport_id: string;
  destination: string;
  date_arrivee: string;
  passagers: string;
  num_vol: string;
  message: string;
}

type Errors = Partial<Record<keyof Values, string>>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function TransfertForm({ aeroports }: { aeroports: { id: number; nom: string }[] }) {
  const empty: Values = { nom: '', email: '', tel: '', aeroport_id: aeroports.length === 1 ? String(aeroports[0].id) : '', destination: '', date_arrivee: '', passagers: '1', num_vol: '', message: '' };
  const [v, setV] = useState<Values>(empty);
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const set = (k: keyof Values) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setV((s) => ({ ...s, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const errs: Errors = {};
    if (!v.nom.trim()) errs.nom = 'Champ obligatoire';
    if (!EMAIL.test(v.email.trim())) errs.email = 'Adresse email invalide';
    if (!v.aeroport_id) errs.aeroport_id = 'Choisissez un aéroport';
    if (!v.destination.trim()) errs.destination = 'Champ obligatoire';
    if (!v.date_arrivee) errs.date_arrivee = "Indiquez la date et l'heure d'arrivée";
    const p = parseInt(v.passagers, 10);
    if (!(p >= 1 && p <= 50)) errs.passagers = 'Entre 1 et 50 passagers';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    setError(null);
    try {
      await api('/transfert', {
        body: {
          nom: v.nom.trim(),
          email: v.email.trim(),
          tel: v.tel.trim() || null,
          aeroport_id: Number(v.aeroport_id),
          destination: v.destination.trim(),
          date_arrivee: v.date_arrivee,
          passagers: p,
          num_vol: v.num_vol.trim() || null,
          message: v.message.trim() || null,
        },
      });
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "L'envoi a échoué, veuillez réessayer.");
    } finally {
      setBusy(false);
    }
  }

  if (sent)
    return (
      <div className="space-y-4">
        <Alert tone="ok" title="Demande de devis envoyée">
          Merci {v.nom}, votre demande de transfert a bien été enregistrée. Nous vous envoyons votre devis par email dans les plus brefs délais.
        </Alert>
        <Button
          variant="secondary"
          onClick={() => {
            setV(empty);
            setSent(false);
          }}
        >
          Nouvelle demande
        </Button>
      </div>
    );

  return (
    <form onSubmit={submit} noValidate className="grid gap-4">
      {error && <Alert tone="danger">{error}</Alert>}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nom" required error={errors.nom}>
          <Input autoComplete="name" value={v.nom} onChange={set('nom')} aria-invalid={!!errors.nom} required />
        </Field>
        <Field label="Email" required error={errors.email}>
          <Input type="email" autoComplete="email" value={v.email} onChange={set('email')} aria-invalid={!!errors.email} required />
        </Field>
        <Field label="Tél.">
          <Input type="tel" autoComplete="tel" value={v.tel} onChange={set('tel')} />
        </Field>
        <Field label="Aéroport d'arrivée" required error={errors.aeroport_id}>
          <Select value={v.aeroport_id} onChange={set('aeroport_id')} aria-invalid={!!errors.aeroport_id} required>
            <option value="">Choisir un aéroport</option>
            {aeroports.map((a) => (
              <option key={a.id} value={a.id}>{a.nom}</option>
            ))}
          </Select>
        </Field>
      </div>
      <Field label="Destination (hôtel, adresse…)" required error={errors.destination}>
        <Input value={v.destination} onChange={set('destination')} aria-invalid={!!errors.destination} required />
      </Field>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Date et heure d'arrivée" required error={errors.date_arrivee} className="sm:col-span-1">
          <Input type="datetime-local" value={v.date_arrivee} onChange={set('date_arrivee')} aria-invalid={!!errors.date_arrivee} required />
        </Field>
        <Field label="Passagers" required error={errors.passagers}>
          <Input type="number" inputMode="numeric" min={1} max={50} value={v.passagers} onChange={set('passagers')} aria-invalid={!!errors.passagers} required />
        </Field>
        <Field label="N° de vol">
          <Input value={v.num_vol} onChange={set('num_vol')} placeholder="ex. AH1007" />
        </Field>
      </div>
      <Field label="Message">
        <Textarea rows={4} value={v.message} onChange={set('message')} placeholder="Bagages, siège enfant, retour…" />
      </Field>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs text-muted">( * ) champ obligatoire</span>
        <Button type="submit" loading={busy}>
          <Send className="h-4 w-4" /> Demander un devis
        </Button>
      </div>
    </form>
  );
}

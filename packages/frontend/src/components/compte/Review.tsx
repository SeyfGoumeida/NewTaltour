'use client';

import { useState } from 'react';
import clsx from 'clsx';
import { Star } from 'lucide-react';
import { api } from '@/lib/api';
import { dateFr } from '@/lib/format';
import type { Commande } from '@/lib/types';
import { Alert, Button, Card, CardTitle, Field, Stars, Textarea } from '@/components/ui';

const LABELS = ['', 'Décevant', 'Moyen', 'Bien', 'Très bien', 'Excellent'];

function StarInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <div className="flex items-center gap-3">
      <div className="flex gap-1" role="radiogroup" aria-label="Note" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((i) => (
          <button key={i} type="button" role="radio" aria-checked={value === i} aria-label={`${i} sur 5`}
            onMouseEnter={() => setHover(i)} onClick={() => onChange(i)}
            className="rounded-md p-0.5 transition hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/40">
            <Star className={clsx('h-8 w-8', i <= shown ? 'fill-gold text-gold' : 'fill-white/10 text-white/15')} />
          </button>
        ))}
      </div>
      <span className="text-sm font-medium text-soft">{LABELS[shown]}</span>
    </div>
  );
}

export function ReviewForm({ c, onDone }: { c: Commande; onDone: () => void }) {
  const [note, setNote] = useState(0);
  const [resa, setResa] = useState('');
  const [place, setPlace] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!note) return setError('Choisissez une note de 1 à 5 étoiles');
    setBusy(true);
    setError(null);
    try {
      await api(`/compte/commandes/${c.reference}/avis`, { body: { note, observation_reservation: resa, observation_place: place } });
      onDone();
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  };

  return (
    <Card id="avis" className="scroll-mt-28 border-gold/25">
      <CardTitle>Donnez votre avis sur votre location</CardTitle>
      <form onSubmit={submit} className="grid gap-4">
        <div><span className="label">Note <span className="text-accent">*</span></span><StarInput value={note} onChange={setNote} /></div>
        <Field label="Observations sur la réservation">
          <Textarea value={resa} onChange={(e) => setResa(e.target.value)} maxLength={3000} placeholder="Site internet, réservation, paiement, contrat…" />
        </Field>
        <Field label="Observations sur place">
          <Textarea value={place} onChange={(e) => setPlace(e.target.value)} maxLength={3000} placeholder="Accueil de l’agent, état du véhicule, restitution…" />
        </Field>
        {error && <Alert tone="danger">{error}</Alert>}
        <div><Button type="submit" loading={busy}>Envoyer mon avis</Button></div>
      </form>
    </Card>
  );
}

export function ReviewDisplay({ avis }: { avis: NonNullable<Commande['avis']> }) {
  return (
    <Card id="avis">
      <CardTitle action={<span className="text-xs text-muted">le {dateFr(avis.created_at)}</span>}>Votre avis</CardTitle>
      <div className="flex items-center gap-2"><Stars value={avis.note} size={18} /><span className="text-sm font-semibold text-white">{avis.note}/5</span></div>
      <dl className="mt-4 grid gap-4 text-sm">
        <div>
          <dt className="label">Observations sur la réservation</dt>
          <dd className="text-soft">{avis.observation_reservation || <span className="text-muted">Aucune observation</span>}</dd>
        </div>
        <div>
          <dt className="label">Observations sur place</dt>
          <dd className="text-soft">{avis.observation_place || <span className="text-muted">Aucune observation</span>}</dd>
        </div>
      </dl>
    </Card>
  );
}

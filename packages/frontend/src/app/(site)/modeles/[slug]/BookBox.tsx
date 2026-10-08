'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { useSite } from '@/components/providers';
import { Button, Field, Input, Select } from '@/components/ui';
import { defaultDates } from '@/lib/format';

export default function BookBox({ modeleId, initial }: { modeleId: number; slug: string; initial: Record<string, string | undefined> }) {
  const site = useSite();
  const router = useRouter();
  const d = useMemo(defaultDates, []);
  const first = site.villes[0]?.id ?? 1;
  const [depart, setDepart] = useState(Number(initial.depart) || first);
  const [retour, setRetour] = useState(Number(initial.retour) || Number(initial.depart) || first);
  const [dd, setDd] = useState(initial.date_depart || d.date_depart);
  const [dr, setDr] = useState(initial.date_retour || d.date_retour);
  const [error, setError] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (dr <= dd) return setError('La date de retour doit être postérieure à la date de départ');
    const p = new URLSearchParams({ modele: String(modeleId), depart: String(depart), retour: String(retour), date_depart: dd, date_retour: dr });
    if (initial.promo) p.set('promo', initial.promo);
    router.push(`/reservation?${p}`);
  };

  return (
    <form onSubmit={submit} className="glass grid gap-3 p-5">
      <h2 className="text-base font-semibold">Réserver ce véhicule</h2>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Ville de départ">
          <Select value={depart} onChange={(e) => { const v = Number(e.target.value); setDepart(v); if (retour === depart) setRetour(v); }}>
            {site.villes.map((v) => <option key={v.id} value={v.id}>{v.nom}</option>)}
          </Select>
        </Field>
        <Field label="Ville de retour">
          <Select value={retour} onChange={(e) => setRetour(Number(e.target.value))}>
            {site.villes.map((v) => <option key={v.id} value={v.id}>{v.nom}</option>)}
          </Select>
        </Field>
      </div>
      <Field label="Date de départ"><Input type="datetime-local" step={1800} value={dd} onChange={(e) => setDd(e.target.value)} required /></Field>
      <Field label="Date de retour"><Input type="datetime-local" step={1800} value={dr} onChange={(e) => setDr(e.target.value)} required /></Field>
      {error && <p className="text-sm text-danger">{error}</p>}
      <Button type="submit" size="lg" full>Réserver <ArrowRight className="h-4 w-4" /></Button>
    </form>
  );
}

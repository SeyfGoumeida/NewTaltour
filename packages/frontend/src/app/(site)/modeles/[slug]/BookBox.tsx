'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { useSite } from '@/components/providers';
import DateTimePicker from '@/components/DateTimePicker';
import { Button, Field, Select } from '@/components/ui';
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
  const today = new Date().toISOString().slice(0, 10);
  const max = `${new Date().getUTCFullYear() + 2}-12-31`;

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
      <div>
        <span className="label">Date de départ</span>
        <DateTimePicker variant="dark" label="Date de départ" value={dd} min={today} max={max} rangeStart={dd} rangeEnd={dr}
          onChange={(v) => { setDd(v); if (v >= dr) setDr(new Date(new Date(`${v}:00Z`).getTime() + 7 * 86_400_000).toISOString().slice(0, 16)); }} />
      </div>
      <div>
        <span className="label">Date de retour</span>
        <DateTimePicker variant="dark" label="Date de retour" value={dr} min={dd.slice(0, 10)} max={max} rangeStart={dd} rangeEnd={dr} onChange={setDr} />
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
      <Button type="submit" size="lg" full>Réserver <ArrowRight className="h-4 w-4" /></Button>
    </form>
  );
}

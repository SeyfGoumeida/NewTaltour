'use client';

import { useMemo, useState } from 'react';
import { CalendarX2 } from 'lucide-react';
import { Alert, Empty, LinkButton, Loading, Tabs } from '@/components/ui';
import BookingCard from '@/components/compte/BookingCard';
import { useApi } from '@/components/compte/hooks';
import { FILTRES, phase, type CommandeItem, type Filtre } from '@/components/compte/lib';

export default function Reservations() {
  const { data, error } = useApi<CommandeItem[]>('/compte/commandes');
  const [filtre, setFiltre] = useState<Filtre>('a_venir');

  const counts = useMemo(() => {
    const c: Record<Filtre, number> = { a_venir: 0, en_cours: 0, passees: 0, annulees: 0, toutes: 0 };
    for (const b of data ?? []) {
      c[phase(b)]++;
      c.toutes++;
    }
    return c;
  }, [data]);

  const items = useMemo(() => {
    const list = (data ?? []).filter((b) => filtre === 'toutes' || phase(b) === filtre);
    return filtre === 'a_venir' || filtre === 'en_cours' ? [...list].sort((a, b) => a.date_depart.localeCompare(b.date_depart)) : list;
  }, [data, filtre]);

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Mes <span className="text-grad">réservations</span></h1>
        <p className="mt-2 text-sm text-muted">Payez le solde, changez de modèle, annulez ou téléchargez votre contrat depuis le détail de chaque réservation.</p>
      </div>
      <div className="-mx-4 overflow-x-auto px-4">
        <Tabs value={filtre} onChange={setFiltre} className="flex-nowrap"
          items={FILTRES.map((f) => ({ value: f.value, label: <span className="whitespace-nowrap">{f.label} <span className="ml-1 opacity-60">{counts[f.value]}</span></span> }))} />
      </div>
      {error && <Alert tone="danger">{error.message}</Alert>}
      {!data && !error && <Loading />}
      {data && items.length === 0 && (
        <Empty icon={<CalendarX2 className="h-6 w-6" />} title="Aucune réservation">
          <p>Aucune réservation dans cette catégorie.</p>
          <LinkButton href="/" className="mt-5">Réserver un véhicule</LinkButton>
        </Empty>
      )}
      <div className="grid gap-3">
        {items.map((c) => <BookingCard key={c.reference} c={c} />)}
      </div>
    </div>
  );
}

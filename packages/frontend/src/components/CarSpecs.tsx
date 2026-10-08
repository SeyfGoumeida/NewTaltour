import clsx from 'clsx';
import { DoorOpen, Fuel, Gauge, Snowflake, Users } from 'lucide-react';

export const CATEGORY_FILTERS = [
  { value: 'tous', label: 'Tous les véhicules' },
  { value: 'A', label: 'Cat. A' },
  { value: 'B', label: 'Cat. B' },
  { value: 'C', label: 'Cat. C' },
  { value: 'D', label: 'Cat. D' },
  { value: 'essence', label: 'Essence' },
  { value: 'diesel', label: 'Diesel' },
] as const;

export type CategoryFilter = (typeof CATEGORY_FILTERS)[number]['value'];

export function matchCategory(m: { categorie: string | null; carburant: string }, f: CategoryFilter) {
  if (f === 'tous') return true;
  if (f === 'essence' || f === 'diesel') return m.carburant === f;
  return m.categorie === f;
}

export function categoryLabel(m: { categorie: string | null; categorie_libelle: string | null }) {
  return m.categorie ? `Cat. ${m.categorie}` : m.categorie_libelle || null;
}

export default function CarSpecs({
  m,
  className,
  withFuel,
}: {
  m: { portes: number | null; places: number | null; boite: string; carburant?: string; equipements?: string[] };
  className?: string;
  withFuel?: boolean;
}) {
  const ac = !m.equipements || m.equipements.includes('Climatisation');
  return (
    <div className={clsx('flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted', className)}>
      {m.portes != null && <span className="inline-flex items-center gap-1.5" title="Portes"><DoorOpen className="h-3.5 w-3.5" /> {m.portes}</span>}
      {m.places != null && <span className="inline-flex items-center gap-1.5" title="Places"><Users className="h-3.5 w-3.5" /> {m.places}</span>}
      <span className="inline-flex items-center gap-1.5" title={m.boite === 'automatique' ? 'Automatique' : 'Manuelle'}><Gauge className="h-3.5 w-3.5" /> {m.boite === 'automatique' ? 'A' : 'M'}</span>
      {ac && <span className="inline-flex items-center gap-1.5" title="Climatisation"><Snowflake className="h-3.5 w-3.5" /> A/C</span>}
      {withFuel && m.carburant && <span className="inline-flex items-center gap-1.5 capitalize"><Fuel className="h-3.5 w-3.5" /> {m.carburant}</span>}
    </div>
  );
}

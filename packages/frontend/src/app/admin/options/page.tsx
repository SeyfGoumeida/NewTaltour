'use client';

import CrudPage from '@/components/admin/CrudPage';
import { Badge } from '@/components/ui';
import { optionPrixLabel } from '@/lib/format';

const TYPES = [
  { value: 'fixe', label: 'Prix fixe' },
  { value: 'par_jour', label: 'Prix par jour' },
  { value: 'pourcentage', label: '% du tarif de location' },
];

export default function OptionsPage() {
  return (
    <CrudPage
      title="Options"
      sub="Options proposées lors de la réservation (assurance Gold, siège bébé, chauffeur…)."
      endpoint="/admin/options"
      itemLabel="Option"
      clientSearch={(r, t) => `${r.code} ${r.libelle}`.toLowerCase().includes(t)}
      searchPlaceholder="Rechercher une option…"
      toggle={{ key: 'actif', label: 'Active' }}
      rowTitle={(r) => r.libelle}
      wide
      defaults={{ code: '', libelle: '', libelle_court: '', description: '', type_prix: 'fixe', prix: '', actif: true, ordre: 0 }}
      columns={[
        { key: 'libelle', label: 'Libellé', className: 'max-w-[460px] whitespace-normal', render: (r) => <div><div className="font-medium text-white">{r.libelle}</div><div className="text-xs text-muted">{r.code}</div></div> },
        { key: 'type_prix', label: 'Type', render: (r) => <Badge tone={r.type_prix === 'pourcentage' ? 'accent' : r.type_prix === 'par_jour' ? 'info' : 'muted'}>{TYPES.find((t) => t.value === r.type_prix)?.label}</Badge> },
        { key: 'prix', label: 'Prix', right: true, render: (r) => <span className="font-semibold text-white">{optionPrixLabel({ type_prix: r.type_prix, prix: r.prix })}</span> },
        { key: 'ordre', label: 'Ordre', right: true },
      ]}
      fields={[
        { key: 'libelle', label: 'Libellé', required: true, full: true },
        { key: 'code', label: 'Code technique', required: true, hint: 'Identifiant unique, ex. siege_bebe' },
        { key: 'libelle_court', label: 'Libellé court', nullable: true },
        { key: 'type_prix', label: 'Type de prix', type: 'select', options: TYPES, required: true },
        { key: 'prix', label: 'Prix (€ ou %)', type: 'number', step: '0.01', min: 0, required: true },
        { key: 'ordre', label: "Ordre d'affichage", type: 'number', required: true },
        { key: 'actif', label: 'Option active', type: 'switch' },
        { key: 'description', label: 'Description', type: 'textarea', nullable: true },
      ]}
    />
  );
}

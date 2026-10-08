'use client';

import Link from 'next/link';
import CrudPage from '@/components/admin/CrudPage';
import { num, Thumb, useAdmin } from '@/components/admin/kit';
import { Badge } from '@/components/ui';

const STATUTS = [
  { value: 'disponible', label: 'Disponible' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'hors_service', label: 'Hors service' },
];
const TONE: Record<string, 'ok' | 'warn' | 'danger'> = { disponible: 'ok', maintenance: 'warn', hors_service: 'danger' };

export default function FlottePage() {
  const { data: modeles } = useAdmin<any[]>('/admin/modeles');
  const { data: villes } = useAdmin<any[]>('/admin/villes');
  return (
    <CrudPage
      title="Véhicules"
      sub="Parc automobile : immatriculations, affectation par ville et état."
      endpoint="/admin/vehicules"
      itemLabel="Véhicule"
      serverSearch
      searchPlaceholder="Immatriculation, modèle, ville…"
      rowTitle={(r) => `${r.immatriculation} (${r.modele_nom})`}
      filter={{ label: 'Statut', options: [...STATUTS, { value: 'loue', label: 'Loué actuellement' }], test: (r, v) => (v === 'loue' ? !!r.loue_ref : r.statut === v) }}
      wide
      defaults={{ modele_id: '', immatriculation: '', annee: new Date().getFullYear(), couleur: '', ville_id: '', kilometrage: 0, statut: 'disponible', notes: '' }}
      toForm={(r) => ({ modele_id: String(r.modele_id), immatriculation: r.immatriculation, annee: r.annee, couleur: r.couleur || '', ville_id: String(r.ville_id), kilometrage: r.kilometrage, statut: r.statut, notes: r.notes || '' })}
      toPayload={(f) => ({ ...f, modele_id: Number(f.modele_id), ville_id: Number(f.ville_id), annee: Number(f.annee), kilometrage: Number(f.kilometrage || 0), couleur: f.couleur?.trim() || null, notes: f.notes?.trim() || null })}
      columns={[
        { key: 'modele_nom', label: 'Modèle', render: (r) => (
          <div className="flex items-center gap-3"><Thumb src={r.modele_image} /><div className="max-w-[240px] truncate font-medium text-white" title={r.modele_nom}>{r.modele_nom}</div></div>
        ) },
        { key: 'immatriculation', label: 'Immatriculation', render: (r) => <span className="font-mono text-xs text-white">{r.immatriculation}</span> },
        { key: 'ville_nom', label: 'Ville' },
        { key: 'annee', label: 'Année · couleur', render: (r) => <span>{r.annee}{r.couleur && <span className="text-muted"> · {r.couleur}</span>}</span> },
        { key: 'kilometrage', label: 'Kilométrage', right: true, render: (r) => `${num(r.kilometrage)} km` },
        { key: 'statut', label: 'État', render: (r) => (
          <div className="flex flex-col items-start gap-1">
            <Badge tone={TONE[r.statut]}>{STATUTS.find((s) => s.value === r.statut)?.label}</Badge>
            {r.loue_ref && <Link href={`/admin/reservations/${r.loue_ref}`} onClick={(e) => e.stopPropagation()}><Badge tone="accent">Loué ({r.loue_ref})</Badge></Link>}
          </div>
        ) },
      ]}
      fields={[
        { key: 'modele_id', label: 'Modèle', type: 'select', required: true, full: true, options: (modeles || []).map((m) => ({ value: String(m.id), label: `${m.nom_affiche}${m.site === 'ma' ? ' (Marrakech)' : ''}` })) },
        { key: 'immatriculation', label: 'Immatriculation', required: true },
        { key: 'ville_id', label: 'Ville de rattachement', type: 'select', required: true, options: (villes || []).map((v) => ({ value: String(v.id), label: v.nom })) },
        { key: 'annee', label: 'Année', type: 'number', min: 1990, required: true },
        { key: 'couleur', label: 'Couleur' },
        { key: 'kilometrage', label: 'Kilométrage', type: 'number', min: 0, required: true },
        { key: 'statut', label: 'État', type: 'select', required: true, options: STATUTS },
        { key: 'notes', label: 'Notes', type: 'textarea' },
      ]}
    />
  );
}

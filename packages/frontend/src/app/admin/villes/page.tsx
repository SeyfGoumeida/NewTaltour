'use client';

import { Plane } from 'lucide-react';
import CrudPage from '@/components/admin/CrudPage';
import { Badge } from '@/components/ui';

const SITES = [
  { value: '', label: 'Taltour Algérie' },
  { value: 'ma', label: 'Ouziad Marrakech Cars' },
];

export default function VillesPage() {
  return (
    <CrudPage
      title="Villes & agences"
      sub="Points de livraison et de restitution, agents sur place et point de rendez-vous."
      endpoint="/admin/villes"
      itemLabel="Ville"
      serverSearch
      searchPlaceholder="Rechercher une ville…"
      toggle={{ key: 'actif', label: 'Active' }}
      filter={{ label: 'Site', options: [{ value: 'dz', label: 'Taltour Algérie' }, { value: 'ma', label: 'Ouziad Marrakech' }], test: (r, v) => (r.site || 'dz') === v }}
      wide
      defaults={{ nom: '', site: '', latitude: '', longitude: '', aeroport: true, point_rdv: '', agent_nom: '', agent_tel: '', actif: true, ordre: 0 }}
      toForm={(r) => ({ ...r, site: r.site || '', point_rdv: r.point_rdv || '', agent_nom: r.agent_nom || '', agent_tel: r.agent_tel || '' })}
      columns={[
        { key: 'nom', label: 'Ville', render: (r) => <div className="flex items-center gap-2"><span className="font-medium text-white">{r.nom}</span>{r.aeroport && <span title="Aéroport" className="text-brand-cyan"><Plane className="h-3.5 w-3.5" /></span>}</div> },
        { key: 'site', label: 'Site', render: (r) => <Badge tone={r.site === 'ma' ? 'gold' : 'info'}>{r.site === 'ma' ? 'Marrakech' : 'Algérie'}</Badge> },
        { key: 'point_rdv', label: 'Point de rendez-vous', className: 'max-w-[320px] whitespace-normal text-xs text-soft', render: (r) => r.point_rdv || '—' },
        { key: 'agent', label: 'Agent', render: (r) => (r.agent_nom ? <div><div className="text-white">{r.agent_nom}</div><div className="text-xs text-muted">{r.agent_tel}</div></div> : '—') },
        { key: 'ordre', label: 'Ordre', right: true },
      ]}
      fields={[
        { key: 'nom', label: 'Nom', required: true },
        { key: 'site', label: 'Site', type: 'select', options: SITES, nullable: true },
        { key: 'latitude', label: 'Latitude', type: 'number', step: 'any', required: true },
        { key: 'longitude', label: 'Longitude', type: 'number', step: 'any', required: true },
        { key: 'agent_nom', label: "Nom de l'agent", nullable: true },
        { key: 'agent_tel', label: "Téléphone de l'agent", nullable: true },
        { key: 'ordre', label: "Ordre d'affichage", type: 'number', required: true },
        { key: 'aeroport', label: 'Aéroport', type: 'switch' },
        { key: 'point_rdv', label: 'Point de rendez-vous', type: 'textarea', nullable: true },
        { key: 'actif', label: 'Ville active', type: 'switch' },
      ]}
    />
  );
}

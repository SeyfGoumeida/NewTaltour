'use client';

import CrudPage from '@/components/admin/CrudPage';
import { Badge } from '@/components/ui';
import { dateFr } from '@/lib/format';

const coefLabel = (c: number) => {
  const p = Math.round((Number(c) - 1) * 100);
  return `${p >= 0 ? '+' : ''}${p} %`;
};

function etat(r: Record<string, any>) {
  const today = new Date().toISOString().slice(0, 10);
  if (r.date_fin < today) return <Badge tone="muted">Passée</Badge>;
  if (r.date_debut > today) return <Badge tone="info">À venir</Badge>;
  return <Badge tone="ok">En cours</Badge>;
}

export default function SaisonsPage() {
  return (
    <CrudPage
      title="Saisons"
      sub="Périodes de haute ou basse saison : le coefficient s'applique au prix journalier (1,30 = +30 %)."
      endpoint="/admin/saisons"
      itemLabel="Saison"
      defaults={{ nom: '', date_debut: '', date_fin: '', coefficient: '1.30' }}
      columns={[
        { key: 'nom', label: 'Nom', render: (r) => <span className="font-medium text-white">{r.nom}</span> },
        { key: 'date_debut', label: 'Période', render: (r) => `${dateFr(r.date_debut)} → ${dateFr(r.date_fin)}` },
        { key: 'coefficient', label: 'Coefficient', render: (r) => <span><Badge tone={r.coefficient >= 1 ? 'accent' : 'ok'}>{coefLabel(r.coefficient)}</Badge> <span className="ml-1 text-xs text-muted">× {Number(r.coefficient).toFixed(2)}</span></span> },
        { key: 'etat', label: 'État', render: etat },
      ]}
      fields={[
        { key: 'nom', label: 'Nom', required: true, full: true, placeholder: 'Haute saison 2027' },
        { key: 'date_debut', label: 'Date de début', type: 'date', required: true },
        { key: 'date_fin', label: 'Date de fin', type: 'date', required: true },
        { key: 'coefficient', label: 'Coefficient', type: 'number', step: '0.01', min: 0.1, required: true, hint: '1,30 = +30 % ; 0,90 = -10 %' },
      ]}
    />
  );
}

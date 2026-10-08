'use client';

import CrudPage from '@/components/admin/CrudPage';
import { Badge } from '@/components/ui';
import { dateFr, euro } from '@/lib/format';

export default function CouponsPage() {
  return (
    <CrudPage
      title="Codes promo"
      sub="Réductions saisies par les clients lors de la réservation."
      endpoint="/admin/coupons"
      itemLabel="Code promo"
      serverSearch
      searchPlaceholder="Rechercher un code…"
      toggle={{ key: 'actif', label: 'Actif' }}
      rowTitle={(r) => r.code}
      defaults={{ code: '', type: 'pourcentage', valeur: '', date_debut: '', date_fin: '', montant_min: '', utilisations_max: '', actif: true }}
      columns={[
        { key: 'code', label: 'Code', render: (r) => <span className="rounded-lg border border-dashed border-accent/40 bg-accent/10 px-2 py-1 font-mono text-xs font-bold text-accent">{r.code}</span> },
        { key: 'valeur', label: 'Réduction', render: (r) => <span className="font-semibold text-white">{r.type === 'pourcentage' ? `-${Number(r.valeur)} %` : `-${euro(r.valeur)}`}</span> },
        { key: 'validite', label: 'Validité', render: (r) => (r.date_debut || r.date_fin ? `${r.date_debut ? dateFr(r.date_debut) : '…'} → ${r.date_fin ? dateFr(r.date_fin) : '…'}` : <span className="text-muted">Permanente</span>) },
        { key: 'montant_min', label: 'Minimum', right: true, render: (r) => (r.montant_min ? euro(r.montant_min) : '—') },
        { key: 'utilisations', label: 'Utilisations', right: true, render: (r) => <span>{r.utilisations}{r.utilisations_max ? <span className="text-muted"> / {r.utilisations_max}</span> : ''}</span> },
        { key: 'etat', label: 'État', render: (r) => {
          const today = new Date().toISOString().slice(0, 10);
          if (!r.actif) return <Badge tone="muted">Inactif</Badge>;
          if (r.date_fin && r.date_fin < today) return <Badge tone="danger">Expiré</Badge>;
          if (r.date_debut && r.date_debut > today) return <Badge tone="info">À venir</Badge>;
          if (r.utilisations_max && r.utilisations >= r.utilisations_max) return <Badge tone="warn">Épuisé</Badge>;
          return <Badge tone="ok">Valide</Badge>;
        } },
      ]}
      fields={[
        { key: 'code', label: 'Code', required: true, hint: 'Converti en majuscules' },
        { key: 'type', label: 'Type', type: 'select', required: true, options: [{ value: 'pourcentage', label: 'Pourcentage' }, { value: 'montant', label: 'Montant fixe (€)' }] },
        { key: 'valeur', label: 'Valeur', type: 'number', step: '0.01', min: 0, required: true },
        { key: 'montant_min', label: 'Montant minimum de commande (€)', type: 'number', step: '0.01', nullable: true },
        { key: 'date_debut', label: 'Début de validité', type: 'date', nullable: true },
        { key: 'date_fin', label: 'Fin de validité', type: 'date', nullable: true },
        { key: 'utilisations_max', label: "Nombre max d'utilisations", type: 'number', nullable: true, hint: 'Vide = illimité' },
        { key: 'actif', label: 'Code actif', type: 'switch' },
      ]}
    />
  );
}

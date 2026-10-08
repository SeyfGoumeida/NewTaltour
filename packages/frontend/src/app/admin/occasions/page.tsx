'use client';

import CrudPage from '@/components/admin/CrudPage';
import { Thumb, num, useAdmin } from '@/components/admin/kit';
import { euro } from '@/lib/format';

export default function OccasionsPage() {
  const { data: modeles } = useAdmin<any[]>('/admin/modeles');
  const opts = (modeles || []).map((m) => ({ value: String(m.id), label: `${m.nom_affiche}${m.site === 'ma' ? ' (Marrakech)' : ''}` }));
  const byId = new Map((modeles || []).map((m) => [m.id, m]));
  return (
    <CrudPage
      title="Occasions"
      sub="Véhicules d'occasion à vendre."
      endpoint="/admin/occasions"
      itemLabel="Annonce"
      serverSearch
      searchPlaceholder="Rechercher une annonce…"
      toggle={{ key: 'publie', label: 'Publiée' }}
      wide
      defaults={{ titre: '', modele_id: '', annee: '', kilometrage: '', prix: '', image: '', publie: true, description: '' }}
      toForm={(r) => ({ ...r, modele_id: r.modele_id ? String(r.modele_id) : '', annee: r.annee ?? '', kilometrage: r.kilometrage ?? '', image: r.image || '', description: r.description || '' })}
      toPayload={(f) => ({
        titre: f.titre, description: f.description?.trim() || null, modele_id: f.modele_id ? Number(f.modele_id) : null,
        annee: f.annee === '' ? null : Number(f.annee), kilometrage: f.kilometrage === '' ? null : Number(f.kilometrage),
        prix: Number(f.prix), image: f.image?.trim() || null, publie: !!f.publie,
      })}
      columns={[
        { key: 'titre', label: 'Annonce', render: (r) => (
          <div className="flex items-center gap-3"><Thumb src={r.image || byId.get(r.modele_id)?.image} /><div className="max-w-[360px] whitespace-normal font-medium text-white">{r.titre}</div></div>
        ) },
        { key: 'annee', label: 'Année', render: (r) => r.annee || '—' },
        { key: 'kilometrage', label: 'Kilométrage', right: true, render: (r) => (r.kilometrage != null ? `${num(r.kilometrage)} km` : '—') },
        { key: 'prix', label: 'Prix', right: true, render: (r) => <span className="font-semibold text-white">{euro(r.prix)}</span> },
      ]}
      fields={[
        { key: 'titre', label: 'Titre', required: true, full: true },
        { key: 'modele_id', label: 'Modèle associé', type: 'select', options: opts, nullable: true },
        { key: 'prix', label: 'Prix (€)', type: 'number', step: '0.01', min: 0, required: true },
        { key: 'annee', label: 'Année', type: 'number' },
        { key: 'kilometrage', label: 'Kilométrage', type: 'number', min: 0 },
        { key: 'image', label: 'Image (chemin)', placeholder: '/cars/…', full: true, hint: "Laisser vide pour utiliser l'image du modèle" },
        { key: 'publie', label: 'Annonce publiée', type: 'switch' },
        { key: 'description', label: 'Description', type: 'textarea' },
      ]}
    />
  );
}

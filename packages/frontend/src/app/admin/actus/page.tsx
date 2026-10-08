'use client';

import CrudPage, { FieldDef } from '@/components/admin/CrudPage';
import { dateFr } from '@/lib/format';

const slugify = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 200);

const FIELDS: FieldDef[] = [
  { key: 'titre', label: 'Titre', required: true, full: true },
  { key: 'slug', label: 'Slug (URL)', hint: 'Laisser vide pour le générer depuis le titre' },
  { key: 'auteur', label: 'Auteur', nullable: true },
  { key: 'date_publication', label: 'Date de publication', type: 'date', required: true },
  { key: 'publie', label: 'Publié', type: 'switch' },
  { key: 'contenu', label: 'Contenu', type: 'markdown', required: true, hint: 'Mise en forme : « ## » titre, « - » liste, ligne vide = paragraphe.' },
];

export default function ActusPage() {
  return (
    <CrudPage
      title="Actualités"
      sub="Articles du blog Taltour."
      endpoint="/admin/articles"
      itemLabel="Article"
      serverSearch
      searchPlaceholder="Rechercher un article…"
      toggle={{ key: 'publie', label: 'Publié' }}
      wide
      defaults={{ titre: '', slug: '', auteur: '', date_publication: new Date().toISOString().slice(0, 10), publie: true, contenu: '' }}
      toForm={(r) => ({ titre: r.titre, slug: r.slug, auteur: r.auteur || '', date_publication: String(r.date_publication).slice(0, 10), publie: r.publie, contenu: r.contenu })}
      toPayload={(f) => ({ ...f, slug: f.slug?.trim() || slugify(f.titre || ''), auteur: f.auteur?.trim() || null })}
      columns={[
        { key: 'titre', label: 'Titre', className: 'max-w-[420px] whitespace-normal', render: (r) => <div><div className="font-medium text-white">{r.titre}</div><div className="text-xs text-muted">/actus/{r.slug}</div></div> },
        { key: 'auteur', label: 'Auteur', render: (r) => r.auteur || '—' },
        { key: 'date_publication', label: 'Date', render: (r) => dateFr(r.date_publication) },
      ]}
      fields={FIELDS}
    />
  );
}

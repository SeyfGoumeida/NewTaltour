'use client';

import Link from 'next/link';
import { useState } from 'react';
import { EmptyRow, errMsg, LoadingRow, PageHead, qs, rowCls, TableBox, Td, Th, useAdmin } from '@/components/admin/kit';
import { Alert, Badge, Pagination, type Tone } from '@/components/ui';
import { dateHeure } from '@/lib/format';

const SIZE = 50;
const TABLES: Record<string, string> = {
  commandes: 'Réservation', contacts: 'Client', modeles: 'Modèle', vehicules: 'Véhicule', villes: 'Ville', options: 'Option', saisons: 'Saison',
  coupons: 'Code promo', articles: 'Article', faq: 'FAQ', occasions: 'Occasion', avis: 'Avis', messages_contact: 'Message', demandes_transfert: 'Transfert',
  pages: 'Page', parametres: 'Paramètres', sites: 'Site',
};
const TONE: Record<string, Tone> = { création: 'ok', modification: 'info', suppression: 'danger', paiement: 'gold', annulation: 'danger', avoir: 'accent', publication: 'ok', masquage: 'muted' };

function link(a: any) {
  if (a.table_name === 'contacts' && a.record_id) return `/admin/clients/${a.record_id}`;
  const map: Record<string, string> = { modeles: '/admin/modeles', vehicules: '/admin/flotte', villes: '/admin/villes', options: '/admin/options', saisons: '/admin/saisons', coupons: '/admin/codes-promo', articles: '/admin/actus', faq: '/admin/faq', occasions: '/admin/occasions', avis: '/admin/avis', pages: '/admin/pages', parametres: '/admin/parametres', sites: '/admin/parametres', demandes_transfert: '/admin/transferts', messages_contact: '/admin/messages' };
  return map[a.table_name];
}

function summary(d: any) {
  if (!d || typeof d !== 'object') return '';
  return Object.entries(d)
    .filter(([, v]) => v !== null && v !== '' && typeof v !== 'object')
    .slice(0, 5)
    .map(([k, v]) => `${k}: ${String(v).slice(0, 40)}`)
    .join(' · ');
}

export default function JournalPage() {
  const [page, setPage] = useState(1);
  const { data, error, isLoading } = useAdmin<{ items: any[]; total: number }>(qs('/admin/audit', { page, size: SIZE }));
  return (
    <div>
      <PageHead title="Journal d'activité" sub="Historique des actions effectuées par les administrateurs." />
      {error && <Alert tone="danger" className="mb-4">{errMsg(error)}</Alert>}
      <TableBox>
        <thead><tr><Th>Date</Th><Th>Administrateur</Th><Th>Action</Th><Th>Élément</Th><Th>Détails</Th></tr></thead>
        <tbody>
          {isLoading && !data ? <LoadingRow cols={5} /> : !data?.items.length ? <EmptyRow cols={5}>Aucune action enregistrée</EmptyRow> : data.items.map((a) => {
            const href = a.table_name === 'commandes' ? null : link(a);
            return (
              <tr key={a.id} className={rowCls}>
                <Td className="whitespace-nowrap text-soft">{dateHeure(a.created_at)}</Td>
                <Td className="text-white">{a.prenom ? `${a.prenom} ${a.nom}` : <span className="text-muted">Supprimé</span>}</Td>
                <Td><Badge tone={TONE[a.action] || 'muted'}>{a.action}</Badge></Td>
                <Td>
                  {href ? <Link href={href} className="text-brand-cyan hover:underline">{TABLES[a.table_name] || a.table_name}{a.record_id ? ` #${a.record_id}` : ''}</Link>
                    : <span className="text-soft">{TABLES[a.table_name] || a.table_name || '—'}{a.record_id ? ` #${a.record_id}` : ''}</span>}
                  {a.details?.slug && <span className="ml-1 text-xs text-muted">({a.details.slug})</span>}
                  {a.details?.cle && <span className="ml-1 text-xs text-muted">({a.details.cle})</span>}
                </Td>
                <Td><div className="max-w-[420px] truncate text-xs text-muted" title={a.details ? JSON.stringify(a.details) : ''}>{summary(a.details) || '—'}</div></Td>
              </tr>
            );
          })}
        </tbody>
      </TableBox>
      {data && <Pagination page={page} total={data.total} size={SIZE} onPage={setPage} />}
    </div>
  );
}

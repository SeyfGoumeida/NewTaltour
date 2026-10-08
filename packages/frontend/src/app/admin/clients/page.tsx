'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { EmptyRow, errMsg, LoadingRow, PageHead, qs, rowCls, SearchBox, TableBox, Td, Th, useAdmin } from '@/components/admin/kit';
import { Alert, Badge, Pagination } from '@/components/ui';
import { dateFr, euro } from '@/lib/format';

const SIZE = 25;

export default function ClientsPage() {
  const router = useRouter();
  const [term, setTerm] = useState('');
  const [page, setPage] = useState(1);
  const { data, error, isLoading } = useAdmin<{ items: any[]; total: number }>(qs('/admin/contacts', { q: term, page, size: SIZE }));

  return (
    <div>
      <PageHead title="Clients" sub={data ? `${data.total.toLocaleString('fr-FR')} compte(s)` : ' '} />
      <div className="mb-4">
        <SearchBox value={term} onChange={(v) => { setTerm(v); setPage(1); }} placeholder="Nom, prénom, email, téléphone, ville…" className="w-full sm:w-96" />
      </div>
      {error && <Alert tone="danger" className="mb-4">{errMsg(error)}</Alert>}
      <TableBox>
        <thead>
          <tr><Th>Client</Th><Th>Contact</Th><Th right>Réservations</Th><Th right>Total dépensé</Th><Th>Dernière location</Th><Th right>Avoir</Th><Th>Inscrit le</Th></tr>
        </thead>
        <tbody>
          {isLoading && !data ? <LoadingRow cols={7} /> : !data?.items.length ? <EmptyRow cols={7}>Aucun client trouvé</EmptyRow> : data.items.map((c) => (
            <tr key={c.id} className={`${rowCls} cursor-pointer`} onClick={() => router.push(`/admin/clients/${c.id}`)}>
              <Td>
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-blue/15 text-xs font-bold text-[#B9CCFF]">{(c.prenom?.[0] || '') + (c.nom?.[0] || '')}</span>
                  <div>
                    <div className="flex items-center gap-2 font-medium text-white">{c.prenom} {c.nom} {c.role === 10 && <Badge tone="accent">Admin</Badge>}</div>
                    <div className="text-xs text-muted">{c.email}</div>
                  </div>
                </div>
              </Td>
              <Td><div className="text-soft">{c.tel || '—'}</div><div className="text-xs text-muted">{[c.commune, c.pays].filter(Boolean).join(', ') || '—'}</div></Td>
              <Td right className="font-semibold text-white">{c.reservations}</Td>
              <Td right className="tabular-nums text-white">{euro(c.total_depense)}</Td>
              <Td className="text-soft">{c.derniere_location ? dateFr(c.derniere_location) : '—'}</Td>
              <Td right>{Number(c.avoir) > 0 ? <span className="font-semibold text-gold">{euro(c.avoir)}</span> : <span className="text-muted">—</span>}</Td>
              <Td className="text-muted">{dateFr(c.created_at)}</Td>
            </tr>
          ))}
        </tbody>
      </TableBox>
      {data && <Pagination page={page} total={data.total} size={SIZE} onPage={setPage} />}
    </div>
  );
}

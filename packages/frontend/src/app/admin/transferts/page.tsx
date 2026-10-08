'use client';

import { useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { EmptyRow, errMsg, LoadingRow, PageHead, rowCls, TableBox, Td, Th, useAdmin, useToast } from '@/components/admin/kit';
import { Alert, Select, Tabs } from '@/components/ui';
import { dateFr, dateHeure } from '@/lib/format';

const STATUTS: Record<string, { label: string }> = {
  nouvelle: { label: 'Nouvelle' },
  devis_envoye: { label: 'Devis envoyé' },
  confirmee: { label: 'Confirmée' },
  annulee: { label: 'Annulée' },
};

const DOT: Record<string, string> = { nouvelle: 'bg-warn', devis_envoye: 'bg-brand-blue', confirmee: 'bg-ok', annulee: 'bg-danger' };

export default function TransfertsPage() {
  const toast = useToast();
  const { data, error, isLoading, mutate } = useAdmin<any[]>('/admin/transferts');
  const { mutate: mutateDash } = useAdmin('/admin/dashboard');
  const [tab, setTab] = useState('');
  const rows = useMemo(() => (data || []).filter((d) => !tab || d.statut === tab), [data, tab]);
  const count = (s: string) => (data || []).filter((d) => d.statut === s).length;

  const setStatut = async (d: any, statut: string) => {
    mutate((l) => l?.map((x) => (x.id === d.id ? { ...x, statut } : x)), { revalidate: false });
    try {
      await api(`/admin/transferts/${d.id}`, { method: 'PUT', body: { statut } });
      toast(`Demande de ${d.nom} : ${STATUTS[statut].label}`);
      mutateDash();
    } catch (e) {
      toast(errMsg(e), 'danger');
    }
    mutate();
  };

  return (
    <div>
      <PageHead title="Transferts aéroport" sub="Demandes de transfert avec chauffeur." />
      <div className="mb-4">
        <Tabs value={tab} onChange={setTab} items={[{ value: '', label: `Toutes (${data?.length ?? 0})` }, ...Object.entries(STATUTS).map(([k, v]) => ({ value: k, label: `${v.label} (${count(k)})` }))]} />
      </div>
      {error && <Alert tone="danger" className="mb-4">{errMsg(error)}</Alert>}
      <TableBox>
        <thead><tr><Th>Demandeur</Th><Th>Arrivée</Th><Th>Aéroport → Destination</Th><Th right>Pers.</Th><Th>Vol</Th><Th>Message</Th><Th>Statut</Th></tr></thead>
        <tbody>
          {isLoading && !data ? <LoadingRow cols={7} /> : !rows.length ? <EmptyRow cols={7}>Aucune demande</EmptyRow> : rows.map((d) => (
            <tr key={d.id} className={rowCls}>
              <Td>
                <div className="font-medium text-white">{d.nom}</div>
                <div className="text-xs text-muted"><a href={`mailto:${d.email}`} className="hover:text-brand-cyan">{d.email}</a></div>
                {d.tel && <div className="text-xs text-muted"><a href={`tel:${d.tel}`} className="hover:text-white">{d.tel}</a></div>}
                <div className="text-[11px] text-muted/80">Reçue le {dateFr(d.created_at)}</div>
              </Td>
              <Td className="font-medium text-white">{dateHeure(d.date_arrivee)}</Td>
              <Td><div className="text-white">{d.aeroport || '—'}</div><div className="max-w-[240px] truncate text-xs text-muted">{d.destination}</div></Td>
              <Td right>{d.passagers}</Td>
              <Td className="font-mono text-xs">{d.num_vol || '—'}</Td>
              <Td><div className="max-w-[200px] whitespace-normal text-xs text-soft">{d.message || <span className="text-muted">—</span>}</div></Td>
              <Td>
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${DOT[d.statut] || 'bg-muted'}`} />
                  <Select className="h-9 w-36 py-1.5 text-xs" value={d.statut} onChange={(e) => setStatut(d, e.target.value)} aria-label="Changer le statut">
                    {Object.entries(STATUTS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </Select>
                </div>
              </Td>
            </tr>
          ))}
        </tbody>
      </TableBox>
    </div>
  );
}

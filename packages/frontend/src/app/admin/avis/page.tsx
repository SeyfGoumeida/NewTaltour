'use client';

import clsx from 'clsx';
import Link from 'next/link';
import { useState } from 'react';
import { Eye, EyeOff, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { ConfirmModal, errMsg, PageHead, qs, useAdmin, useToast } from '@/components/admin/kit';
import { Alert, Badge, Empty, Loading, Pagination, Select, Stars, Tabs } from '@/components/ui';
import { dateFr } from '@/lib/format';

const SIZE = 30;

export default function AvisPage() {
  const toast = useToast();
  const [note, setNote] = useState('');
  const [publie, setPublie] = useState<'' | '1' | '0'>('');
  const [page, setPage] = useState(1);
  const [del, setDel] = useState<any>(null);
  const { data, error, isLoading, mutate } = useAdmin<{ items: any[]; total: number }>(qs('/admin/avis', { note, publie, page, size: SIZE }));

  const toggle = async (a: any) => {
    mutate((d) => (d ? { ...d, items: d.items.map((x) => (x.id === a.id ? { ...x, publie: !a.publie } : x)) } : d), { revalidate: false });
    try {
      await api(`/admin/avis/${a.id}`, { method: 'PUT', body: { publie: !a.publie } });
      toast(a.publie ? 'Avis masqué' : 'Avis publié');
    } catch (e) {
      toast(errMsg(e), 'danger');
    }
    mutate();
  };

  return (
    <div>
      <PageHead title="Avis clients" sub={data ? `${data.total.toLocaleString('fr-FR')} avis` : ' '} />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Tabs value={publie} onChange={(v) => { setPublie(v); setPage(1); }} items={[{ value: '', label: 'Tous' }, { value: '1', label: 'Publiés' }, { value: '0', label: 'Masqués' }]} />
        <Select className="w-full sm:w-44" value={note} onChange={(e) => { setNote(e.target.value); setPage(1); }}>
          <option value="">Toutes les notes</option>
          {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} étoile{n > 1 ? 's' : ''}</option>)}
        </Select>
      </div>
      {error && <Alert tone="danger" className="mb-4">{errMsg(error)}</Alert>}
      {isLoading && !data ? <Loading /> : !data?.items.length ? <Empty title="Aucun avis" /> : (
        <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
          {data.items.map((a) => (
            <div key={a.id} className={clsx('glass flex flex-col p-5', !a.publie && 'opacity-60')}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate font-semibold text-white">{a.auteur}</div>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-muted"><Stars value={a.note} size={13} /> {dateFr(a.created_at)}</div>
                </div>
                <Badge tone={a.publie ? 'ok' : 'muted'}>{a.publie ? 'Publié' : 'Masqué'}</Badge>
              </div>
              <div className="mt-3 flex-1 space-y-2 text-sm text-soft">
                {a.observation_reservation && <p><span className="text-xs text-muted">Réservation : </span>{a.observation_reservation}</p>}
                {a.observation_place && <p><span className="text-xs text-muted">Sur place : </span>{a.observation_place}</p>}
                {!a.observation_reservation && !a.observation_place && <p className="text-muted">Pas de commentaire</p>}
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
                {a.reference ? <Link href={`/admin/reservations/${a.reference}`} className="font-mono text-xs text-brand-cyan hover:underline">{a.reference}</Link> : <span className="text-xs text-muted">Avis importé</span>}
                <div className="flex gap-1">
                  <button onClick={() => toggle(a)} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-soft hover:bg-white/[0.06] hover:text-white">
                    {a.publie ? <><EyeOff className="h-3.5 w-3.5" /> Masquer</> : <><Eye className="h-3.5 w-3.5" /> Publier</>}
                  </button>
                  <button onClick={() => setDel(a)} className="rounded-lg p-1.5 text-muted hover:bg-danger/10 hover:text-danger" aria-label="Supprimer"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {data && <Pagination page={page} total={data.total} size={SIZE} onPage={setPage} />}
      <ConfirmModal open={!!del} onClose={() => setDel(null)} title="Supprimer l'avis"
        onConfirm={async () => { await api(`/admin/avis/${del.id}`, { method: 'DELETE' }); await mutate(); toast('Avis supprimé'); }}>
        Supprimer définitivement l&apos;avis de <strong className="text-white">{del?.auteur}</strong> ? Pour le retirer du site sans le perdre, masquez-le plutôt.
      </ConfirmModal>
    </div>
  );
}

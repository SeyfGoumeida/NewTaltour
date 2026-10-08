'use client';

import clsx from 'clsx';
import { useMemo, useState } from 'react';
import { Mail, MailOpen, Phone, Reply, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { ConfirmModal, errMsg, PageHead, SearchBox, useAdmin, useToast } from '@/components/admin/kit';
import { Alert, Empty, Loading, Tabs } from '@/components/ui';
import { dateHeure } from '@/lib/format';

type Msg = { id: number; email: string; nom: string; prenom: string | null; tel: string | null; message: string; lu: boolean; created_at: string };

export default function MessagesPage() {
  const toast = useToast();
  const { data, error, isLoading, mutate } = useAdmin<Msg[]>('/admin/messages');
  const { mutate: mutateDash } = useAdmin('/admin/dashboard');
  const [tab, setTab] = useState<'all' | 'unread'>('all');
  const [term, setTerm] = useState('');
  const [del, setDel] = useState<Msg | null>(null);

  const rows = useMemo(() => {
    const t = term.toLowerCase();
    return (data || []).filter((m) => (tab === 'all' || !m.lu) && (!t || `${m.nom} ${m.prenom} ${m.email} ${m.message}`.toLowerCase().includes(t)));
  }, [data, tab, term]);
  const unread = (data || []).filter((m) => !m.lu).length;

  const setLu = async (m: Msg, lu: boolean) => {
    if (m.lu === lu) return;
    mutate((d) => d?.map((x) => (x.id === m.id ? { ...x, lu } : x)), { revalidate: false });
    try {
      await api(`/admin/messages/${m.id}`, { method: 'PUT', body: { lu } });
      mutateDash();
    } catch (e) {
      toast(errMsg(e), 'danger');
      mutate();
    }
  };

  return (
    <div>
      <PageHead title="Messages" sub="Demandes reçues via le formulaire de contact." />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Tabs value={tab} onChange={setTab} items={[{ value: 'all', label: `Tous (${data?.length ?? 0})` }, { value: 'unread', label: `Non lus (${unread})` }]} />
        <SearchBox value={term} onChange={setTerm} placeholder="Rechercher…" className="w-full sm:w-72" delay={150} />
      </div>
      {error && <Alert tone="danger" className="mb-4">{errMsg(error)}</Alert>}
      {isLoading && !data ? <Loading /> : !rows.length ? <Empty icon={<Mail className="h-6 w-6" />} title="Aucun message" /> : (
        <div className="space-y-3">
          {rows.map((m) => (
            <div key={m.id} className={clsx('glass relative p-5', !m.lu && 'border-brand-blue/40')}>
              {!m.lu && <span className="absolute left-0 top-5 h-8 w-[3px] rounded-r-full bg-brand-blue" />}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={clsx('font-semibold', m.lu ? 'text-soft' : 'text-white')}>{m.prenom} {m.nom}</span>
                    {!m.lu && <span className="rounded-md bg-brand-blue/20 px-1.5 py-0.5 text-[10px] font-bold uppercase text-[#7EA6FF]">Nouveau</span>}
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                    <a href={`mailto:${m.email}`} className="hover:text-brand-cyan">{m.email}</a>
                    {m.tel && <a href={`tel:${m.tel}`} className="inline-flex items-center gap-1 hover:text-white"><Phone className="h-3 w-3" />{m.tel}</a>}
                    <span>{dateHeure(m.created_at)}</span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <a href={`mailto:${m.email}?subject=${encodeURIComponent('Re: votre message à Taltour')}&body=${encodeURIComponent(`Bonjour ${m.prenom || m.nom},\n\n\n\n> ${m.message.replace(/\n/g, '\n> ')}`)}`}
                    onClick={() => setLu(m, true)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-brand-blue px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-blue/90">
                    <Reply className="h-3.5 w-3.5" /> Répondre
                  </a>
                  <button onClick={() => setLu(m, !m.lu)} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-soft hover:bg-white/[0.06] hover:text-white">
                    {m.lu ? <><Mail className="h-3.5 w-3.5" /> Non lu</> : <><MailOpen className="h-3.5 w-3.5" /> Lu</>}
                  </button>
                  <button onClick={() => setDel(m)} className="rounded-lg p-1.5 text-muted hover:bg-danger/10 hover:text-danger" aria-label="Supprimer"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-soft">{m.message}</p>
            </div>
          ))}
        </div>
      )}
      <ConfirmModal open={!!del} onClose={() => setDel(null)} title="Supprimer le message"
        onConfirm={async () => { if (!del) return; await api(`/admin/messages/${del.id}`, { method: 'DELETE' }); await mutate(); mutateDash(); toast('Message supprimé'); }}>
        Supprimer le message de <strong className="text-white">{del?.prenom} {del?.nom}</strong> ?
      </ConfirmModal>
    </div>
  );
}

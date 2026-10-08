'use client';

import Link from 'next/link';
import { useState } from 'react';
import { ArrowLeft, Mail, Pencil, Phone, Plus } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/components/providers';
import { EmptyRow, errMsg, KV, PageHead, PaiementBadge, rowCls, StatutBadge, TableBox, Td, Th, useAdmin, useToast } from '@/components/admin/kit';
import { Alert, Badge, Button, Card, CardTitle, Field, Input, Loading, Modal, Select, Stars, Stat, Textarea } from '@/components/ui';
import { dateFr, euro } from '@/lib/format';

const EDIT_KEYS = ['prenom', 'nom', 'tel', 'societe', 'adresse', 'code_postal', 'commune', 'pays', 'num_permis', 'date_permis', 'date_naissance'] as const;
const LABELS: Record<string, string> = {
  prenom: 'Prénom', nom: 'Nom', tel: 'Téléphone', societe: 'Société', adresse: 'Adresse', code_postal: 'Code postal', commune: 'Commune', pays: 'Pays',
  num_permis: 'N° de permis', date_permis: 'Date du permis', date_naissance: 'Date de naissance',
};

export default function ClientDetail({ params }: { params: { id: string } }) {
  const toast = useToast();
  const { user } = useAuth();
  const { data: c, error, isLoading, mutate } = useAdmin<any>(`/admin/contacts/${params.id}`);
  const [form, setForm] = useState<Record<string, any> | null>(null);
  const [avoir, setAvoir] = useState<{ montant: string; motif: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (error) return <div className="space-y-4"><Back /><Alert tone="danger">{errMsg(error)}</Alert></div>;
  if (isLoading || !c) return <Loading />;

  const actives = c.commandes.filter((x: any) => x.statut !== 'annulee');
  const total = actives.reduce((s: number, x: any) => s + Number(x.montant_total), 0);
  const solde = c.avoirs.reduce((s: number, a: any) => s + Number(a.solde), 0);

  const openEdit = () => {
    setErr(null);
    setForm({ ...Object.fromEntries(EDIT_KEYS.map((k) => [k, c[k] ? String(c[k]).slice(0, k.startsWith('date') ? 10 : undefined) : ''])), role: c.role });
  };

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setBusy(true);
    setErr(null);
    try {
      const body: Record<string, any> = { role: Number(form.role) };
      for (const k of EDIT_KEYS) body[k] = typeof form[k] === 'string' ? form[k].trim() || null : form[k];
      body.nom = form.nom; body.prenom = form.prenom;
      await api(`/admin/contacts/${c.id}`, { method: 'PUT', body });
      await mutate();
      toast('Client mis à jour');
      setForm(null);
    } catch (e) {
      setErr(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  const saveAvoir = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!avoir) return;
    setBusy(true);
    setErr(null);
    try {
      await api(`/admin/contacts/${c.id}/avoirs`, { body: { montant: Number(avoir.montant), motif: avoir.motif } });
      await mutate();
      toast(`Avoir de ${euro(avoir.montant)} créé`);
      setAvoir(null);
    } catch (e) {
      setErr(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHead back={<Back />}
        title={<span className="flex flex-wrap items-center gap-3">{c.prenom} {c.nom} {c.role === 10 ? <Badge tone="accent">Administrateur</Badge> : <Badge tone="muted">Client</Badge>}</span>}
        sub={`Client depuis le ${dateFr(c.created_at)}`}
        actions={<>
          <Button variant="secondary" size="sm" onClick={openEdit}><Pencil className="h-4 w-4" /> Modifier</Button>
          <Button size="sm" onClick={() => { setErr(null); setAvoir({ montant: '', motif: '' }); }}><Plus className="h-4 w-4" /> Créer un avoir</Button>
        </>} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Réservations" value={c.commandes.length} sub={`${actives.length} non annulée(s)`} />
        <Stat label="Total dépensé" value={euro(total)} />
        <Stat label="Avoir disponible" value={<span className={solde > 0 ? 'text-gold' : ''}>{euro(solde)}</span>} />
        <Stat label="Avis laissés" value={c.avis.length} />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card>
          <CardTitle>Coordonnées</CardTitle>
          <div className="mb-3 space-y-1.5 text-sm">
            <a href={`mailto:${c.email}`} className="flex items-center gap-2 text-brand-cyan hover:underline"><Mail className="h-4 w-4" />{c.email}</a>
            {c.tel && <a href={`tel:${c.tel}`} className="flex items-center gap-2 text-soft hover:text-white"><Phone className="h-4 w-4" />{c.tel}</a>}
          </div>
          <div className="divide-y divide-line/60">
            {c.societe && <KV label="Société">{c.societe}</KV>}
            <KV label="Adresse">{c.adresse || '—'}</KV>
            <KV label="Ville">{[c.code_postal, c.commune].filter(Boolean).join(' ') || '—'}</KV>
            <KV label="Pays">{c.pays || '—'}</KV>
            <KV label="Date de naissance">{c.date_naissance ? dateFr(c.date_naissance) : '—'}</KV>
            <KV label="N° de permis">{c.num_permis || '—'}</KV>
            <KV label="Permis obtenu le">{c.date_permis ? dateFr(c.date_permis) : '—'}</KV>
          </div>
        </Card>

        <div className="space-y-6 xl:col-span-2">
          <div>
            <h3 className="mb-3 text-base font-semibold">Réservations</h3>
            <TableBox maxH={false}>
              <thead><tr><Th>Référence</Th><Th>Modèle</Th><Th>Période</Th><Th right>Montant</Th><Th>Statut</Th></tr></thead>
              <tbody>
                {!c.commandes.length ? <EmptyRow cols={5}>Aucune réservation</EmptyRow> : c.commandes.map((x: any) => (
                  <tr key={x.reference} className={rowCls}>
                    <Td><Link href={`/admin/reservations/${x.reference}`} className="font-mono text-xs font-semibold text-white hover:text-brand-cyan">{x.reference}</Link></Td>
                    <Td><div className="max-w-[200px] truncate text-soft" title={x.modele_nom}>{x.modele_nom}</div></Td>
                    <Td className="text-xs text-soft">{dateFr(x.date_depart)} → {dateFr(x.date_retour)}</Td>
                    <Td right className="font-semibold text-white">{euro(x.montant_total)}</Td>
                    <Td><div className="flex flex-col items-start gap-1"><StatutBadge statut={x.statut} /><PaiementBadge statut={x.statut_paiement} /></div></Td>
                  </tr>
                ))}
              </tbody>
            </TableBox>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardTitle>Avoirs</CardTitle>
              {!c.avoirs.length ? <div className="text-sm text-muted">Aucun avoir</div> : (
                <ul className="divide-y divide-line/60">
                  {c.avoirs.map((a: any) => (
                    <li key={a.id} className="flex items-start justify-between gap-3 py-2.5 text-sm">
                      <div className="min-w-0"><div className="text-white">{a.motif || 'Avoir'}</div><div className="text-xs text-muted">{dateFr(a.created_at)} · montant initial {euro(a.montant)}</div></div>
                      <span className={Number(a.solde) > 0 ? 'font-semibold text-gold' : 'text-muted'}>{euro(a.solde)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
            <Card>
              <CardTitle>Avis</CardTitle>
              {!c.avis.length ? <div className="text-sm text-muted">Aucun avis</div> : (
                <ul className="space-y-3">
                  {c.avis.map((a: any) => (
                    <li key={a.id} className="glass-soft p-3 text-sm">
                      <div className="flex items-center justify-between"><Stars value={a.note} /><span className="text-xs text-muted">{dateFr(a.created_at)}</span></div>
                      {a.observation_reservation && <p className="mt-1.5 text-soft">{a.observation_reservation}</p>}
                      {a.observation_place && <p className="mt-1 text-soft">{a.observation_place}</p>}
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </div>
      </div>

      <Modal open={!!form} onClose={() => setForm(null)} wide title="Modifier le client"
        footer={<><Button variant="ghost" onClick={() => setForm(null)}>Annuler</Button><Button type="submit" form="client-form" loading={busy}>Enregistrer</Button></>}>
        {form && (
          <form id="client-form" onSubmit={saveEdit} className="grid gap-4 sm:grid-cols-2">
            {err && <Alert tone="danger" className="sm:col-span-2">{err}</Alert>}
            {EDIT_KEYS.map((k) => (
              <Field key={k} label={LABELS[k]} required={k === 'nom' || k === 'prenom'} className={k === 'adresse' ? 'sm:col-span-2' : ''}>
                <Input type={k.startsWith('date') ? 'date' : 'text'} required={k === 'nom' || k === 'prenom'} value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
              </Field>
            ))}
            <Field label="Rôle" hint={c.id === user?.id ? 'Vous ne pouvez pas retirer vos propres droits.' : undefined}>
              <Select value={form.role} onChange={(e) => setForm({ ...form, role: Number(e.target.value) })} disabled={c.id === user?.id}>
                <option value={0}>Client</option>
                <option value={10}>Administrateur</option>
              </Select>
            </Field>
          </form>
        )}
      </Modal>

      <Modal open={!!avoir} onClose={() => setAvoir(null)} title="Créer un avoir"
        footer={<><Button variant="ghost" onClick={() => setAvoir(null)}>Annuler</Button><Button type="submit" form="avoir-form" loading={busy}>Créer l&apos;avoir</Button></>}>
        {avoir && (
          <form id="avoir-form" onSubmit={saveAvoir} className="space-y-4">
            {err && <Alert tone="danger">{err}</Alert>}
            <Field label="Montant (€)" required><Input type="number" step="0.01" min="0.01" required value={avoir.montant} onChange={(e) => setAvoir({ ...avoir, montant: e.target.value })} /></Field>
            <Field label="Motif" required><Textarea required maxLength={500} value={avoir.motif} onChange={(e) => setAvoir({ ...avoir, motif: e.target.value })} placeholder="Geste commercial, retard de livraison…" /></Field>
            <p className="text-xs text-muted">L&apos;avoir sera automatiquement proposé au client lors de sa prochaine réservation.</p>
          </form>
        )}
      </Modal>
    </div>
  );
}

function Back() {
  return <Link href="/admin/clients" className="inline-flex items-center gap-1.5 text-xs font-medium text-muted hover:text-white"><ArrowLeft className="h-3.5 w-3.5" /> Clients</Link>;
}

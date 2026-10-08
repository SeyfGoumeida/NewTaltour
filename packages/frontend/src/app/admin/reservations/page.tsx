'use client';

import Link from 'next/link';
import { Suspense, useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, RotateCcw } from 'lucide-react';
import { EmptyRow, errMsg, FilterBar, LoadingRow, MiniLabel, PageHead, PaiementBadge, qs, rowCls, SearchBox, StatutBadge, TableBox, Td, Th, Thumb, useAdmin } from '@/components/admin/kit';
import { Alert, Button, Input, Loading, Pagination, Select } from '@/components/ui';
import { dateFr, euro, STATUT_COMMANDE, STATUT_PAIEMENT } from '@/lib/format';

const KEYS = ['statut', 'statut_paiement', 'ville', 'site', 'du', 'au', 'q', 'tri', 'page'] as const;
const SIZE = 25;

function Reservations() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const f = Object.fromEntries(KEYS.map((k) => [k, sp.get(k) || ''])) as Record<(typeof KEYS)[number], string>;
  const page = Number(f.page) || 1;

  const set = useCallback((patch: Partial<Record<(typeof KEYS)[number], string>>) => {
    const next = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(patch)) (v ? next.set(k, v) : next.delete(k));
    if (!('page' in patch)) next.delete('page');
    const s = next.toString();
    router.replace(s ? `${pathname}?${s}` : pathname, { scroll: false });
  }, [sp, router, pathname]);

  const { data: villes } = useAdmin<any[]>('/admin/villes');
  const key = qs('/admin/commandes', { ...f, au: f.au ? `${f.au}T23:59` : '', page, size: SIZE });
  const { data, error, isLoading } = useAdmin<{ items: any[]; total: number; montant: number }>(key);
  const hasFilters = KEYS.some((k) => k !== 'page' && f[k]);

  return (
    <div>
      <PageHead title="Réservations" sub={data ? <>{data.total.toLocaleString('fr-FR')} réservation{data.total > 1 ? 's' : ''} · montant total <strong className="text-white">{euro(data.montant)}</strong></> : ' '} />

      <FilterBar>
        <div className="w-full sm:w-72">
          <MiniLabel>Recherche</MiniLabel>
          <SearchBox value={f.q} onChange={(v) => set({ q: v })} placeholder="Référence, client, email, modèle…" />
        </div>
        <div className="w-[calc(50%-6px)] sm:w-40">
          <MiniLabel>Statut</MiniLabel>
          <Select value={f.statut} onChange={(e) => set({ statut: e.target.value })}>
            <option value="">Tous</option>
            {Object.entries(STATUT_COMMANDE).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </Select>
        </div>
        <div className="w-[calc(50%-6px)] sm:w-44">
          <MiniLabel>Paiement</MiniLabel>
          <Select value={f.statut_paiement} onChange={(e) => set({ statut_paiement: e.target.value })}>
            <option value="">Tous</option>
            {Object.entries(STATUT_PAIEMENT).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </Select>
        </div>
        <div className="w-[calc(50%-6px)] sm:w-40">
          <MiniLabel>Ville de départ</MiniLabel>
          <Select value={f.ville} onChange={(e) => set({ ville: e.target.value })}>
            <option value="">Toutes</option>
            {(villes || []).map((v) => <option key={v.id} value={v.id}>{v.nom}</option>)}
          </Select>
        </div>
        <div className="w-[calc(50%-6px)] sm:w-36">
          <MiniLabel>Site</MiniLabel>
          <Select value={f.site} onChange={(e) => set({ site: e.target.value })}>
            <option value="">Tous</option>
            <option value="dz">Algérie</option>
            <option value="ma">Marrakech</option>
          </Select>
        </div>
        <div className="w-[calc(50%-6px)] sm:w-40">
          <MiniLabel>Départ du</MiniLabel>
          <Input type="date" value={f.du} onChange={(e) => set({ du: e.target.value })} />
        </div>
        <div className="w-[calc(50%-6px)] sm:w-40">
          <MiniLabel>au</MiniLabel>
          <Input type="date" value={f.au} onChange={(e) => set({ au: e.target.value })} />
        </div>
        <div className="w-full sm:w-48">
          <MiniLabel>Tri</MiniLabel>
          <Select value={f.tri} onChange={(e) => set({ tri: e.target.value })}>
            <option value="">Plus récentes</option>
            <option value="depart">Départ (plus tard d&apos;abord)</option>
            <option value="depart_asc">Départ (plus tôt d&apos;abord)</option>
            <option value="montant">Montant décroissant</option>
          </Select>
        </div>
        {hasFilters && (
          <Button variant="ghost" size="sm" className="mb-1" onClick={() => router.replace(pathname)}><RotateCcw className="h-3.5 w-3.5" /> Réinitialiser</Button>
        )}
      </FilterBar>

      {error && <Alert tone="danger" className="mb-4">{errMsg(error)}</Alert>}

      <TableBox>
        <thead>
          <tr>
            <Th>Référence</Th><Th>Client</Th><Th>Modèle</Th><Th>Départ → Retour</Th><Th right>Montant / payé</Th><Th>Statut</Th>
          </tr>
        </thead>
        <tbody>
          {isLoading && !data ? <LoadingRow cols={6} /> : !data?.items.length ? <EmptyRow cols={6}>Aucune réservation ne correspond à ces critères</EmptyRow> : data.items.map((c) => (
            <tr key={c.id} className={`${rowCls} cursor-pointer`} onClick={() => router.push(`/admin/reservations/${c.reference}`)}>
              <Td>
                <Link href={`/admin/reservations/${c.reference}`} className="font-mono text-xs font-semibold text-white hover:text-brand-cyan" onClick={(e) => e.stopPropagation()}>{c.reference}</Link>
                <div className="text-[11px] text-muted">{dateFr(c.created_at)}{c.site === 'ma' && ' · Marrakech'}</div>
              </Td>
              <Td><div className="max-w-[180px] truncate font-medium text-white">{c.prenom} {c.nom}</div><div className="max-w-[180px] truncate text-xs text-muted" title={c.email}>{c.email}</div></Td>
              <Td>
                <div className="flex items-center gap-3"><Thumb src={c.modele_image} />
                  <div><div className="max-w-[160px] truncate text-white" title={c.modele_nom}>{c.modele_nom}</div><div className="font-mono text-[11px] text-muted">{c.immatriculation || 'Non affecté'}</div></div>
                </div>
              </Td>
              <Td>
                <div className="flex items-center gap-1.5 text-white">{c.ville_depart} <ArrowRight className="h-3 w-3 text-muted" /> {c.ville_retour}</div>
                <div className="text-xs text-muted">{dateFr(c.date_depart)} → {dateFr(c.date_retour)} · <span className="text-soft">{c.jours} j</span></div>
              </Td>
                            <Td right>
                <div className="font-semibold text-white">{euro(c.montant_total)}</div>
                <div className={`text-xs ${Number(c.montant_paye) >= Number(c.montant_total) ? 'text-ok' : 'text-muted'}`}>{euro(c.montant_paye)}</div>
              </Td>
              <Td><div className="flex flex-col items-start gap-1"><StatutBadge statut={c.statut} /><PaiementBadge statut={c.statut_paiement} /></div></Td>
            </tr>
          ))}
        </tbody>
      </TableBox>
      {data && <Pagination page={page} total={data.total} size={SIZE} onPage={(p) => set({ page: String(p) })} />}
    </div>
  );
}

export default function ReservationsPage() {
  return (
    <Suspense fallback={<Loading />}>
      <Reservations />
    </Suspense>
  );
}

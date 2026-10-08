'use client';

import Link from 'next/link';
import { ArrowRight, Wallet } from 'lucide-react';
import { dateFr, euro } from '@/lib/format';
import { Alert, Badge, Empty, LinkButton, Loading } from '@/components/ui';
import { useApi } from '@/components/compte/hooks';
import { n, type Avoir } from '@/components/compte/lib';

export default function Avoirs() {
  const { data, error } = useApi<Avoir[]>('/compte/avoirs');
  const solde = (data ?? []).reduce((s, a) => s + n(a.solde), 0);

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Mes <span className="text-grad">avoirs</span></h1>
        <p className="mt-2 text-sm text-muted">Un avoir est crédité lorsque vous annulez en gardant la totalité du montant versé, ou lorsqu’un changement de modèle baisse le prix de votre réservation.</p>
      </div>

      <div className="glass relative overflow-hidden bg-gradient-to-br from-brand-blue/15 to-transparent p-6 sm:p-8">
        <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-brand-cyan/10 blur-3xl" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-brand-blue/30 bg-brand-blue/10 text-[#7EA6FF]"><Wallet className="h-7 w-7" /></span>
            <div>
              <div className="text-sm text-muted">Solde disponible</div>
              <div className="font-display text-4xl font-extrabold text-white">{data ? euro(solde) : '…'}</div>
            </div>
          </div>
          {solde > 0 && <LinkButton href="/" size="lg">Utiliser mon avoir <ArrowRight className="h-4 w-4" /></LinkButton>}
        </div>
        {solde > 0 && (
          <p className="relative mt-5 border-t border-line pt-4 text-sm text-soft">
            Lors de votre prochaine réservation, connectez-vous puis cochez « Utiliser mon avoir » à l’étape du paiement : le montant est déduit automatiquement du total.
          </p>
        )}
      </div>

      {error && <Alert tone="danger">{error.message}</Alert>}
      {!data && !error && <Loading />}
      {data && data.length === 0 && (
        <Empty icon={<Wallet className="h-6 w-6" />} title="Aucun avoir">Vous n’avez pas encore d’avoir sur votre compte.</Empty>
      )}
      {data && data.length > 0 && (
        <div className="glass">
          <ul className="divide-y divide-line">
            {data.map((a) => (
              <li key={a.id} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="font-medium text-white">{a.motif || 'Avoir'}</div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                    <span>le {dateFr(a.created_at)}</span>
                    {a.reference && <Link href={`/mon-compte/reservations/${a.reference}`} className="link font-mono">{a.reference}</Link>}
                  </div>
                </div>
                <div className="flex items-center gap-4 sm:text-right">
                  <div>
                    <div className="text-xs text-muted">Montant initial</div>
                    <div className="text-sm text-soft">{euro(a.montant)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted">Solde</div>
                    <div className="font-display text-lg font-bold text-white">{euro(a.solde)}</div>
                  </div>
                  {n(a.solde) <= 0 ? <Badge>Utilisé</Badge> : n(a.solde) < n(a.montant) ? <Badge tone="info">Partiel</Badge> : <Badge tone="ok">Disponible</Badge>}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

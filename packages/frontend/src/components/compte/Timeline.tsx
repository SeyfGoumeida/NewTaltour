import clsx from 'clsx';
import { Check, XCircle } from 'lucide-react';
import { dateFr, dateHeure, heureFr } from '@/lib/format';
import type { Commande } from '@/lib/types';

export default function Timeline({ c }: { c: Commande }) {
  const now = Date.now();
  const departed = c.statut === 'en_cours' || c.statut === 'terminee' || (c.statut === 'confirmee' && now >= new Date(c.date_depart).getTime());
  const steps = [
    { label: 'Réservée', date: dateFr(c.created_at), done: true },
    { label: 'Confirmée', date: c.statut === 'en_attente' ? 'En attente du paiement' : 'Paiement reçu', done: ['confirmee', 'en_cours', 'terminee'].includes(c.statut) },
    { label: 'Départ', date: `${dateFr(c.date_depart)} ${heureFr(c.date_depart)}`, done: departed },
    { label: 'Restitution', date: `${dateFr(c.date_retour)} ${heureFr(c.date_retour)}`, done: c.statut === 'terminee' },
  ];
  const cancelled = c.statut === 'annulee';
  const current = cancelled ? -1 : steps.findIndex((s) => !s.done);

  return (
    <div className="glass p-5 sm:p-6">
      {cancelled && (
        <div className="mb-5 flex items-center gap-2 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-[#FDA4B4]">
          <XCircle className="h-4 w-4 shrink-0" /> Réservation annulée{c.annulee_at ? ` le ${dateHeure(c.annulee_at)}` : ''}
        </div>
      )}
      <ol className={clsx('grid grid-cols-4', cancelled && 'opacity-50')}>
        {steps.map((s, i) => {
          const active = i === current;
          return (
            <li key={s.label} className="relative flex flex-col items-center text-center">
              {i > 0 && <span className={clsx('absolute right-1/2 top-4 h-0.5 w-full -translate-y-1/2', s.done ? 'bg-brand-blue' : 'bg-white/10')} />}
              <span className={clsx('relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold',
                s.done ? 'border-brand-blue bg-brand-blue text-white' : active ? 'border-accent bg-ink-850 text-accent' : 'border-white/15 bg-ink-850 text-muted')}>
                {s.done ? <Check className="h-4 w-4" /> : i + 1}
              </span>
              <span className={clsx('mt-2 text-xs font-semibold sm:text-sm', s.done || active ? 'text-white' : 'text-muted')}>{s.label}</span>
              <span className="mt-0.5 hidden text-xs text-muted sm:block">{s.date}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

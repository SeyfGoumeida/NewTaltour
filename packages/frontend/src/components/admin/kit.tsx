'use client';

import clsx from 'clsx';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import useSWR, { SWRConfiguration } from 'swr';
import { AlertCircle, CheckCircle2, Search, X } from 'lucide-react';
import { ApiError, fetcher } from '@/lib/api';
import { STATUT_COMMANDE, STATUT_PAIEMENT } from '@/lib/format';
import { Badge, Button, Modal, Spinner } from '@/components/ui';

export function qs(path: string, query: Record<string, unknown> = {}) {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) if (v !== undefined && v !== null && v !== '') p.set(k, String(v));
  const s = p.toString();
  return s ? `${path}?${s}` : path;
}

export function useAdmin<T = any>(path: string | null, opts?: SWRConfiguration) {
  return useSWR<T>(path, fetcher, { keepPreviousData: true, revalidateOnFocus: false, ...opts });
}

export const errMsg = (e: unknown) => (e instanceof ApiError ? e.message : e instanceof Error ? e.message : 'Erreur inattendue');

type ToastItem = { id: number; msg: string; tone: 'ok' | 'danger' };
const ToastCtx = createContext<(msg: string, tone?: 'ok' | 'danger') => void>(() => {});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const seq = useRef(0);
  const push = useCallback((msg: string, tone: 'ok' | 'danger' = 'ok') => {
    const id = ++seq.current;
    setItems((l) => [...l, { id, msg, tone }]);
    setTimeout(() => setItems((l) => l.filter((t) => t.id !== id)), tone === 'danger' ? 6000 : 3500);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-[min(92vw,380px)] flex-col gap-2 print:hidden">
        {items.map((t) => (
          <div key={t.id} className={clsx('pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-bar backdrop-blur-xl animate-fade-up',
            t.tone === 'ok' ? 'border-ok/30 bg-ink-800/95 text-[#9BE7B5]' : 'border-danger/30 bg-ink-800/95 text-[#FDA4B4]')}>
            {t.tone === 'ok' ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />}
            <span className="min-w-0 flex-1">{t.msg}</span>
            <button onClick={() => setItems((l) => l.filter((x) => x.id !== t.id))} className="text-muted hover:text-white" aria-label="Fermer"><X className="h-4 w-4" /></button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export const useToast = () => useContext(ToastCtx);

export function PageHead({ title, sub, actions, back }: { title: React.ReactNode; sub?: React.ReactNode; actions?: React.ReactNode; back?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between print:hidden">
      <div className="min-w-0">
        {back && <div className="mb-2">{back}</div>}
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-[28px]">{title}</h1>
        {sub && <p className="mt-1 text-sm text-muted">{sub}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function TableBox({ children, className, maxH = true }: { children: React.ReactNode; className?: string; maxH?: boolean }) {
  return (
    <div className={clsx('glass overflow-hidden p-0', className)}>
      <div className={clsx('overflow-auto', maxH && 'max-h-[calc(100vh-280px)] min-h-[160px]')}>
        <table className="w-full min-w-max border-separate border-spacing-0 text-sm">{children}</table>
      </div>
    </div>
  );
}

export function Th({ children, className, right }: { children?: React.ReactNode; className?: string; right?: boolean }) {
  return (
    <th className={clsx('sticky top-0 z-10 border-b border-line bg-ink-800/95 px-3 py-3 text-left text-[11px] first:pl-4 last:pr-4 font-semibold uppercase tracking-wider text-muted backdrop-blur', right && 'text-right', className)}>
      {children}
    </th>
  );
}

export function Td({ children, className, right, ...rest }: React.TdHTMLAttributes<HTMLTableCellElement> & { right?: boolean }) {
  return (
    <td className={clsx('border-b border-line/60 px-3 py-3 align-middle first:pl-4 last:pr-4', right && 'text-right', className)} {...rest}>
      {children}
    </td>
  );
}

export const rowCls = 'transition-colors hover:bg-white/[0.035]';

export function EmptyRow({ cols, children = 'Aucun résultat' }: { cols: number; children?: React.ReactNode }) {
  return (
    <tr>
      <td colSpan={cols} className="px-4 py-14 text-center text-sm text-muted">{children}</td>
    </tr>
  );
}

export function LoadingRow({ cols }: { cols: number }) {
  return (
    <tr>
      <td colSpan={cols} className="px-4 py-14 text-center"><Spinner className="mx-auto" /></td>
    </tr>
  );
}

export function StatutBadge({ statut }: { statut: string }) {
  const s = STATUT_COMMANDE[statut];
  return <Badge tone={s?.tone || 'muted'}>{s?.label || statut}</Badge>;
}

export function PaiementBadge({ statut }: { statut: string }) {
  const s = STATUT_PAIEMENT[statut];
  return <Badge tone={s?.tone || 'muted'}>{s?.label || statut}</Badge>;
}

export function Thumb({ src, alt = '', className }: { src?: string | null; alt?: string; className?: string }) {
  return (
    <span className={clsx('flex shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white/[0.04]', className || 'h-9 w-14')}>
      {src ? <img src={src} alt={alt} className="h-full w-full object-contain" loading="lazy" /> : null}
    </span>
  );
}

export function SearchBox({ value, onChange, placeholder = 'Rechercher…', className, delay = 300 }: { value: string; onChange: (v: string) => void; placeholder?: string; className?: string; delay?: number }) {
  const [v, setV] = useState(value);
  useEffect(() => setV(value), [value]);
  useEffect(() => {
    if (v === value) return;
    const t = setTimeout(() => onChange(v), delay);
    return () => clearTimeout(t);
  }, [v, value, onChange, delay]);
  return (
    <div className={clsx('relative', className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
      <input className="field pl-9" value={v} onChange={(e) => setV(e.target.value)} placeholder={placeholder} />
    </div>
  );
}

export function FilterBar({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={clsx('glass mb-4 flex flex-wrap items-end gap-3 p-4', className)}>{children}</div>;
}

export function MiniLabel({ children }: { children: React.ReactNode }) {
  return <span className="mb-1 block text-[11px] font-medium uppercase tracking-wider text-muted">{children}</span>;
}

export function ConfirmModal({ open, onClose, onConfirm, title = 'Confirmer', children, confirmLabel = 'Supprimer', danger = true }: {
  open: boolean; onClose: () => void; onConfirm: () => Promise<unknown> | void; title?: React.ReactNode; children?: React.ReactNode; confirmLabel?: string; danger?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => { if (open) setErr(null); }, [open]);
  const go = async () => {
    setBusy(true);
    setErr(null);
    try {
      await onConfirm();
      onClose();
    } catch (e) {
      setErr(errMsg(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal open={open} onClose={onClose} title={title}
      footer={<><Button variant="ghost" onClick={onClose}>Annuler</Button><Button variant={danger ? 'danger' : 'primary'} loading={busy} onClick={go}>{confirmLabel}</Button></>}>
      <div className="space-y-3 text-sm text-soft">
        {children || 'Cette action est définitive.'}
        {err && <div className="rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-[#FDA4B4]">{err}</div>}
      </div>
    </Modal>
  );
}

export function TagInput({ value, onChange, placeholder = 'Ajouter puis Entrée' }: { value: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  const [draft, setDraft] = useState('');
  const add = () => {
    const parts = draft.split(',').map((s) => s.trim()).filter(Boolean).filter((s) => !value.includes(s));
    if (parts.length) onChange([...value, ...parts]);
    setDraft('');
  };
  return (
    <div className="field flex min-h-[44px] flex-wrap items-center gap-1.5 py-2">
      {value.map((t) => (
        <span key={t} className="inline-flex items-center gap-1 rounded-lg bg-brand-blue/20 px-2 py-0.5 text-xs text-[#B9CCFF]">
          {t}
          <button type="button" onClick={() => onChange(value.filter((x) => x !== t))} className="text-[#B9CCFF]/70 hover:text-white" aria-label={`Retirer ${t}`}><X className="h-3 w-3" /></button>
        </span>
      ))}
      <input className="min-w-[140px] flex-1 bg-transparent text-sm text-white outline-none placeholder:text-muted/70" value={draft} placeholder={placeholder}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(); }
          else if (e.key === 'Backspace' && !draft && value.length) onChange(value.slice(0, -1));
        }}
        onBlur={add} />
    </div>
  );
}

export function KV({ label, children, className }: { label: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <div className={clsx('flex items-start justify-between gap-4 py-2 text-sm', className)}>
      <span className="text-muted">{label}</span>
      <span className="text-right font-medium text-white">{children}</span>
    </div>
  );
}

export const pct = (n: number) => `${n > 0 ? '+' : ''}${n.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} %`;
export const num = (n: number | string | null | undefined) => Number(n || 0).toLocaleString('fr-FR');
export const isoDay = (d: Date) => d.toISOString().slice(0, 10);

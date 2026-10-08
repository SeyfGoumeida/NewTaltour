'use client';

import Link from 'next/link';
import clsx from 'clsx';
import { forwardRef, useEffect } from 'react';
import { AlertCircle, CheckCircle2, ChevronLeft, ChevronRight, Info, Loader2, Star, X } from 'lucide-react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger' | 'blue';
type Size = 'sm' | 'md' | 'lg';

const btn = (variant: Variant, size: Size, full?: boolean) =>
  clsx(
    'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-all duration-150 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 whitespace-nowrap',
    size === 'sm' && 'h-9 px-3.5 text-sm',
    size === 'md' && 'h-11 px-5 text-sm',
    size === 'lg' && 'h-12 px-6 text-base',
    full && 'w-full',
    variant === 'primary' && 'bg-grad-accent text-white shadow-glow hover:brightness-110',
    variant === 'blue' && 'bg-brand-blue text-white hover:bg-brand-blue/90',
    variant === 'secondary' && 'border border-line bg-white/[0.06] text-white hover:bg-white/[0.1]',
    variant === 'outline' && 'border border-line text-soft hover:border-white/25 hover:text-white',
    variant === 'ghost' && 'text-soft hover:bg-white/[0.06] hover:text-white',
    variant === 'danger' && 'border border-danger/40 bg-danger/10 text-danger hover:bg-danger/20',
  );

export const Button = forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size; full?: boolean; loading?: boolean }>(
  function Button({ variant = 'primary', size = 'md', full, loading, className, children, disabled, ...rest }, ref) {
    return (
      <button ref={ref} className={clsx(btn(variant, size, full), className)} disabled={disabled || loading} {...rest}>
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  },
);

export function LinkButton({ href, variant = 'primary', size = 'md', full, className, children, ...rest }: React.ComponentProps<typeof Link> & { variant?: Variant; size?: Size; full?: boolean }) {
  return (
    <Link href={href} className={clsx(btn(variant, size, full), className)} {...rest}>
      {children}
    </Link>
  );
}

export type Tone = 'ok' | 'warn' | 'info' | 'muted' | 'danger' | 'accent' | 'gold';

export function Badge({ tone = 'muted', children, className }: { tone?: Tone; children: React.ReactNode; className?: string }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide',
        tone === 'ok' && 'bg-ok/15 text-ok',
        tone === 'warn' && 'bg-warn/15 text-warn',
        tone === 'info' && 'bg-brand-blue/20 text-[#7EA6FF]',
        tone === 'muted' && 'bg-white/[0.07] text-soft',
        tone === 'danger' && 'bg-danger/15 text-danger',
        tone === 'accent' && 'bg-accent/15 text-accent',
        tone === 'gold' && 'bg-gold/15 text-gold',
        className,
      )}
    >
      {children}
    </span>
  );
}

export function Card({ className, children, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={clsx('glass p-5 sm:p-6', className)} {...rest}>
      {children}
    </div>
  );
}

export function CardTitle({ children, action, className }: { children: React.ReactNode; action?: React.ReactNode; className?: string }) {
  return (
    <div className={clsx('mb-4 flex items-center justify-between gap-3', className)}>
      <h3 className="text-base font-semibold text-white">{children}</h3>
      {action}
    </div>
  );
}

export function Field({ label, required, error, hint, children, className }: { label?: React.ReactNode; required?: boolean; error?: string | null; hint?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <label className={clsx('block', className)}>
      {label && (
        <span className="label">
          {label} {required && <span className="text-accent">*</span>}
        </span>
      )}
      {children}
      {hint && !error && <span className="mt-1 block text-xs text-muted">{hint}</span>}
      {error && <span className="mt-1 block text-xs text-danger">{error}</span>}
    </label>
  );
}

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(function Input({ className, ...rest }, ref) {
  return <input ref={ref} className={clsx('field', className)} {...rest} />;
});

export const Select = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(function Select({ className, children, ...rest }, ref) {
  return (
    <select ref={ref} className={clsx('field appearance-none bg-[length:16px] bg-[right_12px_center] bg-no-repeat pr-9', className)}
      style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%238C9AB8' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")" }}
      {...rest}>
      {children}
    </select>
  );
});

export const Textarea = forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea({ className, ...rest }, ref) {
  return <textarea ref={ref} className={clsx('field min-h-[110px] resize-y', className)} {...rest} />;
});

export function Checkbox({ checked, onChange, children, disabled, className }: { checked: boolean; onChange: (v: boolean) => void; children: React.ReactNode; disabled?: boolean; className?: string }) {
  return (
    <label className={clsx('flex cursor-pointer items-start gap-3', disabled && 'cursor-not-allowed opacity-50', className)}>
      <input type="checkbox" className="peer sr-only" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
      <span className={clsx('mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition peer-focus-visible:ring-2 peer-focus-visible:ring-brand-blue/40',
        checked ? 'border-brand-blue bg-brand-blue' : 'border-white/25 bg-ink-950/60')}>
        {checked && <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 text-white"><path fill="none" stroke="currentColor" strokeWidth="2.2" d="M3.5 8.5 6.5 11.5 12.5 4.5" /></svg>}
      </span>
      <span className="text-sm text-soft">{children}</span>
    </label>
  );
}

export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: React.ReactNode }) {
  return (
    <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className="inline-flex items-center gap-2.5 text-sm text-soft">
      <span className={clsx('relative h-6 w-11 rounded-full transition', checked ? 'bg-ok' : 'bg-white/15')}>
        <span className={clsx('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all', checked ? 'left-[22px]' : 'left-0.5')} />
      </span>
      {label}
    </button>
  );
}

export function Stars({ value, size = 14, className }: { value: number; size?: number; className?: string }) {
  return (
    <span className={clsx('inline-flex items-center gap-0.5', className)} aria-label={`${value} sur 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} style={{ width: size, height: size }} className={i <= Math.round(value) ? 'fill-gold text-gold' : 'fill-white/10 text-white/10'} />
      ))}
    </span>
  );
}

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={clsx('h-5 w-5 animate-spin text-muted', className)} />;
}

export function Loading({ label = 'Chargement…' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-sm text-muted">
      <Spinner /> {label}
    </div>
  );
}

export function Alert({ tone = 'info', title, children, className }: { tone?: 'info' | 'ok' | 'warn' | 'danger'; title?: React.ReactNode; children?: React.ReactNode; className?: string }) {
  const Icon = tone === 'ok' ? CheckCircle2 : tone === 'info' ? Info : AlertCircle;
  return (
    <div
      className={clsx(
        'flex gap-3 rounded-xl border px-4 py-3 text-sm',
        tone === 'info' && 'border-brand-blue/30 bg-brand-blue/10 text-[#B9CCFF]',
        tone === 'ok' && 'border-ok/30 bg-ok/10 text-[#9BE7B5]',
        tone === 'warn' && 'border-warn/30 bg-warn/10 text-[#FCD58A]',
        tone === 'danger' && 'border-danger/30 bg-danger/10 text-[#FDA4B4]',
        className,
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="min-w-0">
        {title && <div className="font-semibold">{title}</div>}
        {children && <div className={clsx(title && 'mt-0.5 opacity-90')}>{children}</div>}
      </div>
    </div>
  );
}

export function Modal({ open, onClose, title, children, footer, wide }: { open: boolean; onClose: () => void; title: React.ReactNode; children: React.ReactNode; footer?: React.ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-ink-950/80 p-0 backdrop-blur-sm sm:items-center sm:p-6" onClick={onClose}>
      <div className={clsx('glass flex max-h-[92vh] w-full flex-col rounded-b-none bg-ink-850 sm:rounded-2xl', wide ? 'sm:max-w-3xl' : 'sm:max-w-lg')} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal>
        <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-4">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted hover:bg-white/5 hover:text-white" aria-label="Fermer">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-5">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-line px-5 py-4">{footer}</div>}
      </div>
    </div>
  );
}

export function Eyebrow({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={clsx('inline-flex items-center gap-2 rounded-full border border-line bg-white/[0.04] px-3 py-1 text-xs font-medium text-soft', className)}>
      <span className="h-1.5 w-1.5 rounded-full bg-accent" />
      {children}
    </span>
  );
}

export function SectionTitle({ eyebrow, title, highlight, sub, center, action }: { eyebrow?: string; title: string; highlight?: string; sub?: React.ReactNode; center?: boolean; action?: React.ReactNode }) {
  return (
    <div className={clsx('mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between', center && 'items-center text-center sm:flex-col sm:items-center')}>
      <div className={clsx('max-w-2xl', center && 'mx-auto')}>
        {eyebrow && <Eyebrow className="mb-4">{eyebrow}</Eyebrow>}
        <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          {title} {highlight && <span className="text-grad">{highlight}</span>}
        </h2>
        {sub && <p className="mt-3 text-base text-muted">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

export function PageHeader({ title, highlight, sub, eyebrow, children }: { title: string; highlight?: string; sub?: React.ReactNode; eyebrow?: string; children?: React.ReactNode }) {
  return (
    <section className="border-b border-line bg-gradient-to-b from-ink-850/60 to-transparent">
      <div className="container-x py-12 sm:py-16">
        {eyebrow && <Eyebrow className="mb-4">{eyebrow}</Eyebrow>}
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl">
          {title} {highlight && <span className="text-grad">{highlight}</span>}
        </h1>
        {sub && <p className="mt-4 max-w-2xl text-base text-muted sm:text-lg">{sub}</p>}
        {children}
      </div>
    </section>
  );
}

export function Pagination({ page, total, size, onPage }: { page: number; total: number; size: number; onPage: (p: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / size));
  if (pages <= 1) return null;
  const nums = Array.from(new Set([1, page - 1, page, page + 1, pages].filter((n) => n >= 1 && n <= pages))).sort((a, b) => a - b);
  return (
    <nav className="mt-8 flex items-center justify-center gap-1.5">
      <button className={btn('outline', 'sm')} disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Page précédente">
        <ChevronLeft className="h-4 w-4" />
      </button>
      {nums.map((n, i) => (
        <span key={n} className="flex items-center gap-1.5">
          {i > 0 && n - nums[i - 1] > 1 && <span className="px-1 text-muted">…</span>}
          <button className={clsx(btn(n === page ? 'blue' : 'outline', 'sm'), 'min-w-9')} onClick={() => onPage(n)}>
            {n}
          </button>
        </span>
      ))}
      <button className={btn('outline', 'sm')} disabled={page >= pages} onClick={() => onPage(page + 1)} aria-label="Page suivante">
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
}

export function Empty({ icon, title, children }: { icon?: React.ReactNode; title: string; children?: React.ReactNode }) {
  return (
    <div className="glass flex flex-col items-center px-6 py-14 text-center">
      {icon && <div className="mb-4 rounded-2xl bg-white/[0.05] p-4 text-muted">{icon}</div>}
      <h3 className="text-lg font-semibold">{title}</h3>
      {children && <div className="mt-2 max-w-md text-sm text-muted">{children}</div>}
    </div>
  );
}

export function Tabs<T extends string>({ value, onChange, items, className }: { value: T; onChange: (v: T) => void; items: { value: T; label: React.ReactNode }[]; className?: string }) {
  return (
    <div className={clsx('inline-flex flex-wrap gap-1.5', className)}>
      {items.map((it) => (
        <button key={it.value} type="button" onClick={() => onChange(it.value)}
          className={clsx('rounded-xl px-4 py-2 text-sm font-medium transition', value === it.value ? 'bg-brand-blue text-white shadow-[0_8px_24px_-8px_rgba(47,107,255,0.8)]' : 'border border-line bg-white/[0.03] text-soft hover:text-white')}>
          {it.label}
        </button>
      ))}
    </div>
  );
}

export function Stat({ label, value, sub, icon }: { label: string; value: React.ReactNode; sub?: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="glass p-5">
      <div className="flex items-center justify-between text-xs font-medium text-muted">
        {label}
        {icon && <span className="text-brand-cyan">{icon}</span>}
      </div>
      <div className="mt-2 font-display text-2xl font-bold text-white">{value}</div>
      {sub && <div className="mt-1 text-xs text-muted">{sub}</div>}
    </div>
  );
}

'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';

const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const MOIS_COURT = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
const JOURS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const HEURES = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));

const pad = (n: number) => String(n).padStart(2, '0');
const iso = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;

export function formatDateTime(v: string) {
  const [d, t] = v.split('T');
  const [y, m, j] = d.split('-').map(Number);
  return `${j} ${MOIS_COURT[m - 1]} ${y} · ${t}`;
}

interface Props {
  value: string;
  onChange: (v: string) => void;
  min?: string;
  max?: string;
  rangeStart?: string;
  rangeEnd?: string;
  label: string;
  variant?: 'light' | 'dark';
  className?: string;
}

export default function DateTimePicker({ value, onChange, min, max, rangeStart, rangeEnd, label, variant = 'light', className }: Props) {
  const [open, setOpen] = useState(false);
  const [day, time] = value.split('T');
  const [hh, mm] = time.split(':');
  const [view, setView] = useState(() => ({ y: Number(day.slice(0, 4)), m: Number(day.slice(5, 7)) - 1 }));
  const trigger = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);

  useEffect(() => {
    if (open) setView({ y: Number(day.slice(0, 4)), m: Number(day.slice(5, 7)) - 1 });
  }, [open, day]);

  const place = useCallback(() => {
    const r = trigger.current?.getBoundingClientRect();
    if (!r) return;
    const width = Math.min(340, window.innerWidth - 24);
    const h = panel.current?.offsetHeight ?? 470;
    const below = r.bottom + 8;
    const top = below + h > window.innerHeight - 8 && r.top - h - 8 > 8 ? r.top - h - 8 : below;
    const left = Math.max(12, Math.min(r.left, window.innerWidth - width - 12));
    setPos({ top, left, width });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    place();
    const raf = requestAnimationFrame(place);
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open, place]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!panel.current?.contains(t) && !trigger.current?.contains(t)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        trigger.current?.focus();
      }
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const first = new Date(Date.UTC(view.y, view.m, 1));
  const offset = (first.getUTCDay() + 6) % 7;
  const daysInMonth = new Date(Date.UTC(view.y, view.m + 1, 0)).getUTCDate();
  const cells: (string | null)[] = [...Array(offset).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => iso(view.y, view.m, i + 1))];
  const prevDisabled = !!min && iso(view.y, view.m, 1) <= min;
  const nextDisabled = !!max && iso(view.y, view.m + 1, 1) > max;
  const shift = (n: number) => setView((v) => {
    const d = new Date(Date.UTC(v.y, v.m + n, 1));
    return { y: d.getUTCFullYear(), m: d.getUTCMonth() };
  });
  const rs = rangeStart?.slice(0, 10);
  const re = rangeEnd?.slice(0, 10);

  const light = variant === 'light';

  return (
    <>
      <button ref={trigger} type="button" onClick={() => setOpen((o) => !o)} aria-haspopup="dialog" aria-expanded={open} aria-label={`${label} : ${formatDateTime(value)}`}
        className={clsx('flex w-full items-center gap-3 text-left outline-none',
          light ? 'px-4 py-3 focus-visible:bg-slate-50' : 'field justify-between', className)}>
        {light && <CalendarDays className="h-4 w-4 shrink-0 text-slate-500" />}
        <span className="min-w-0 flex-1">
          {light && <span className="block text-[11px] font-medium text-slate-500">{label}</span>}
          <span className={clsx('block truncate text-sm font-semibold', light ? 'text-ink-900' : 'text-white')}>{formatDateTime(value)}</span>
        </span>
        {!light && <CalendarDays className="h-4 w-4 shrink-0 text-muted" />}
      </button>
      {open && typeof document !== 'undefined' && createPortal(
        <div ref={panel} role="dialog" aria-label={label}
          style={{ position: 'fixed', top: pos?.top ?? -9999, left: pos?.left ?? -9999, width: pos?.width ?? 340, zIndex: 90 }}
          className="rounded-2xl border border-line bg-ink-850 p-4 text-soft shadow-bar">
          <div className="mb-3 flex items-center justify-between">
            <button type="button" onClick={() => shift(-1)} disabled={prevDisabled} className="rounded-lg p-1.5 text-muted hover:bg-white/5 hover:text-white disabled:opacity-30" aria-label="Mois précédent">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-semibold capitalize text-white">{MOIS[view.m]} {view.y}</span>
            <button type="button" onClick={() => shift(1)} disabled={nextDisabled} className="rounded-lg p-1.5 text-muted hover:bg-white/5 hover:text-white disabled:opacity-30" aria-label="Mois suivant">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-y-1 text-center text-[11px] font-medium text-muted">
            {JOURS.map((j, i) => <span key={i} className="py-1">{j}</span>)}
          </div>
          <div className="grid grid-cols-7 gap-y-1 text-center text-sm">
            {cells.map((d, i) => {
              if (!d) return <span key={`e${i}`} />;
              const disabled = (!!min && d < min) || (!!max && d > max);
              const selected = d === day;
              const inRange = !!rs && !!re && d >= rs && d <= re;
              const edge = d === rs || d === re;
              return (
                <span key={d} className={clsx('flex justify-center', inRange && 'bg-brand-blue/15', d === rs && 'rounded-l-full', d === re && 'rounded-r-full')}>
                  <button type="button" disabled={disabled} onClick={() => onChange(`${d}T${time}`)}
                    className={clsx('h-9 w-9 rounded-full font-medium transition',
                      selected ? 'bg-brand-blue text-white' : edge ? 'text-white ring-1 ring-brand-blue/60' : 'text-soft hover:bg-white/10 hover:text-white',
                      disabled && 'pointer-events-none opacity-25')}>
                    {Number(d.slice(8))}
                  </button>
                </span>
              );
            })}
          </div>
          <div className="mt-4 border-t border-line pt-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium text-muted">Heure</span>
              <div className="inline-flex rounded-lg border border-line p-0.5 text-xs">
                {['00', '30'].map((m) => (
                  <button key={m} type="button" onClick={() => onChange(`${day}T${hh}:${m}`)}
                    className={clsx('rounded-md px-2.5 py-1 font-semibold', mm === m ? 'bg-white/10 text-white' : 'text-muted hover:text-white')}>
                    :{m}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-6 gap-1">
              {HEURES.map((h) => (
                <button key={h} type="button" onClick={() => { onChange(`${day}T${h}:${mm}`); setOpen(false); trigger.current?.focus(); }}
                  className={clsx('rounded-lg py-1.5 text-xs font-semibold transition', h === hh ? 'bg-accent text-white' : 'bg-white/[0.04] text-soft hover:bg-white/10 hover:text-white')}>
                  {h}h
                </button>
              ))}
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}

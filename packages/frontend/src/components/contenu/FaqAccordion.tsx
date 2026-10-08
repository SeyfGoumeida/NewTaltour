'use client';

import clsx from 'clsx';
import { useState } from 'react';
import { Plus } from 'lucide-react';

export interface FaqItem {
  id: number;
  question: string;
  answer: React.ReactNode;
}

export default function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(items[0]?.id ?? null);
  return (
    <div className="space-y-3">
      {items.map((it, i) => {
        const isOpen = open === it.id;
        const btn = `faq-q-${it.id}`;
        const panel = `faq-r-${it.id}`;
        return (
          <div key={it.id} className={clsx('glass overflow-hidden p-0 transition', isOpen && 'border-brand-blue/40')}>
            <h2 className="m-0">
              <button
                id={btn}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panel}
                onClick={() => setOpen(isOpen ? null : it.id)}
                className="flex w-full items-center gap-4 px-5 py-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-blue/50 sm:px-6 sm:py-5"
              >
                <span className={clsx('font-display text-sm font-bold tabular-nums', isOpen ? 'text-accent' : 'text-muted')}>{String(i + 1).padStart(2, '0')}</span>
                <span className="flex-1 text-base font-semibold text-white">{it.question}</span>
                <span className={clsx('flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition', isOpen ? 'rotate-45 border-accent/40 bg-accent/10 text-accent' : 'border-line text-soft')}>
                  <Plus className="h-4 w-4" />
                </span>
              </button>
            </h2>
            <div id={panel} role="region" aria-labelledby={btn} hidden={!isOpen} className="border-t border-line px-5 pb-5 pt-4 sm:px-6 sm:pl-[4.25rem]">
              {it.answer}
            </div>
          </div>
        );
      })}
    </div>
  );
}

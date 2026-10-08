'use client';

import { useRef } from 'react';

export function useHoneypot() {
  const ref = useRef<HTMLInputElement>(null);
  const field = (
    <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
      <label>
        Ne pas remplir
        <input ref={ref} type="text" name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
      </label>
    </div>
  );
  return { field, value: () => ref.current?.value || undefined };
}

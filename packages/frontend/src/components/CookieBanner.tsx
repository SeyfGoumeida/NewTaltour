'use client';

import { useEffect, useState } from 'react';
import { Button } from './ui';

const KEY = 'taltour_cookies';

export default function CookieBanner() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    try {
      setShow(!localStorage.getItem(KEY));
    } catch {}
  }, []);
  if (!show) return null;
  const answer = (v: 'accepte' | 'refuse') => {
    try {
      localStorage.setItem(KEY, v);
    } catch {}
    setShow(false);
  };
  return (
    <div className="fixed inset-x-3 bottom-3 z-[70] sm:inset-x-auto sm:bottom-5 sm:right-5 sm:max-w-md">
      <div className="glass bg-ink-850/95 p-4 text-sm text-soft">
        Ce site utilise des cookies pour la collecte de statistiques anonymes. En cliquant sur &quot;J&apos;accepte&quot;, vous autorisez l&apos;utilisation de ces cookies.
        <div className="mt-3 flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => answer('refuse')}>Refuser</Button>
          <Button size="sm" onClick={() => answer('accepte')}>Accepter</Button>
        </div>
      </div>
    </div>
  );
}

'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import type { SiteInfo, User } from '@/lib/types';

interface AuthCtx {
  user: User | null;
  ready: boolean;
  setSession: (user: User) => void;
  setUser: (u: User) => void;
  logout: () => void;
}

const Auth = createContext<AuthCtx>({ user: null, ready: false, setSession: () => {}, setUser: () => {}, logout: () => {} });
const Site = createContext<SiteInfo | null>(null);

export function Providers({ site, children }: { site: SiteInfo; children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    api<{ user: User | null }>('/auth/session')
      .then((r) => setUser(r.user))
      .catch(() => setUser(null))
      .finally(() => setReady(true));
  }, []);

  const setSession = useCallback((u: User) => setUser(u), []);

  const logout = useCallback(() => {
    setUser(null);
    api('/auth/logout', { method: 'POST' }).catch(() => undefined);
  }, []);

  const value = useMemo(() => ({ user, ready, setSession, setUser, logout }), [user, ready, setSession, logout]);
  return (
    <Site.Provider value={site}>
      <Auth.Provider value={value}>{children}</Auth.Provider>
    </Site.Provider>
  );
}

export const useAuth = () => useContext(Auth);
export const useSite = () => useContext(Site)!;

export function useSiteSwitch() {
  const router = useRouter();
  return (code: 'dz' | 'ma') => {
    document.cookie = `site=${code}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    router.refresh();
  };
}

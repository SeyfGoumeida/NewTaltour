'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, TOKEN_KEY } from '@/lib/api';
import type { SiteInfo, User } from '@/lib/types';

interface AuthCtx {
  user: User | null;
  ready: boolean;
  setSession: (token: string, user: User) => void;
  setUser: (u: User) => void;
  logout: () => void;
}

const Auth = createContext<AuthCtx>({ user: null, ready: false, setSession: () => {}, setUser: () => {}, logout: () => {} });
const Site = createContext<SiteInfo | null>(null);

export function Providers({ site, children }: { site: SiteInfo; children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let t: string | null = null;
    try {
      t = localStorage.getItem(TOKEN_KEY);
    } catch {}
    if (!t) return setReady(true);
    api<User>('/auth/me')
      .then(setUser)
      .catch(() => {
        try {
          localStorage.removeItem(TOKEN_KEY);
        } catch {}
      })
      .finally(() => setReady(true));
  }, []);

  const setSession = useCallback((token: string, u: User) => {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {}
    setUser(u);
  }, []);

  const logout = useCallback(() => {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {}
    setUser(null);
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

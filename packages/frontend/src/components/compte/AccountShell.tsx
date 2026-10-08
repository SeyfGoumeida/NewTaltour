'use client';

import Link from 'next/link';
import clsx from 'clsx';
import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSWRConfig } from 'swr';
import { CalendarDays, LayoutDashboard, LogOut, UserRound, Wallet } from 'lucide-react';
import { useAuth } from '@/components/providers';
import { Loading } from '@/components/ui';
import AuthScreen from './AuthScreen';

const NAV = [
  { href: '/mon-compte', label: 'Tableau de bord', icon: LayoutDashboard },
  { href: '/mon-compte/reservations', label: 'Mes réservations', icon: CalendarDays },
  { href: '/mon-compte/avoirs', label: 'Mes avoirs', icon: Wallet },
  { href: '/mon-compte/profil', label: 'Mon profil', icon: UserRound },
];

const PUBLIC = ['/mon-compte/mot-de-passe-oublie', '/mon-compte/reinitialiser'];

export default function AccountShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const { user, ready, logout } = useAuth();
  const { mutate } = useSWRConfig();
  const nav = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = nav.current?.querySelector<HTMLElement>('[aria-current=page]');
    if (el && nav.current) nav.current.scrollLeft = el.offsetLeft - 16;
  }, [path, user]);

  if (PUBLIC.some((p) => path.startsWith(p))) return <>{children}</>;
  if (!ready) return <Loading />;
  if (!user) return <AuthScreen />;
  if (path.endsWith('/contrat')) return <>{children}</>;

  const signOut = () => {
    logout();
    mutate(() => true, undefined, { revalidate: false });
    router.push('/mon-compte');
  };
  const isActive = (href: string) => (href === '/mon-compte' ? path === href : path.startsWith(href));
  const initials = `${user.prenom?.[0] ?? ''}${user.nom?.[0] ?? ''}`.toUpperCase();

  return (
    <div className="container-x py-8 sm:py-12">
      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-8">
        <aside className="min-w-0 lg:sticky lg:top-28 lg:self-start">
          <div className="glass hidden items-center gap-3 p-4 lg:flex">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-grad-accent font-display text-sm font-bold text-white">{initials}</span>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-white">{user.prenom} {user.nom}</div>
              <div className="truncate text-xs text-muted">{user.email}</div>
            </div>
          </div>
          <nav ref={nav} className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 lg:glass lg:mx-0 lg:mt-3 lg:flex-col lg:gap-1 lg:overflow-visible lg:p-2">
            {NAV.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} aria-current={isActive(href) ? 'page' : undefined}
                className={clsx('inline-flex shrink-0 items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-medium transition',
                  isActive(href) ? 'bg-brand-blue text-white shadow-[0_8px_24px_-8px_rgba(47,107,255,0.8)]' : 'border border-line bg-white/[0.03] text-soft hover:text-white lg:border-transparent lg:bg-transparent lg:hover:bg-white/[0.05]')}>
                <Icon className="h-4 w-4" /> {label}
              </Link>
            ))}
            <button type="button" onClick={signOut}
              className="inline-flex shrink-0 items-center gap-2.5 rounded-xl border border-line bg-white/[0.03] px-3.5 py-2.5 text-sm font-medium text-soft transition hover:text-danger lg:mt-1 lg:border-transparent lg:border-t-line lg:bg-transparent">
              <LogOut className="h-4 w-4" /> Déconnexion
            </button>
          </nav>
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}

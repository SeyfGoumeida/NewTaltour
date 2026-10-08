'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import clsx from 'clsx';
import { LayoutDashboard, LogOut, Menu, Phone, UserRound, X } from 'lucide-react';
import Logo from './Logo';
import { FlagDz, FlagMa } from './Flags';
import { useAuth, useSite, useSiteSwitch } from './providers';

export const NAV = [
  { href: '/', label: 'Louer mon véhicule' },
  { href: '/tarifs', label: 'Tarifs' },
  { href: '/options', label: 'Options' },
  { href: '/conditions-de-location', label: 'Conditions' },
  { href: '/faq', label: 'FAQ' },
  { href: '/contact', label: 'Contact' },
];

export default function Header() {
  const site = useSite();
  const switchSite = useSiteSwitch();
  const { user, logout } = useAuth();
  const path = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [path]);
  const other = site.code === 'dz' ? 'ma' : 'dz';

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-ink-900/80 backdrop-blur-xl">
      <div className="hidden border-b border-line/60 lg:block">
        <div className="container-x flex h-9 items-center justify-between text-xs text-muted">
          <div className="flex items-center gap-5">
            <Link href="/occasions" className="hover:text-white">Occasions</Link>
            <Link href="/actus" className="hover:text-white">Actus</Link>
            <Link href="/avis" className="hover:text-white">Avis clients</Link>
            <Link href="/transfert-aeroport" className="hover:text-white">Transfert Aéroport</Link>
          </div>
          <div className="flex items-center gap-5">
            {site.telephones.map((t) => (
              <a key={t} href={`tel:${t.replace(/[^+\d]/g, '')}`} className="inline-flex items-center gap-1.5 hover:text-white">
                <Phone className="h-3 w-3" /> {t}
              </a>
            ))}
            <button onClick={() => switchSite(other)} className="inline-flex items-center gap-2 rounded-full border border-line px-2.5 py-0.5 hover:border-white/30 hover:text-white">
              {other === 'ma' ? <FlagMa /> : <FlagDz />}
              {other === 'ma' ? 'Louer au Maroc' : 'Louer en Algérie'}
            </button>
          </div>
        </div>
      </div>

      <div className="container-x flex h-16 items-center justify-between gap-4 lg:h-[72px]">
        <Logo site={site.code} />

        <nav className="hidden items-center gap-1 rounded-2xl border border-line bg-white/[0.03] p-1 lg:flex">
          {NAV.map((n) => {
            const active = n.href === '/' ? path === '/' : path.startsWith(n.href);
            return (
              <Link key={n.href} href={n.href}
                className={clsx('rounded-xl px-3.5 py-2 text-sm font-medium transition', active ? 'bg-white/[0.09] text-white' : 'text-soft hover:text-white')}>
                {n.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          {site.hotline && (
            <a href={`tel:${site.hotline.replace(/\s/g, '')}`} className="hidden items-center gap-2 text-sm font-medium text-white xl:inline-flex">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-blue/15 text-brand-cyan"><Phone className="h-4 w-4" /></span>
              Hotline {site.hotline}
            </a>
          )}
          {user?.role === 10 && (
            <Link href="/admin" className="hidden h-10 items-center gap-2 rounded-xl border border-line px-3 text-sm font-medium text-soft hover:text-white sm:inline-flex">
              <LayoutDashboard className="h-4 w-4" /> Admin
            </Link>
          )}
          <Link href="/mon-compte" className="inline-flex h-10 items-center gap-2 rounded-xl border border-line bg-white/[0.04] px-3.5 text-sm font-semibold text-white hover:bg-white/[0.08]">
            <UserRound className="h-4 w-4" />
            <span className="hidden sm:inline">{user ? user.prenom : 'Mon compte'}</span>
          </Link>
          {user && (
            <button onClick={logout} className="hidden h-10 w-10 items-center justify-center rounded-xl text-muted hover:bg-white/5 hover:text-white sm:inline-flex" title="Se déconnecter" aria-label="Se déconnecter">
              <LogOut className="h-4 w-4" />
            </button>
          )}
          <button className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-line text-white lg:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-line bg-ink-900 lg:hidden">
          <nav className="container-x grid gap-1 py-4">
            {[...NAV, { href: '/occasions', label: 'Occasions' }, { href: '/actus', label: 'Actus' }, { href: '/avis', label: 'Avis clients' }, { href: '/transfert-aeroport', label: 'Transfert Aéroport' }].map((n) => (
              <Link key={n.href} href={n.href} className="rounded-xl px-3 py-2.5 text-sm font-medium text-soft hover:bg-white/5 hover:text-white">{n.label}</Link>
            ))}
            {user?.role === 10 && <Link href="/admin" className="rounded-xl px-3 py-2.5 text-sm font-medium text-soft hover:bg-white/5">Administration</Link>}
            {user && <button onClick={logout} className="rounded-xl px-3 py-2.5 text-left text-sm font-medium text-soft hover:bg-white/5">Se déconnecter</button>}
            <div className="mt-3 grid gap-2 border-t border-line pt-4 text-sm text-muted">
              {site.hotline && <a href={`tel:${site.hotline.replace(/\s/g, '')}`}>Hotline {site.hotline}</a>}
              {site.telephones.map((t) => <a key={t} href={`tel:${t.replace(/[^+\d]/g, '')}`}>{t}</a>)}
              <button onClick={() => switchSite(other)} className="mt-2 inline-flex items-center gap-2 text-left text-soft">
                {other === 'ma' ? <FlagMa /> : <FlagDz />} {other === 'ma' ? 'Louer au Maroc' : 'Louer en Algérie'}
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

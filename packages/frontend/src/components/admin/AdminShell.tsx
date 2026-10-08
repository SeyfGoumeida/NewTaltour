'use client';

import clsx from 'clsx';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import {
  CalendarCheck, CalendarRange, Car, CarFront, ExternalLink, FileText, CircleHelp, History, LayoutDashboard, LogOut, Mail, MapPin, Menu,
  Newspaper, PackagePlus, PlaneLanding, Search, Settings, Star, Sun, Tag, TicketPercent, Users, X,
} from 'lucide-react';
import { useAuth } from '@/components/providers';
import { Loading } from '@/components/ui';
import { dateFr, euro } from '@/lib/format';
import { qs, StatutBadge, ToastProvider, useAdmin } from './kit';
import AdminLogin from './AdminLogin';

type NavItem = { href: string; label: string; icon: React.ComponentType<{ className?: string }>; badge?: 'en_attente' | 'messages_non_lus' | 'transferts_nouveaux' };

export const NAV: { section: string; items: NavItem[] }[] = [
  { section: 'Pilotage', items: [
    { href: '/admin', label: 'Tableau de bord', icon: LayoutDashboard },
    { href: '/admin/reservations', label: 'Réservations', icon: CalendarCheck, badge: 'en_attente' },
    { href: '/admin/planning', label: 'Planning', icon: CalendarRange },
  ] },
  { section: 'Flotte', items: [
    { href: '/admin/flotte', label: 'Véhicules', icon: Car },
    { href: '/admin/modeles', label: 'Modèles & tarifs', icon: CarFront },
  ] },
  { section: 'Relation client', items: [
    { href: '/admin/clients', label: 'Clients', icon: Users },
    { href: '/admin/avis', label: 'Avis', icon: Star },
    { href: '/admin/messages', label: 'Messages', icon: Mail, badge: 'messages_non_lus' },
    { href: '/admin/transferts', label: 'Transferts', icon: PlaneLanding, badge: 'transferts_nouveaux' },
  ] },
  { section: 'Tarification', items: [
    { href: '/admin/options', label: 'Options', icon: PackagePlus },
    { href: '/admin/saisons', label: 'Saisons', icon: Sun },
    { href: '/admin/codes-promo', label: 'Codes promo', icon: TicketPercent },
    { href: '/admin/villes', label: 'Villes & agences', icon: MapPin },
  ] },
  { section: 'Contenu', items: [
    { href: '/admin/actus', label: 'Actualités', icon: Newspaper },
    { href: '/admin/occasions', label: 'Occasions', icon: Tag },
    { href: '/admin/pages', label: 'Pages', icon: FileText },
    { href: '/admin/faq', label: 'FAQ', icon: CircleHelp },
  ] },
  { section: 'Système', items: [
    { href: '/admin/parametres', label: 'Paramètres', icon: Settings },
    { href: '/admin/journal', label: 'Journal', icon: History },
  ] },
];

const ALL = NAV.flatMap((s) => s.items);
const isActive = (path: string, href: string) => (href === '/admin' ? path === '/admin' : path === href || path.startsWith(href + '/'));

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const path = usePathname();
  const { data } = useAdmin<{ kpi: Record<string, number> }>('/admin/dashboard', { refreshInterval: 60_000 });
  return (
    <nav className="flex h-full flex-col">
      <div className="flex h-16 shrink-0 items-center gap-3 border-b border-line px-5">
        <Link href="/admin" onClick={onNavigate} className="flex items-center gap-3">
          <img src="/logo-taltour.png" alt="Taltour" className="h-8 w-auto" />
          <span className="rounded-md border border-accent/30 bg-accent/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent">Admin</span>
        </Link>
      </div>
      <div className="flex-1 space-y-5 overflow-y-auto px-3 py-5">
        {NAV.map((s) => (
          <div key={s.section}>
            <div className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted/70">{s.section}</div>
            <ul className="space-y-0.5">
              {s.items.map((it) => {
                const active = isActive(path, it.href);
                const count = it.badge ? data?.kpi?.[it.badge] : 0;
                return (
                  <li key={it.href}>
                    <Link href={it.href} onClick={onNavigate}
                      className={clsx('group relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition',
                        active ? 'bg-brand-blue/15 text-white' : 'text-soft hover:bg-white/[0.04] hover:text-white')}>
                      {active && <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-accent" />}
                      <it.icon className={clsx('h-[18px] w-[18px] shrink-0', active ? 'text-brand-cyan' : 'text-muted group-hover:text-soft')} />
                      <span className="flex-1 truncate">{it.label}</span>
                      {!!count && <span className="min-w-[22px] rounded-full bg-accent/90 px-1.5 py-0.5 text-center text-[10px] font-bold text-white">{count}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  );
}

function GlobalSearch() {
  const router = useRouter();
  const [term, setTerm] = useState('');
  const [debounced, setDebounced] = useState('');
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(term.trim()), 250);
    return () => clearTimeout(t);
  }, [term]);
  useEffect(() => {
    const onDoc = (e: MouseEvent) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);
  const { data, isLoading } = useAdmin<{ items: any[]; total: number }>(debounced.length >= 2 ? qs('/admin/commandes', { q: debounced, size: 6 }) : null);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!term.trim()) return;
    setOpen(false);
    router.push(qs('/admin/reservations', { q: term.trim() }));
  };
  return (
    <div ref={box} className="relative w-full max-w-md">
      <form onSubmit={submit}>
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input value={term} onChange={(e) => { setTerm(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)}
          placeholder="Rechercher une réservation (référence, nom, email)…"
          className="h-10 w-full rounded-xl border border-line bg-ink-950/60 pl-9 pr-3 text-sm text-white outline-none transition placeholder:text-muted/70 focus:border-brand-blue/70 focus:ring-2 focus:ring-brand-blue/25" />
      </form>
      {open && debounced.length >= 2 && (
        <div className="absolute left-0 right-0 top-12 z-50 overflow-hidden rounded-xl border border-line bg-ink-850 shadow-bar">
          {isLoading && !data ? <div className="px-4 py-3 text-sm text-muted">Recherche…</div>
            : !data?.items.length ? <div className="px-4 py-3 text-sm text-muted">Aucune réservation trouvée</div>
            : (
              <>
                {data.items.map((c) => (
                  <Link key={c.reference} href={`/admin/reservations/${c.reference}`} onClick={() => { setOpen(false); setTerm(''); }}
                    className="flex items-center justify-between gap-3 border-b border-line/60 px-4 py-2.5 text-sm hover:bg-white/[0.04]">
                    <span className="min-w-0">
                      <span className="block font-semibold text-white">{c.reference} <span className="font-normal text-soft">· {c.prenom} {c.nom}</span></span>
                      <span className="block truncate text-xs text-muted">{c.modele_nom} · {c.ville_depart} · {dateFr(c.date_depart)} · {euro(c.montant_total)}</span>
                    </span>
                    <StatutBadge statut={c.statut} />
                  </Link>
                ))}
                {data.total > data.items.length && (
                  <button onClick={submit} className="block w-full px-4 py-2.5 text-left text-xs font-medium text-brand-cyan hover:bg-white/[0.04]">
                    Voir les {data.total} résultats
                  </button>
                )}
              </>
            )}
        </div>
      )}
    </div>
  );
}

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const { user, ready, logout } = useAuth();
  const path = usePathname();
  const [drawer, setDrawer] = useState(false);
  useEffect(() => setDrawer(false), [path]);

  if (!ready) return <div className="flex min-h-screen items-center justify-center"><Loading /></div>;
  if (!user || user.role !== 10) return <AdminLogin denied={!!user} />;

  const current = [...ALL].sort((a, b) => b.href.length - a.href.length).find((it) => isActive(path, it.href));

  return (
    <ToastProvider>
      <style>{'@media print{body{background:#fff!important;color:#000!important}}'}</style>
      <div className="min-h-screen lg:pl-64 print:pl-0">
        <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-line bg-ink-950/85 backdrop-blur-xl lg:block print:hidden">
          <Sidebar />
        </aside>
        {drawer && (
          <div className="fixed inset-0 z-[70] lg:hidden print:hidden">
            <div className="absolute inset-0 bg-ink-950/80 backdrop-blur-sm" onClick={() => setDrawer(false)} />
            <aside className="absolute inset-y-0 left-0 w-72 max-w-[85vw] border-r border-line bg-ink-900 shadow-bar animate-fade-up">
              <button onClick={() => setDrawer(false)} className="absolute right-3 top-4 rounded-lg p-1.5 text-muted hover:bg-white/5 hover:text-white" aria-label="Fermer le menu"><X className="h-5 w-5" /></button>
              <Sidebar onNavigate={() => setDrawer(false)} />
            </aside>
          </div>
        )}
        <header className="sticky top-0 z-30 border-b border-line bg-ink-900/80 backdrop-blur-xl print:hidden">
          <div className="flex h-16 items-center gap-3 px-4 lg:px-8">
            <button onClick={() => setDrawer(true)} className="rounded-lg p-2 text-soft hover:bg-white/5 lg:hidden" aria-label="Ouvrir le menu"><Menu className="h-5 w-5" /></button>
            <div className="hidden min-w-0 shrink-0 xl:block xl:w-48">
              <div className="truncate font-display text-sm font-semibold text-white">{current?.label || 'Administration'}</div>
              <div className="text-[11px] text-muted">Back-office Taltour</div>
            </div>
            <div className="flex min-w-0 flex-1 justify-center xl:justify-start"><GlobalSearch /></div>
            <Link href="/" target="_blank" className="hidden items-center gap-1.5 rounded-xl border border-line px-3 py-2 text-xs font-medium text-soft hover:border-white/25 hover:text-white md:inline-flex">
              <ExternalLink className="h-3.5 w-3.5" /> Voir le site
            </Link>
            <div className="flex items-center gap-2 border-l border-line pl-3">
              <span className="hidden h-9 w-9 items-center justify-center rounded-full bg-grad-accent text-xs font-bold text-white sm:flex">
                {(user.prenom?.[0] || '') + (user.nom?.[0] || '')}
              </span>
              <span className="hidden text-sm leading-tight sm:block">
                <span className="block font-medium text-white">{user.prenom} {user.nom}</span>
                <span className="block text-[11px] text-muted">Administrateur</span>
              </span>
              <button onClick={logout} className="rounded-lg p-2 text-muted hover:bg-white/5 hover:text-white" title="Se déconnecter" aria-label="Se déconnecter"><LogOut className="h-4 w-4" /></button>
            </div>
          </div>
        </header>
        <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8 print:p-0">{children}</main>
      </div>
    </ToastProvider>
  );
}

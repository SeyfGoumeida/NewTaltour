import Link from 'next/link';
import { ArrowLeft, CarFront, Headphones } from 'lucide-react';
import Logo from '@/components/Logo';
import { currentSite } from '@/lib/server';

export const metadata = { title: 'Page introuvable' };

const links = [
  { href: '/tarifs', label: 'Tarifs' },
  { href: '/options', label: 'Options' },
  { href: '/faq', label: 'FAQ' },
  { href: '/contact', label: 'Contact' },
];

export default async function NotFound() {
  const site = await currentSite();
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-line bg-ink-900/80 backdrop-blur-xl">
        <div className="container-x flex h-16 items-center justify-between gap-4 lg:h-[72px]">
          <Logo site={site} />
          <nav className="flex items-center gap-1 text-sm" aria-label="Navigation">
            <Link href="/" className="hidden rounded-xl px-3 py-2 text-soft hover:bg-white/[0.06] hover:text-white sm:inline-flex">Louer mon véhicule</Link>
            <Link href="/contact" className="rounded-xl px-3 py-2 text-soft hover:bg-white/[0.06] hover:text-white">Contact</Link>
          </nav>
        </div>
      </header>
      <main className="relative flex flex-1 items-center overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-1/3 h-[420px] w-[720px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-blue/20 blur-[120px]" />
        </div>
        <div className="container-x relative py-20 text-center">
          <p className="font-display text-[7rem] font-extrabold leading-none tracking-tighter sm:text-[10rem]">
            <span className="text-grad">404</span>
          </p>
          <h1 className="mt-4 text-2xl font-extrabold tracking-tight sm:text-4xl">Cette page est introuvable</h1>
          <p className="mx-auto mt-4 max-w-md text-muted">La page que vous recherchez n&apos;existe pas ou a été déplacée. Reprenez la route depuis l&apos;accueil ou consultez nos tarifs.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/" className="inline-flex h-12 items-center gap-2 rounded-xl bg-grad-accent px-6 font-semibold text-white shadow-glow transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60">
              <ArrowLeft className="h-4 w-4" /> Retour à l&apos;accueil
            </Link>
            <Link href="/tarifs" className="inline-flex h-12 items-center gap-2 rounded-xl border border-line bg-white/[0.06] px-6 font-semibold text-white transition hover:bg-white/[0.1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/50">
              <CarFront className="h-4 w-4" /> Voir les tarifs
            </Link>
          </div>
          <ul className="mt-10 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
            {links.map((l) => (
              <li key={l.href}><Link href={l.href} className="text-muted hover:text-white">{l.label}</Link></li>
            ))}
          </ul>
          <p className="mt-10 inline-flex items-center gap-2 text-xs text-muted"><Headphones className="h-4 w-4 text-brand-cyan" /> Besoin d&apos;aide ? Notre équipe est à votre écoute 7jours/7 et 24h/24.</p>
        </div>
      </main>
    </div>
  );
}

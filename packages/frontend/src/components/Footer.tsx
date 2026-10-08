import Link from 'next/link';
import { Phone } from 'lucide-react';
import { FacebookIcon, InstagramIcon, YoutubeIcon } from './SocialIcons';
import Logo from './Logo';
import type { SiteInfo } from '@/lib/types';

export default function Footer({ site }: { site: SiteInfo }) {
  const e = site.entreprise;
  const share = encodeURIComponent('https://taltour.com');
  return (
    <footer className="mt-24 border-t border-line bg-ink-950/60">
      <div className="container-x grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <Logo site={site.code} />
          <p className="mt-4 max-w-sm text-sm text-muted">
            {site.slogan} Service de qualité depuis {e.depuis}, une équipe professionnelle à votre écoute 7jours/7 et 24h/24.
          </p>
          <div className="mt-5 grid gap-2 text-sm">
            {site.hotline && (
              <a href={`tel:${site.hotline.replace(/\s/g, '')}`} className="inline-flex items-center gap-2 font-semibold text-white">
                <Phone className="h-4 w-4 text-brand-cyan" /> Hotline {site.hotline}
              </a>
            )}
            {site.telephones.map((t) => (
              <a key={t} href={`tel:${t.replace(/[^+\d]/g, '')}`} className="text-muted hover:text-white">{t}</a>
            ))}
          </div>
        </div>

        <div>
          <h4 className="mb-4 text-sm font-semibold">Ma location</h4>
          <ul className="grid gap-2.5 text-sm text-muted">
            <li><Link href="/mon-compte" className="hover:text-white">Mon compte</Link></li>
            <li><Link href="/" className="hover:text-white">Louer mon véhicule</Link></li>
            <li><Link href="/tarifs" className="hover:text-white">Tarifs</Link></li>
            <li><Link href="/options" className="hover:text-white">Options</Link></li>
            <li><Link href="/plan-du-site" className="hover:text-white">Plan du site</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-4 text-sm font-semibold">Infos pratiques</h4>
          <ul className="grid gap-2.5 text-sm text-muted">
            <li><Link href="/simple-comme-taltour" className="hover:text-white">Simple comme Taltour</Link></li>
            <li><Link href="/conditions-de-location" className="hover:text-white">Conditions de location</Link></li>
            <li><Link href="/faq" className="hover:text-white">FAQ</Link></li>
            <li><Link href="/tarifs" className="hover:text-white">Tous les véhicules</Link></li>
            <li><Link href="/occasions" className="hover:text-white">Véhicules d&apos;occasion</Link></li>
            <li><Link href="/mentions-legales" className="hover:text-white">Mentions légales</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="mb-4 text-sm font-semibold">Vous aimez Taltour ?</h4>
          <div className="flex gap-2">
            <a href={e.facebook} target="_blank" rel="noopener noreferrer" className="glass-soft flex h-10 w-10 items-center justify-center text-soft hover:text-white" aria-label="Facebook"><FacebookIcon /></a>
            <a href={e.instagram} target="_blank" rel="noopener noreferrer" className="glass-soft flex h-10 w-10 items-center justify-center text-soft hover:text-white" aria-label="Instagram"><InstagramIcon /></a>
            <a href={e.youtube} target="_blank" rel="noopener noreferrer" className="glass-soft flex h-10 w-10 items-center justify-center text-soft hover:text-white" aria-label="YouTube"><YoutubeIcon /></a>
          </div>
          <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted">
            <a href={`https://www.facebook.com/sharer.php?u=${share}`} target="_blank" rel="noopener noreferrer" className="hover:text-white">Partager sur Facebook</a>
            <a href={`https://twitter.com/share?url=${share}&text=${encodeURIComponent('Location de véhicules au Maghreb')}`} target="_blank" rel="noopener noreferrer" className="hover:text-white">Partager sur X</a>
          </div>
          <Link href="/avis" className="mt-5 inline-block text-sm font-medium text-brand-cyan hover:underline">Voir les {site.stats.avis} avis</Link>
        </div>
      </div>
      <div className="border-t border-line">
        <div className="container-x flex flex-col items-center justify-between gap-2 py-5 text-xs text-muted sm:flex-row">
          <span>© {new Date().getFullYear()} taltour.com</span>
          <a href="#top" className="hover:text-white">Haut de page</a>
        </div>
      </div>
    </footer>
  );
}

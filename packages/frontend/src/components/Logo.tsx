import Link from 'next/link';
import clsx from 'clsx';

export default function Logo({ site = 'dz', className }: { site?: 'dz' | 'ma'; className?: string }) {
  if (site === 'ma')
    return (
      <Link href="/" className={clsx('flex items-center gap-2 font-display text-lg font-extrabold leading-none text-white', className)} aria-label="Ouziad Marrakech Cars">
        <span className="rounded-lg bg-gold px-1.5 py-1 text-ink-900">OM</span>
        <span>Ouziad <span className="text-gold">Marrakech Cars</span></span>
      </Link>
    );
  return (
    <Link href="/" className={clsx('flex items-center', className)} aria-label="Taltour, accueil">
      <img src="/logo-taltour.png" alt="Taltour" className="h-9 w-auto sm:h-10" />
    </Link>
  );
}

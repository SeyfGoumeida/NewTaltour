import type { Metadata } from 'next';
import { Inter, Manrope } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
import { getSite } from '@/lib/server';

const sans = Inter({ subsets: ['latin'], variable: '--font-sans' });
const display = Manrope({ subsets: ['latin'], variable: '--font-display', weight: ['600', '700', '800'] });

export async function generateMetadata(): Promise<Metadata> {
  const site = await getSite();
  return {
    title: { default: `${site.titre} | ${site.nom}`, template: `%s | ${site.nom}` },
    description: `${site.slogan} Location de voitures en Algérie depuis ${site.entreprise.depuis} : livraison dans tous les aéroports, plus de 30 modèles, paiement sécurisé en ligne.`,
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const site = await getSite();
  return (
    <html lang="fr" className={`${sans.variable} ${display.variable}`}>
      <body id="top" className="min-h-screen font-sans">
        <Providers site={site}>{children}</Providers>
      </body>
    </html>
  );
}

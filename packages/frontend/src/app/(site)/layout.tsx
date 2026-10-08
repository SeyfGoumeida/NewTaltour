import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CookieBanner from '@/components/CookieBanner';
import { getSite } from '@/lib/server';

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const site = await getSite();
  return (
    <>
      <Header />
      <main className="min-h-[60vh]">{children}</main>
      <Footer site={site} />
      <CookieBanner />
    </>
  );
}

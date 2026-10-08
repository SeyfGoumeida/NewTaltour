import type { Metadata } from 'next';
import { PageHeader } from '@/components/ui';
import OccasionsGrid, { Occasion } from '@/components/contenu/OccasionsGrid';
import { sapi } from '@/lib/server';

export const metadata: Metadata = {
  title: "Acheter voiture d'occasion en Algérie, prix réduits",
  description: "Véhicules d'occasion récents à prix cassés, entretenus par notre réseau de techniciens.",
};

export default async function OccasionsPage() {
  const items = await sapi<Occasion[]>('/occasions');
  return (
    <>
      <PageHeader eyebrow="Occasions" title="Véhicules" highlight="d'occasion" sub="■ Véhicules récents à prix cassés ! ■" />
      <section className="container-x py-10 sm:py-14">
        <p className="mb-6 text-sm text-muted">{items.length} véhicule{items.length > 1 ? 's' : ''} en vente</p>
        <OccasionsGrid items={items} />
      </section>
    </>
  );
}

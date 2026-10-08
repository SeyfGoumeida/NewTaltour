import type { Metadata } from 'next';
import { CalendarRange, Gauge, ShieldCheck } from 'lucide-react';
import { PageHeader } from '@/components/ui';
import TarifsView from '@/components/contenu/TarifsView';
import { splitTitle } from '@/components/contenu/text';
import { getSite, sapi } from '@/lib/server';
import type { Modele } from '@/lib/types';

export const metadata: Metadata = {
  title: 'Tarifs',
  description: 'Tous nos véhicules de location avec leur fiche technique complète et leurs tarifs basse saison : forfaits 1, 7, 14, 30, 90 et 180 jours.',
};

export default async function TarifsPage() {
  const [site, list] = await Promise.all([getSite(), sapi<Modele[]>('/modeles')]);
  const modeles = await Promise.all(
    list.map((m) =>
      sapi<Modele>(`/modeles/${encodeURIComponent(m.slug)}`)
        .then((d) => ({ ...m, fiche: d.fiche }))
        .catch(() => m),
    ),
  );
  const forfaits = site.tarification.forfaits?.length ? site.tarification.forfaits : [1, 7, 14, 30, 90, 180];
  const [title, highlight] = splitTitle(site.titre);

  return (
    <>
      <PageHeader eyebrow="Tarifs" title={title} highlight={highlight} sub={`${modeles.length} modèles, fiche technique complète et tarifs basse saison pour chaque forfait.`}>
        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          <div className="glass-soft flex items-center gap-3 p-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent"><CalendarRange className="h-5 w-5" /></span>
            <p className="text-sm text-soft">Prix <strong className="text-white">Basse saison</strong>, forfaits dégressifs {forfaits.filter((j) => j > 1).join(', ')} jours</p>
          </div>
          <div className="glass-soft flex items-center gap-3 p-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-blue/15 text-[#7EA6FF]"><Gauge className="h-5 w-5" /></span>
            <p className="text-sm text-soft">Kilométrage inclus dans le forfait de base : <strong className="text-white">{site.tarification.km_inclus_jour}km/jour</strong></p>
          </div>
          <div className="glass-soft flex items-center gap-3 p-4">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gold/10 text-gold"><ShieldCheck className="h-5 w-5" /></span>
            <p className="text-sm text-soft">Louez sans caution avec l&apos;<strong className="text-white">Assurance Gold</strong></p>
          </div>
        </div>
      </PageHeader>
      <section className="container-x py-10 sm:py-14">
        <TarifsView modeles={modeles} forfaits={forfaits} />
        <p className="mt-8 text-center text-xs text-muted">
          Tarifs indiqués en basse saison. Le prix définitif de votre location est calculé selon vos dates lors de la réservation. Kilométrage inclus dans le forfait de base : {site.tarification.km_inclus_jour}km/jour.
        </p>
      </section>
    </>
  );
}

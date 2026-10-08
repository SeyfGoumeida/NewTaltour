import { Suspense } from 'react';
import { Loading } from '@/components/ui';
import Results from './Results';
import { sapi } from '@/lib/server';
import type { Modele } from '@/lib/types';

export const metadata = { title: 'Louer une voiture' };

export default async function LocationPage() {
  const modeles = await sapi<Modele[]>('/modeles');
  return (
    <Suspense fallback={<Loading />}>
      <Results modeles={modeles.map((m) => ({ slug: m.slug, nom: m.nom }))} />
    </Suspense>
  );
}

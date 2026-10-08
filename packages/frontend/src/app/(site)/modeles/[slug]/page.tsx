import Link from 'next/link';
import { Check, ChevronRight, MapPin, ShieldCheck, X } from 'lucide-react';
import CarSpecs, { categoryLabel } from '@/components/CarSpecs';
import ModelTiles from '@/components/ModelTiles';
import BookBox from './BookBox';
import { Badge } from '@/components/ui';
import { getSite, sapi } from '@/lib/server';
import { euro } from '@/lib/format';
import type { Modele } from '@/lib/types';

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const m = await sapi<Modele>(`/modeles/${params.slug}`).catch(() => null);
  return { title: m ? `Location ${m.nom_affiche}` : 'Modèle' };
}

const SECTIONS = ['Véhicule', 'Moteur', 'Confort', 'Look', 'Sécurité'];

function Value({ v }: { v: string | boolean | null }) {
  if (v === true) return <Check className="h-4 w-4 text-ok" aria-label="Oui" />;
  if (v === false) return <X className="h-4 w-4 text-danger/80" aria-label="Non" />;
  if (v === null || v === '') return <span className="text-muted">-</span>;
  return <span className="text-right text-white">{v}</span>;
}

export default async function ModelePage({ params, searchParams }: { params: { slug: string }; searchParams: Record<string, string | undefined> }) {
  const [modele, site, all] = await Promise.all([sapi<Modele>(`/modeles/${params.slug}`, { notFoundOn404: true }), getSite(), sapi<Modele[]>('/modeles')]);
  const cat = categoryLabel(modele);
  const t1 = modele.tarifs.find((t) => t.jours === 1);
  const prix1 = (x: Modele) => x.tarifs.find((t) => t.jours === 1)?.prix ?? 0;
  const similaires = all
    .filter((x) => x.id !== modele.id)
    .sort((a, b) => Number(b.categorie === modele.categorie) - Number(a.categorie === modele.categorie) || Math.abs(prix1(a) - (t1?.prix ?? 0)) - Math.abs(prix1(b) - (t1?.prix ?? 0)))
    .slice(0, 4);

  return (
    <div className="container-x pb-10 pt-8">
      <nav className="mb-6 flex items-center gap-1.5 text-sm text-muted">
        <Link href="/" className="hover:text-white">Accueil</Link><ChevronRight className="h-3.5 w-3.5" />
        <Link href="/tarifs" className="hover:text-white">Tarifs</Link><ChevronRight className="h-3.5 w-3.5" />
        <span className="truncate text-soft">{modele.nom_affiche}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[1.35fr_1fr]">
        <div>
          <div className="overflow-hidden rounded-3xl border border-line bg-white">
            {modele.image && <img src={modele.image} alt={modele.nom_affiche} className="aspect-[16/10] w-full object-cover" />}
          </div>
          <div className="mt-6">
            <div className="flex flex-wrap items-center gap-2">
              {cat && <Badge tone="info">{cat}</Badge>}
              <Badge tone="muted">{modele.carburant}</Badge>
              <Badge tone="muted">{modele.type_boite || modele.boite}</Badge>
              {modele.puissance_ch && <Badge tone="muted">{modele.puissance_ch} ch</Badge>}
            </div>
            <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">{modele.nom_affiche}</h1>
            <CarSpecs m={modele} withFuel className="mt-3 text-sm" />
            {modele.equipements.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2">
                {modele.equipements.map((e) => <span key={e} className="chip"><Check className="h-3 w-3 text-ok" /> {e}</span>)}
              </div>
            )}
            {modele.villes && modele.villes.length > 0 && (
              <p className="mt-5 flex items-start gap-2 text-sm text-soft">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-cyan" /> Véhicules stationnés à : {modele.villes.join(', ')}
              </p>
            )}
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {SECTIONS.filter((s) => modele.fiche?.[s]).map((s) => (
              <div key={s} className="glass p-5">
                <h2 className="mb-3 text-base font-semibold">{s}</h2>
                <dl className="divide-y divide-line text-sm">
                  {Object.entries(modele.fiche![s]).map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between gap-4 py-2">
                      <dt className="text-muted">{k}</dt>
                      <dd className="flex min-w-0 justify-end"><Value v={v} /></dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </div>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-28 lg:self-start">
          <div className="glass p-5">
            <div className="flex items-end justify-between">
              <div>
                <div className="text-xs text-muted">Basse saison 1j</div>
                <div className="font-display text-3xl font-bold text-white">{euro(t1?.prix)}<span className="text-sm font-medium text-muted"> /jour</span></div>
              </div>
              <div className="text-right text-xs text-muted">Montant caution<div className="text-base font-semibold text-white">{euro(modele.caution)}</div></div>
            </div>
            <table className="mt-5 w-full text-sm">
              <tbody className="divide-y divide-line">
                {modele.tarifs.map((t) => (
                  <tr key={t.jours}>
                    <td className="py-2 text-muted">Basse saison {t.jours}j</td>
                    <td className="py-2 text-right font-semibold text-white">{euro(t.prix)}</td>
                    <td className="py-2 pl-3 text-right text-xs text-muted">{t.prix > 0 ? `${euro(t.prix / t.jours)} /j` : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-4 text-xs text-muted">Kilométrage inclus dans le forfait de base : {site.tarification.km_inclus_jour}km/jour. Tarifs majorés en haute saison.</p>
          </div>
          <BookBox modeleId={modele.id} slug={modele.slug} initial={searchParams} />
          <div className="glass-soft flex gap-3 p-4 text-sm text-soft">
            <ShieldCheck className="h-5 w-5 shrink-0 text-brand-cyan" />
            <span>Pas de chéquier pour la caution ? Prenez l&apos;<Link href="/options" className="link">Assurance Gold</Link> : sans caution, ni passeport.</span>
          </div>
        </aside>
      </div>

      {similaires.length > 0 && (
        <section className="mt-20">
          <h2 className="mb-5 text-2xl font-bold">Vous aimerez aussi</h2>
          <ModelTiles modeles={similaires} limit={4} />
        </section>
      )}
    </div>
  );
}

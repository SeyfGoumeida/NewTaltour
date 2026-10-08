import Link from 'next/link';
import { ArrowRight, BadgePercent, CalendarCheck2, Check, Headphones, Plane, PlaneLanding, Quote, ShieldCheck, Star, Trophy } from 'lucide-react';
import SearchForm from '@/components/SearchForm';
import ModelTiles from '@/components/ModelTiles';
import { Eyebrow, LinkButton, SectionTitle, Stars } from '@/components/ui';
import { getSite, sapi } from '@/lib/server';
import { dateFr } from '@/lib/format';
import type { Avis, Modele, Paged } from '@/lib/types';

export default async function Home() {
  const [site, modeles, avis] = await Promise.all([
    getSite(),
    sapi<Modele[]>('/modeles'),
    sapi<Paged<Avis> & { moyenne: number; nombre: number }>('/avis?commentaires=1&size=6'),
  ]);
  const airports = site.villes.filter((v) => v.aeroport);
  const isMa = site.code === 'ma';

  return (
    <>
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <img src="/hero/tucson-scene.jpg" alt=""
            className="absolute right-0 top-0 h-full w-full object-cover object-[30%_40%] opacity-60 [mask-image:linear-gradient(90deg,transparent_0%,black_40%)] lg:w-[68%] 2xl:w-[58%]" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink-900 via-ink-900/40 to-transparent" />
          <div className="absolute -right-40 top-10 h-[420px] w-[620px] rounded-full bg-brand-blue/25 blur-[120px]" />
        </div>
        <div className="container-x relative pb-14 pt-14 sm:pt-20 lg:pb-20">
          <a href="https://commons.wikimedia.org/wiki/File:Hyundai_Tucson_N_Line_NX4_Phantom_Black_Pearl_(1).jpg" target="_blank" rel="noopener noreferrer"
            className="absolute bottom-2 right-4 z-10 text-[10px] text-white/30 hover:text-white/70 sm:right-6 lg:right-8">
            Photo : Damian B Oh, CC BY-SA 4.0 (modifiée)
          </a>
          <div className="max-w-2xl animate-fade-up">
            <Eyebrow>Service de qualité depuis {site.entreprise.depuis}</Eyebrow>
            <h1 className="mt-6 text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
              Choisissez {site.nom},
              <br />
              <span className="text-accent">faites le tour !</span>
            </h1>
            <p className="mt-6 max-w-lg text-base text-soft sm:text-lg">
              {site.titre}. {site.nom} est présent dans tous les grands aéroports. Descendez de l&apos;avion, notre agent vous attend !
            </p>
          </div>
          <div className="absolute right-8 top-16 hidden h-24 w-24 flex-col items-center justify-center rounded-full border border-line bg-ink-850/80 text-center backdrop-blur lg:flex">
            <span className="font-display text-lg font-bold leading-none text-white">7j/7</span>
            <span className="mt-1 text-[11px] text-muted">24h/24</span>
          </div>
          <div className="mt-10 animate-fade-up [animation-delay:120ms]">
            <SearchForm modeles={modeles.map((m) => ({ slug: m.slug, nom: m.nom }))} />
            <p className="mt-3 flex items-center gap-2 text-sm text-muted">
              <Headphones className="h-4 w-4 text-brand-cyan" /> Hotline {site.hotline}
            </p>
          </div>
        </div>
      </section>

      <section className="container-x">
        <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
          <div>
            <h2 className="mb-5 text-xl font-bold">Les meilleurs prix sont chez {site.nom}</h2>
            <ModelTiles modeles={modeles} />
          </div>
          <aside className="glass grid content-start gap-1 p-3">
            {[
              { icon: <Star className="h-5 w-5" />, v: `${site.stats.avis}`, l: 'avis clients' },
              { icon: <Trophy className="h-5 w-5" />, v: `${site.stats.modeles}`, l: 'modèles différents' },
              { icon: <PlaneLanding className="h-5 w-5" />, v: `${site.villes.length}`, l: 'villes desservies' },
              { icon: <CalendarCheck2 className="h-5 w-5" />, v: `${site.entreprise.depuis}`, l: 'implanté depuis' },
            ].map((s) => (
              <div key={s.l} className="flex items-center gap-4 rounded-xl p-3 hover:bg-white/[0.03]">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent">{s.icon}</span>
                <div>
                  <div className="font-display text-xl font-bold text-white">{s.v}</div>
                  <div className="text-xs text-muted">{s.l}</div>
                </div>
              </div>
            ))}
          </aside>
        </div>
      </section>

      <section className="container-x mt-24">
        <SectionTitle eyebrow={site.titre} title={`Pourquoi choisir`} highlight={`${site.nom} ?`} />
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { icon: <BadgePercent className="h-5 w-5" />, t: 'Fidélité récompensée', d: `Votre fidélité est récompensée chez ${site.nom} ! Chaque location vous offre une remise de ${site.tarification.remise_fidelite_pct}% sur la prochaine réservation.` },
            { icon: <Plane className="h-5 w-5" />, t: "Nos agents vous attendent à l'aéroport", d: `${site.nom} est présent dans tous les grands aéroports. Descendez de l'avion, notre agent vous attend !` },
            { icon: <ShieldCheck className="h-5 w-5" />, t: `Les meilleurs prix sont chez ${site.nom}`, d: `Forfaits dégressifs 7, 14, 30, 90 et 180 jours, ${site.tarification.km_inclus_jour} km / jour inclus, Assurance Gold pour louer sans caution.` },
          ].map((f) => (
            <div key={f.t} className="glass p-6">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-brand-blue/30 bg-brand-blue/10 text-[#7EA6FF]">{f.icon}</span>
              <h3 className="mt-5 text-lg font-semibold">{f.t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      {!isMa && (
        <section className="container-x mt-24">
          <div className="glass relative overflow-hidden p-8 sm:p-10">
            <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand-cyan/10 blur-3xl" />
            <div className="relative grid gap-8 lg:grid-cols-[1.3fr_1fr] lg:items-center">
              <div>
                <Eyebrow>24h/7j</Eyebrow>
                <h2 className="mt-4 text-3xl font-extrabold tracking-tight">Transfert <span className="text-grad">Aéroport</span></h2>
                <p className="mt-4 max-w-xl text-soft">
                  Notre service de transfert est mis à votre disposition de l&apos;Aéroport vers votre Hôtel ou autre lieux de destination. Nos chauffeurs sont disponibles 24h/7j au rendez-vous pour vous transporter à votre destination.
                </p>
                <ul className="mt-5 grid gap-2 text-sm text-soft">
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-ok" /> Paiement en ligne ou a votre arrivée</li>
                  <li className="flex items-center gap-2"><Check className="h-4 w-4 text-ok" /> Prix tout inclus (péage, carburant, chauffeur…)</li>
                </ul>
                <LinkButton href="/transfert-aeroport" className="mt-7">Devis Transfert <ArrowRight className="h-4 w-4" /></LinkButton>
              </div>
              <div>
                <div className="mb-3 text-sm font-medium text-muted">Aéroports desservis</div>
                <div className="grid grid-cols-2 gap-2">
                  {airports.map((a) => (
                    <div key={a.id} className="glass-soft flex items-center gap-2.5 px-3 py-3 text-sm font-medium text-white">
                      <PlaneLanding className="h-4 w-4 text-brand-cyan" /> {a.nom}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      <section className="container-x mt-24">
        <SectionTitle eyebrow="Avis clients" title="›› Objectif" highlight="100% satisfaction"
          action={<LinkButton href="/avis" variant="secondary">Voir les {avis.nombre} avis <ArrowRight className="h-4 w-4" /></LinkButton>} />
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="glass flex flex-col justify-between bg-gradient-to-br from-brand-blue/15 to-transparent p-6 lg:row-span-2">
            <div>
              <Quote className="h-8 w-8 text-accent" />
              <div className="mt-4 flex items-center gap-2"><Stars value={5} size={16} /><span className="text-sm font-semibold text-white">Je recommande {site.nom} à mes proches !</span></div>
              <p className="mt-4 text-lg leading-relaxed text-white">
                « Je suis très satisfait de cettre première location. Personnel pro et attentionné, aussi bien en France qu&apos;en Algérie. Très satisfait aussi de la voiture qui était quasiment neuve. Si je dois revenir, je choisirai Taltour sans hésiter. »
              </p>
            </div>
            <div className="mt-6 border-t border-line pt-4">
              <div className="text-sm font-semibold text-white">Pascal Dahmane</div>
              <div className="text-xs text-muted">le 12/09/2026</div>
              <div className="mt-5 flex items-end gap-3">
                <span className="font-display text-5xl font-extrabold text-white">{avis.moyenne.toFixed(1).replace('.', ',')}</span>
                <div className="pb-1.5"><Stars value={avis.moyenne} /><div className="mt-1 text-xs text-muted">{avis.nombre} avis clients</div></div>
              </div>
            </div>
          </div>
          {avis.items.slice(0, 4).map((a) => (
            <div key={a.id} className="glass p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-white">{a.auteur}</span>
                <Stars value={a.note} />
              </div>
              <p className="mt-3 line-clamp-4 text-sm leading-relaxed text-soft">{a.observation_reservation || a.observation_place}</p>
              <div className="mt-3 text-xs text-muted">{dateFr(a.created_at)}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="container-x mt-24">
        <div className="glass grid gap-8 p-8 sm:p-10 lg:grid-cols-[1fr_1.4fr] lg:items-center">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight">Prenez la voiture à l&apos;est, <span className="text-grad">remettez la à l&apos;ouest</span></h2>
            <p className="mt-4 text-soft">Livraison garantie dans tous les aéroports, aussi aux ports. Vous pouvez donc louer votre voiture à {site.villes.map((v) => v.nom).join(', ')}.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <LinkButton href="/tarifs">Voir les tarifs</LinkButton>
              <LinkButton href="/simple-comme-taltour" variant="secondary">Simple comme Taltour</LinkButton>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {site.villes.map((v) => (
              <Link key={v.id} href={`/location?depart=${v.id}&retour=${v.id}`} className="chip px-3.5 py-2 text-sm hover:border-white/25 hover:text-white">
                {v.aeroport ? <PlaneLanding className="h-3.5 w-3.5 text-brand-cyan" /> : <span className="h-1.5 w-1.5 rounded-full bg-accent" />} {v.nom}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

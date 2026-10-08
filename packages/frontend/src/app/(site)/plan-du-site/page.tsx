import type { Metadata } from 'next';
import Link from 'next/link';
import { CarFront, ChevronRight, Info, Newspaper, UserRound } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { PageHeader } from '@/components/ui';
import { categoryLabel } from '@/components/CarSpecs';
import { getSite, sapi } from '@/lib/server';
import type { Article, Modele, Paged } from '@/lib/types';

export const metadata: Metadata = { title: 'Plan du site' };

function Group({ icon: Icon, title, children }: { icon: LucideIcon; title: string; children: React.ReactNode }) {
  return (
    <div className="glass p-6">
      <h2 className="mb-4 flex items-center gap-2.5 text-base font-bold">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-blue/10 text-brand-cyan"><Icon className="h-4 w-4" /></span>
        {title}
      </h2>
      {children}
    </div>
  );
}

function Item({ href, children, sub }: { href: string; children: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <li>
      <Link href={href} className="group flex items-start gap-1.5 rounded-lg py-1.5 text-sm text-soft hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/50">
        <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-muted group-hover:text-accent" />
        <span>
          {children}
          {sub && <span className="ml-1.5 text-xs text-muted">{sub}</span>}
        </span>
      </Link>
    </li>
  );
}

export default async function PlanPage() {
  const [site, modeles, articles] = await Promise.all([getSite(), sapi<Modele[]>('/modeles'), sapi<Paged<Article>>('/articles?size=200')]);
  return (
    <>
      <PageHeader eyebrow="Plan du site" title={`${site.nom} -`} highlight="Plan du site" />
      <section className="container-x py-10 sm:py-14">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Group icon={CarFront} title="Location">
            <ul>
              <Item href="/">Louer mon véhicule</Item>
              <Item href="/tarifs">Tarifs</Item>
              <Item href="/options">Options</Item>
              <Item href="/transfert-aeroport">Transfert Aéroport</Item>
              <Item href="/occasions">Occasions</Item>
            </ul>
          </Group>
          <Group icon={Info} title="Infos pratiques">
            <ul>
              <Item href="/conditions-de-location">Conditions</Item>
              <Item href="/faq">FAQ</Item>
              <Item href="/contact">Contact</Item>
              <Item href="/simple-comme-taltour">Simple comme Taltour</Item>
              <Item href="/avis">Avis clients</Item>
              <Item href="/mentions-legales">Mentions légales</Item>
            </ul>
          </Group>
          <Group icon={UserRound} title="Ma location">
            <ul>
              <Item href="/mon-compte">Mon compte</Item>
              <Item href="/plan-du-site">Plan du site</Item>
            </ul>
          </Group>
          <div className="md:col-span-2 lg:col-span-3">
            <Group icon={Newspaper} title="Actus">
              <ul className="grid gap-x-6 sm:grid-cols-2 lg:grid-cols-3">
                <Item href="/actus">BLOG OFFICIEL TALTOUR</Item>
                {articles.items.map((a) => (
                  <Item key={a.id} href={`/actus/${a.slug}`}>{a.titre}</Item>
                ))}
              </ul>
            </Group>
          </div>
          <div className="md:col-span-2 lg:col-span-3">
            <Group icon={CarFront} title={`Tous les véhicules (${modeles.length})`}>
              <ul className="grid gap-x-6 sm:grid-cols-2 lg:grid-cols-3">
                {modeles.map((m) => (
                  <Item key={m.id} href={`/modeles/${m.slug}`} sub={categoryLabel(m) ?? undefined}>{m.nom_affiche}</Item>
                ))}
              </ul>
            </Group>
          </div>
        </div>
      </section>
    </>
  );
}

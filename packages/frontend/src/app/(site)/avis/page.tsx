import type { Metadata } from 'next';
import Link from 'next/link';
import clsx from 'clsx';
import { MessageSquareText, Star } from 'lucide-react';
import { Empty, Stars } from '@/components/ui';
import LinkPagination, { buildHref } from '@/components/contenu/LinkPagination';
import { nombre } from '@/components/contenu/text';
import { getSite, sapi } from '@/lib/server';
import { dateFr } from '@/lib/format';
import type { Avis, Paged } from '@/lib/types';

type AvisResponse = Paged<Avis> & { repartition: { note: number; n: number }[]; moyenne: number; nombre: number };

export const metadata: Metadata = {
  title: 'Avis clients',
  description: 'Les avis de nos clients sur leurs locations : note, observations sur la réservation et sur place.',
};

const SIZE = 30;

export default async function AvisPage({ searchParams }: { searchParams: { page?: string; note?: string; commentaires?: string } }) {
  const page = Math.max(1, parseInt(searchParams.page || '1', 10) || 1);
  const noteN = parseInt(searchParams.note || '', 10);
  const note = noteN >= 1 && noteN <= 5 ? noteN : undefined;
  const commentaires = searchParams.commentaires === '1' ? '1' : undefined;
  const qs = buildHref('/avis', { page, size: SIZE, note, commentaires });
  const [site, data] = await Promise.all([getSite(), sapi<AvisResponse>(qs)]);
  const pages = Math.max(1, Math.ceil(data.total / SIZE));
  const max = Math.max(1, ...data.repartition.map((r) => r.n));
  const filters = { note, commentaires };
  const chip = (active: boolean) =>
    clsx(
      'inline-flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/50',
      active ? 'border-brand-blue bg-brand-blue text-white' : 'border-line bg-white/[0.03] text-soft hover:text-white',
    );

  return (
    <>
      <section className="border-b border-line bg-gradient-to-b from-ink-850/60 to-transparent">
        <div className="container-x py-12 sm:py-16">
          <nav aria-label="Fil d'Ariane" className="text-sm text-muted">
            <Link href="/" className="hover:text-white">{site.nom} Location</Link> <span aria-hidden>›</span> <span className="text-soft">Avis clients</span>
          </nav>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight sm:text-5xl">
            {site.nom} Location › <span className="text-grad">Avis clients</span>
          </h1>
          <div className="mt-8 grid gap-4 lg:grid-cols-[320px_1fr]">
            <div className="glass flex items-center gap-5 p-6">
              <span className="font-display text-6xl font-extrabold text-white">{data.moyenne.toFixed(1).replace('.', ',')}</span>
              <div>
                <Stars value={data.moyenne} size={18} />
                <div className="mt-1.5 text-sm text-soft">{nombre(data.nombre)} avis clients</div>
                <div className="text-xs text-muted">Note moyenne sur 5</div>
              </div>
            </div>
            <div className="glass p-5 sm:p-6">
              <ul className="space-y-2">
                {[5, 4, 3, 2, 1].map((n) => {
                  const r = data.repartition.find((x) => x.note === n)?.n ?? 0;
                  const pct = data.nombre ? Math.round((r / data.nombre) * 100) : 0;
                  return (
                    <li key={n}>
                      <Link href={buildHref('/avis', { note: note === n ? undefined : n, commentaires })} className={clsx('group grid grid-cols-[64px_1fr_72px] items-center gap-3 rounded-lg px-1 py-0.5 text-sm hover:bg-white/[0.03]', note === n && 'bg-white/[0.05]')} aria-label={`${n} étoile${n > 1 ? 's' : ''} : ${r} avis`}>
                        <span className="inline-flex items-center gap-1 font-semibold text-white">{n} <Star className="h-3.5 w-3.5 fill-gold text-gold" /></span>
                        <span className="h-2.5 overflow-hidden rounded-full bg-white/[0.06]">
                          <span className={clsx('block h-full rounded-full', n >= 4 ? 'bg-gold' : n === 3 ? 'bg-warn/80' : 'bg-danger/70')} style={{ width: `${(r / max) * 100}%` }} />
                        </span>
                        <span className="text-right text-xs tabular-nums text-muted">{nombre(r)} · {pct}%</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="container-x py-10 sm:py-12">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filtrer par note">
            <Link href={buildHref('/avis', { commentaires })} className={chip(!note)}>Toutes les notes</Link>
            {[5, 4, 3, 2, 1].map((n) => (
              <Link key={n} href={buildHref('/avis', { note: n, commentaires })} className={chip(note === n)} aria-current={note === n ? 'true' : undefined}>
                {n} étoile{n > 1 ? 's' : ''}
              </Link>
            ))}
            <Link href={buildHref('/avis', { note, commentaires: commentaires ? undefined : '1' })} className={chip(!!commentaires)} aria-pressed={!!commentaires}>
              <MessageSquareText className="h-4 w-4" /> Avec commentaire
            </Link>
          </div>
          <p className="text-sm text-muted">{nombre(data.total)} avis clients, {pages} page{pages > 1 ? 's' : ''}</p>
        </div>

        {data.items.length === 0 ? (
          <Empty icon={<Star className="h-6 w-6" />} title="Aucun avis">Aucun avis ne correspond à ces critères.</Empty>
        ) : (
          <div className="glass overflow-hidden p-0">
            <div className="hidden grid-cols-[220px_1fr_110px] gap-6 border-b border-line bg-white/[0.03] px-6 py-3 text-xs font-semibold uppercase tracking-wider text-muted md:grid">
              <span>Auteur</span>
              <span>Note / commentaires</span>
              <span className="text-right">Date</span>
            </div>
            <ul className="divide-y divide-line">
              {data.items.map((a) => (
                <li key={a.id} className="grid gap-2 px-5 py-4 sm:px-6 md:grid-cols-[220px_1fr_110px] md:gap-6">
                  <div className="flex items-center justify-between gap-3 md:block">
                    <span className="font-semibold text-white">{a.auteur}</span>
                    <span className="text-xs text-muted md:hidden">{dateFr(a.created_at)}</span>
                  </div>
                  <div className="min-w-0 space-y-1.5">
                    <div className="flex items-center gap-2 text-sm text-muted">Note : <Stars value={a.note} /></div>
                    {a.observation_reservation && (
                      <p className="text-sm leading-relaxed text-soft"><span className="font-medium text-muted">Observations sur la réservation :</span> {a.observation_reservation}</p>
                    )}
                    {a.observation_place && (
                      <p className="text-sm leading-relaxed text-soft"><span className="font-medium text-muted">Observations sur place :</span> {a.observation_place}</p>
                    )}
                  </div>
                  <span className="hidden text-right text-sm tabular-nums text-muted md:block">{dateFr(a.created_at)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        <LinkPagination base="/avis" page={page} pages={pages} params={filters} />
      </section>
    </>
  );
}

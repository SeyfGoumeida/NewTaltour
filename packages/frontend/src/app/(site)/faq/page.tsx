import type { Metadata } from 'next';
import { ArrowRight, Headphones, Mail, Wrench } from 'lucide-react';
import Markdown from '@/components/Markdown';
import { LinkButton, PageHeader } from '@/components/ui';
import FaqAccordion from '@/components/contenu/FaqAccordion';
import { telHref } from '@/components/contenu/text';
import { getSite, sapi } from '@/lib/server';

interface Faq { id: number; question: string; reponse: string }

export const metadata: Metadata = {
  title: 'Foire aux questions',
  description: "Assurance Gold, option VIP, agent livreur, panne, annulation, kilométrage, documents : toutes les réponses à vos questions.",
};

export default async function FaqPage() {
  const [site, faq] = await Promise.all([getSite(), sapi<Faq[]>('/faq')]);
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((f) => ({ '@type': 'Question', name: f.question, acceptedAnswer: { '@type': 'Answer', text: f.reponse } })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <PageHeader eyebrow="FAQ" title="Toutes les réponses à" highlight="vos questions" />
      <section className="container-x py-10 sm:py-14">
        <div className="grid gap-8 lg:grid-cols-[1fr_340px] lg:items-start">
          <FaqAccordion items={faq.map((f) => ({ id: f.id, question: f.question, answer: <Markdown text={f.reponse} className="prose-taltour [&>*:last-child]:mb-0" /> }))} />
          <aside className="space-y-4 lg:sticky lg:top-32">
            <div className="glass relative overflow-hidden p-6">
              <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-accent/15 blur-3xl" />
              <div className="relative">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent"><Headphones className="h-5 w-5" /></span>
                <h2 className="mt-4 text-lg font-bold">Vous ne trouvez pas votre réponse ?</h2>
                <p className="mt-1 text-sm text-muted">Notre équipe est à votre écoute 7jours/7 et 24h/24.</p>
                <div className="mt-5 text-xs font-semibold uppercase tracking-wider text-muted">Hotline</div>
                <ul className="mt-1.5 space-y-1">
                  {site.entreprise.hotline_contact.map((t) => (
                    <li key={t}><a href={telHref(t)} className="font-display text-lg font-bold text-white hover:text-brand-cyan">{t}</a></li>
                  ))}
                </ul>
                <LinkButton href="/contact" full className="mt-5"><Mail className="h-4 w-4" /> Nous contacter <ArrowRight className="h-4 w-4" /></LinkButton>
              </div>
            </div>
            <div className="glass-soft flex items-center gap-3 p-4">
              <Wrench className="h-5 w-5 shrink-0 text-warn" />
              <p className="text-sm text-soft">En cas de panne : <a href={telHref(site.entreprise.panne)} className="font-semibold text-white hover:underline">{site.entreprise.panne}</a></p>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}

import type { Metadata } from 'next';
import { Headphones, Mail, MapPin, Phone, PlaneLanding, Wrench } from 'lucide-react';
import { PageHeader } from '@/components/ui';
import ContactForm from '@/components/contenu/ContactForm';
import { telHref } from '@/components/contenu/text';
import { getSite } from '@/lib/server';

export const metadata: Metadata = {
  title: 'Contact',
  description: 'Contacter Taltour location Algérie : hotline, numéros de téléphone, formulaire de contact et points de rendez-vous dans nos villes.',
};

export default async function ContactPage() {
  const site = await getSite();
  const e = site.entreprise;

  return (
    <>
      <PageHeader eyebrow="Contact" title="Contacter Taltour location" highlight="Algérie" />
      <section className="container-x py-10 sm:py-14">
        <div className="grid gap-6 lg:grid-cols-[380px_1fr] lg:items-start">
          <div className="space-y-4">
            <div className="glass relative overflow-hidden p-6 sm:p-7">
              <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-accent/15 blur-3xl" />
              <div className="relative">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-grad-accent text-white shadow-glow"><Headphones className="h-5 w-5" /></span>
                  <h2 className="text-lg font-extrabold uppercase tracking-wider">Hotline :</h2>
                </div>
                <ul className="mt-5 space-y-2">
                  {e.hotline_contact.map((t) => (
                    <li key={t}>
                      <a href={telHref(t)} className="font-display text-2xl font-extrabold tracking-tight text-white transition hover:text-accent sm:text-[1.7rem]">{t}</a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="glass p-6">
              <h2 className="flex items-center gap-2 text-base font-semibold"><Phone className="h-4 w-4 text-brand-cyan" /> Nous appeler :</h2>
              <ul className="mt-4 divide-y divide-line">
                {site.telephones.map((t) => (
                  <li key={t}>
                    <a href={telHref(t)} className="flex items-center justify-between py-2.5 text-sm font-medium text-soft hover:text-white">
                      {t} <Phone className="h-3.5 w-3.5 text-muted" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="glass-soft flex items-start gap-3 border-warn/25 bg-warn/[0.06] p-4">
              <Wrench className="mt-0.5 h-5 w-5 shrink-0 text-warn" />
              <p className="text-sm text-soft">
                En cas de panne, contactez le <a href={telHref(e.panne)} className="whitespace-nowrap font-semibold text-white hover:underline">{e.panne}</a>
              </p>
            </div>
          </div>

          <div className="glass p-6 sm:p-8">
            <h2 className="flex items-center gap-2 text-xl font-bold"><Mail className="h-5 w-5 text-brand-cyan" /> Contactez-nous par email</h2>
            <p className="mt-1 mb-6 text-sm text-muted">Remplissez le formulaire ci-dessous, nous vous répondrons rapidement.</p>
            <ContactForm />
          </div>
        </div>

        <div className="mt-16">
          <h2 className="text-2xl font-extrabold tracking-tight">Nos points de <span className="text-grad">rendez-vous</span></h2>
          <p className="mt-2 text-sm text-muted">Votre agent {site.nom} vous attend dans chacune de ces villes.</p>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {site.villes.map((v) => (
              <li key={v.id} className="glass-soft flex items-start gap-3 p-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-blue/10 text-brand-cyan">
                  {v.aeroport ? <PlaneLanding className="h-5 w-5" /> : <MapPin className="h-5 w-5" />}
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-white">{v.nom}</span>
                    {v.aeroport && <span className="text-[11px] font-medium uppercase tracking-wide text-brand-cyan">Aéroport</span>}
                  </div>
                  {v.point_rdv && <p className="mt-0.5 text-sm text-muted">{v.point_rdv}</p>}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}

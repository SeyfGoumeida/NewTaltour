'use client';

import { useState } from 'react';
import { Fuel, Gauge, Milestone } from 'lucide-react';
import { Button, Empty, Modal } from '@/components/ui';
import { euro } from '@/lib/format';
import ContactForm from './ContactForm';

export interface Occasion {
  id: number;
  titre: string;
  description: string | null;
  annee: number | null;
  kilometrage: number | null;
  prix: number | null;
  image: string | null;
  modele: string | null;
  carburant: string | null;
  boite: string | null;
}

const km = (n: number) => `${new Intl.NumberFormat('fr-FR').format(n)} km`;
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

function message(o: Occasion) {
  const details = [o.annee && `${o.annee}`, o.kilometrage != null && km(o.kilometrage), o.prix != null && euro(o.prix)].filter(Boolean).join(', ');
  return `Bonjour, je suis intéressé(e) par le véhicule d'occasion « ${o.titre} »${details ? ` (${details})` : ''}. Merci de me recontacter.`;
}

export default function OccasionsGrid({ items }: { items: Occasion[] }) {
  const [sel, setSel] = useState<Occasion | null>(null);
  if (items.length === 0)
    return <Empty icon={<Milestone className="h-6 w-6" />} title="Aucun véhicule en vente pour le moment">Revenez bientôt ou contactez-nous pour être informé des prochaines ventes.</Empty>;
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {items.map((o) => (
          <article key={o.id} className="glass flex flex-col overflow-hidden p-0">
            <div className="relative aspect-[16/10] overflow-hidden bg-white">
              {o.image && <img src={o.image} alt={o.titre} loading="lazy" className="h-full w-full object-cover" />}
              {o.annee && <span className="absolute left-3 top-3 rounded-md bg-ink-900/85 px-2 py-0.5 text-[11px] font-semibold text-white backdrop-blur">{o.annee}</span>}
            </div>
            <div className="flex flex-1 flex-col p-5">
              <h2 className="text-base font-bold leading-snug text-white">{o.titre}</h2>
              <ul className="mt-3 flex flex-wrap gap-1.5">
                {o.kilometrage != null && <li className="chip"><Milestone className="h-3.5 w-3.5 text-brand-cyan" /> {km(o.kilometrage)}</li>}
                {o.carburant && <li className="chip"><Fuel className="h-3.5 w-3.5 text-brand-cyan" /> {cap(o.carburant)}</li>}
                {o.boite && <li className="chip"><Gauge className="h-3.5 w-3.5 text-brand-cyan" /> {cap(o.boite)}</li>}
              </ul>
              {o.description && <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted">{o.description}</p>}
              <div className="mt-auto flex items-end justify-between gap-3 pt-5">
                <div>
                  <div className="text-[11px] uppercase tracking-wide text-muted">Prix</div>
                  <div className="font-display text-2xl font-extrabold text-white">{o.prix != null ? euro(o.prix) : 'Nous consulter'}</div>
                </div>
                <Button size="sm" onClick={() => setSel(o)}>Je suis intéressé</Button>
              </div>
            </div>
          </article>
        ))}
      </div>
      <Modal open={!!sel} onClose={() => setSel(null)} title={sel ? sel.titre : ''}>
        {sel && (
          <>
            <p className="mb-5 text-sm text-muted">Laissez-nous vos coordonnées, notre équipe vous recontacte au sujet de ce véhicule.</p>
            <ContactForm key={sel.id} idPrefix={`occ-${sel.id}`} defaultMessage={message(sel)} />
          </>
        )}
      </Modal>
    </>
  );
}

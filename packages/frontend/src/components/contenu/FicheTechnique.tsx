import clsx from 'clsx';
import { Check, Minus } from 'lucide-react';

type Fiche = Record<string, Record<string, string | boolean | null>>;

export const FICHE_ORDER: [string, string[]][] = [
  ['Véhicule', ['Catégorie', 'Nb places', 'Portes', 'Volume coffre', 'Réservoir', 'Dimensions véhicule', 'Empattement']],
  ['Moteur', ['Carburant', 'Nb cylindres', 'Cylindrée', 'Turbo', 'Puissance', 'Boîte de vitesses', 'Couple', 'Soupapes', 'Vitesse max.', 'Accl. 0 à 100', 'Consommation']],
  ['Confort', ['Direction assistée', 'Climatisation', 'Boîte à gants réfrigérante', 'Sellerie', 'Vitres éléctriques', 'Aide au stationnement', 'Radio cd', 'Écran', 'Accoudoir']],
  ['Look', ['Toit ouvrant', 'Vitres teintées', 'Projecteurs anti-brouillard', 'Feux de jour', 'Projecteur avant', 'Feux arrière', 'Détecteur de luminosité', 'Peinture métalisée', 'Poignées et pare chocs', 'Jantes Alliage', 'Dimensions pneumatiques']],
  ['Sécurité', ['Régulateur de vitesse', 'Keyless', 'Airbags', 'Freins avant', 'Freins arrière', 'ABS', 'Verrouillage centralisé', 'Détecteur angle mort', 'Aide au démarrage en côte']],
];

export function orderedFiche(fiche: Fiche): [string, [string, string | boolean | null][]][] {
  const known = new Set(FICHE_ORDER.map(([s]) => s));
  const groups = [...FICHE_ORDER.map(([s]) => s), ...Object.keys(fiche).filter((s) => !known.has(s))];
  return groups
    .filter((g) => fiche[g])
    .map((g) => {
      const order = FICHE_ORDER.find(([s]) => s === g)?.[1] ?? [];
      const values = fiche[g];
      const keys = [...order.filter((k) => k in values), ...Object.keys(values).filter((k) => !order.includes(k))];
      return [g, keys.map((k) => [k, values[k]] as [string, string | boolean | null])];
    });
}

function Value({ v }: { v: string | boolean | null }) {
  if (v === true) return <Check className="h-4 w-4 text-ok" aria-label="Oui" />;
  if (v === false || v === null || v === '') return <Minus className="h-4 w-4 text-white/20" aria-label="Non renseigné" />;
  return <span className="text-right font-medium text-white [overflow-wrap:anywhere]">{v}</span>;
}

export default function FicheTechnique({ fiche, className }: { fiche: Fiche; className?: string }) {
  const groups = orderedFiche(fiche);
  return (
    <div className={clsx('grid gap-4 sm:grid-cols-2 lg:grid-cols-3', className)}>
      {groups.map(([g, rows]) => (
        <div key={g} className="glass-soft p-4">
          <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-brand-cyan">{g}</h4>
          <dl className="divide-y divide-line">
            {rows.map(([k, v]) => (
              <div key={k} className="flex items-center justify-between gap-3 py-1.5 text-xs">
                <dt className="max-w-[55%] shrink-0 text-muted">{k}</dt>
                <dd className="flex min-w-0 justify-end">
                  <Value v={v} />
                </dd>
              </div>
            ))}
          </dl>
        </div>
      ))}
    </div>
  );
}

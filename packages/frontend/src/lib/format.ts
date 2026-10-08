const eur = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });

export const euro = (n: number | string | null | undefined) => eur.format(Number(n || 0));

const TZ = { timeZone: 'UTC' } as const;

export function toDate(d: string | Date): Date {
  if (d instanceof Date) return d;
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(d)) return new Date(`${d.length === 16 ? `${d}:00` : d}Z`);
  return new Date(d);
}

export const dateFr = (d: string | Date) => toDate(d).toLocaleDateString('fr-FR', { ...TZ, day: '2-digit', month: '2-digit', year: 'numeric' });
export const dateLong = (d: string | Date) => toDate(d).toLocaleDateString('fr-FR', { ...TZ, weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });
export const heureFr = (d: string | Date) => toDate(d).toLocaleTimeString('fr-FR', { ...TZ, hour: '2-digit', minute: '2-digit' });
export const dateHeure = (d: string | Date) => `${dateFr(d)} ${heureFr(d)}`;
export const dateTimeLocal = (d: string | Date) => toDate(d).toISOString().slice(0, 16);

export const STATUT_COMMANDE: Record<string, { label: string; tone: 'ok' | 'warn' | 'info' | 'muted' | 'danger' }> = {
  en_attente: { label: 'En attente', tone: 'warn' },
  confirmee: { label: 'Confirmée', tone: 'info' },
  en_cours: { label: 'En cours', tone: 'ok' },
  terminee: { label: 'Terminée', tone: 'muted' },
  annulee: { label: 'Annulée', tone: 'danger' },
};

export const STATUT_PAIEMENT: Record<string, { label: string; tone: 'ok' | 'warn' | 'info' | 'muted' | 'danger' }> = {
  non_paye: { label: 'Non payé', tone: 'warn' },
  acompte: { label: 'Acompte versé', tone: 'info' },
  paye: { label: 'Payé', tone: 'ok' },
  rembourse: { label: 'Remboursé', tone: 'muted' },
  avoir: { label: 'Converti en avoir', tone: 'muted' },
};

export const MODE_PAIEMENT: Record<string, string> = {
  cb: 'Carte bancaire',
  paypal: 'PayPal',
  cheque: 'Chèque',
  virement: 'Virement bancaire',
  deux_fois: 'Paiement en deux fois (PayPal + espèces)',
  especes: 'Espèces',
};

export const optionPrixLabel = (o: { type_prix: string; prix: number }) =>
  o.type_prix === 'fixe' ? euro(o.prix) : o.type_prix === 'par_jour' ? `${euro(o.prix)} / jour` : `${Number(o.prix)} % du tarif`;

export function defaultDates() {
  const d = new Date();
  const dep = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 7, 10));
  const ret = new Date(dep.getTime() + 7 * 86_400_000);
  return { date_depart: dateTimeLocal(dep), date_retour: dateTimeLocal(ret) };
}

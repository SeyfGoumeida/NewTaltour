export function splitTitle(t: string, words = 2): [string, string | undefined] {
  const parts = t.trim().split(/\s+/);
  if (parts.length <= words) return [t, undefined];
  return [parts.slice(0, -words).join(' '), parts.slice(-words).join(' ')];
}

export const telHref = (t: string) => `tel:${t.replace(/[^+\d]/g, '').replace(/^00/, '+')}`;

export const nombre = (n: number) => new Intl.NumberFormat('fr-FR').format(n);

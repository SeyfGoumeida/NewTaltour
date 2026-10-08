export function slugify(s: string) {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export interface Section {
  id: string;
  title: string;
  body: string;
}

export function splitSections(text: string): { intro: string; sections: Section[] } {
  const rows = text.replace(/\r/g, '').split('\n');
  const intro: string[] = [];
  const sections: Section[] = [];
  let current: { title: string; body: string[] } | null = null;
  const used = new Set<string>();
  const push = () => {
    if (!current) return;
    let id = slugify(current.title) || `section-${sections.length + 1}`;
    while (used.has(id)) id = `${id}-${sections.length + 1}`;
    used.add(id);
    sections.push({ id, title: current.title, body: current.body.join('\n').trim() });
  };
  for (const row of rows) {
    const t = row.trim();
    if (t.startsWith('## ')) {
      push();
      current = { title: t.slice(3).trim(), body: [] };
    } else if (current) current.body.push(row);
    else intro.push(row);
  }
  push();
  return { intro: intro.join('\n').trim(), sections };
}

export function excerpt(text: string, max = 220) {
  const flat = text.replace(/\r/g, '').replace(/^#+\s+/gm, '').replace(/^[-·•]\s+/gm, '').replace(/\s+/g, ' ').trim();
  if (flat.length <= max) return flat;
  const cut = flat.slice(0, max);
  return `${cut.slice(0, cut.lastIndexOf(' ') > 0 ? cut.lastIndexOf(' ') : max).replace(/[\s,.;:!]+$/, '')}…`;
}

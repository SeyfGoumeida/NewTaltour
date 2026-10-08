import { ChevronDown, ListTree } from 'lucide-react';
import type { Section } from './sections';

function Items({ sections }: { sections: Section[] }) {
  return (
    <ol className="space-y-0.5">
      {sections.map((s) => (
        <li key={s.id}>
          <a
            href={`#${s.id}`}
            className="block rounded-lg px-3 py-1.5 text-sm text-muted transition hover:bg-white/[0.04] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue/50"
          >
            {s.title}
          </a>
        </li>
      ))}
    </ol>
  );
}

export default function Toc({ sections, title = 'Sommaire' }: { sections: Section[]; title?: string }) {
  return (
    <>
      <details className="glass group p-0 lg:hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 text-sm font-semibold text-white [&::-webkit-details-marker]:hidden">
          <span className="inline-flex items-center gap-2"><ListTree className="h-4 w-4 text-brand-cyan" /> {title}</span>
          <ChevronDown className="h-4 w-4 text-muted transition group-open:rotate-180" />
        </summary>
        <nav className="border-t border-line px-2 py-3" aria-label={title}>
          <Items sections={sections} />
        </nav>
      </details>
      <nav className="glass hidden max-h-[calc(100vh-9rem)] overflow-y-auto p-3 lg:block" aria-label={title}>
        <div className="mb-2 flex items-center gap-2 px-3 pt-1 text-xs font-bold uppercase tracking-wider text-soft">
          <ListTree className="h-4 w-4 text-brand-cyan" /> {title}
        </div>
        <Items sections={sections} />
      </nav>
    </>
  );
}

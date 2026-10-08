import { Fragment } from 'react';

function inline(text: string, key: string) {
  const parts = text.split(/(https?:\/\/[^\s)]+)/g);
  return parts.map((p, i) =>
    /^https?:\/\//.test(p) ? (
      <a key={`${key}-${i}`} href={p} target="_blank" rel="noopener noreferrer">
        {p}
      </a>
    ) : (
      <Fragment key={`${key}-${i}`}>{p}</Fragment>
    ),
  );
}

function lines(text: string, key: string) {
  return text.split('\n').map((l, i, all) => (
    <Fragment key={`${key}-l${i}`}>
      {inline(l, `${key}-l${i}`)}
      {i < all.length - 1 && <br />}
    </Fragment>
  ));
}

export default function Markdown({ text, className = 'prose-taltour' }: { text: string; className?: string }) {
  const blocks = text.replace(/\r/g, '').split(/\n{2,}/);
  const out: React.ReactNode[] = [];
  blocks.forEach((block, b) => {
    const rows = block.split('\n');
    let para: string[] = [];
    let list: string[] = [];
    const flush = () => {
      if (para.length) out.push(<p key={`p${b}-${out.length}`}>{lines(para.join('\n'), `p${b}-${out.length}`)}</p>);
      if (list.length) out.push(<ul key={`u${b}-${out.length}`}>{list.map((li, i) => <li key={i}>{inline(li, `li${b}-${i}`)}</li>)}</ul>);
      para = [];
      list = [];
    };
    for (const row of rows) {
      const t = row.trim();
      if (t.startsWith('### ')) { flush(); out.push(<h3 key={`h3${b}-${out.length}`}>{t.slice(4)}</h3>); }
      else if (t.startsWith('## ')) { flush(); out.push(<h2 key={`h2${b}-${out.length}`}>{t.slice(3)}</h2>); }
      else if (/^[-·•]\s+/.test(t)) { if (para.length) { const p = para; para = []; out.push(<p key={`p${b}-${out.length}`}>{lines(p.join('\n'), `pp${b}`)}</p>); } list.push(t.replace(/^[-·•]\s+/, '')); }
      else if (t) { if (list.length) flush(); para.push(t); }
    }
    flush();
  });
  return <div className={className}>{out}</div>;
}

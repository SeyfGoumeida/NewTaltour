'use client';

import { Area, Bar, BarChart, CartesianGrid, Cell, ComposedChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { euro } from '@/lib/format';

export const GRID = 'rgba(148,170,220,0.12)';
export const AXIS = '#8C9AB8';
export const PALETTE = ['#FF6B1A', '#2F6BFF', '#22D3EE', '#FFD60A', '#22C55E', '#A78BFA', '#F43F5E', '#8C9AB8'];

const tick = { fill: AXIS, fontSize: 11 };
const MOIS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
export const moisLabel = (m: string) => {
  const [y, mm] = m.split('-');
  return `${MOIS[Number(mm) - 1]} ${y.slice(2)}`;
};

function Tip({ active, payload, label, fmt }: { active?: boolean; payload?: any[]; label?: any; fmt?: (v: number, name: string) => string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-line bg-ink-850/95 px-3 py-2 text-xs shadow-bar backdrop-blur">
      {label !== undefined && <div className="mb-1 font-semibold text-white">{label}</div>}
      {payload.map((p) => (
        <div key={p.dataKey ?? p.name} className="flex items-center gap-2 text-soft">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color || p.payload?.fill }} />
          <span>{p.name}</span>
          <span className="ml-auto pl-3 font-semibold text-white">{fmt ? fmt(Number(p.value), p.name) : p.value}</span>
        </div>
      ))}
    </div>
  );
}

export function CaChart({ data }: { data: { mois: string; ca: number; n: number }[] }) {
  const rows = data.map((d) => ({ ...d, label: moisLabel(d.mois) }));
  return (
    <ResponsiveContainer width="100%" height={280}>
      <ComposedChart data={rows} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="caFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FF6B1A" stopOpacity={0.45} />
            <stop offset="100%" stopColor="#FF6B1A" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={GRID} vertical={false} />
        <XAxis dataKey="label" tick={tick} axisLine={false} tickLine={false} />
        <YAxis yAxisId="ca" tick={tick} axisLine={false} tickLine={false} width={52} tickFormatter={(v) => `${Math.round(v / 1000)}k €`} />
        <YAxis yAxisId="n" orientation="right" tick={tick} axisLine={false} tickLine={false} width={32} allowDecimals={false} />
        <Tooltip cursor={{ fill: 'rgba(255,255,255,0.03)' }} content={<Tip fmt={(v, n) => (n === "Chiffre d'affaires" ? euro(v) : String(v))} />} />
        <Bar yAxisId="n" dataKey="n" name="Réservations" fill="#2F6BFF" fillOpacity={0.35} radius={[6, 6, 0, 0]} maxBarSize={26} />
        <Area yAxisId="ca" type="monotone" dataKey="ca" name="Chiffre d'affaires" stroke="#FF6B1A" strokeWidth={2.5} fill="url(#caFill)" />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

export function HBars({ data, dataKey = 'n', name = 'Réservations', color = '#2F6BFF', height, fmt }: { data: { nom: string; [k: string]: any }[]; dataKey?: string; name?: string; color?: string; height?: number; fmt?: (v: number) => string }) {
  const h = height ?? Math.max(160, data.length * 30 + 20);
  return (
    <ResponsiveContainer width="100%" height={h}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }} barCategoryGap={6}>
        <CartesianGrid stroke={GRID} horizontal={false} />
        <XAxis type="number" tick={tick} axisLine={false} tickLine={false} allowDecimals={false} />
        <YAxis type="category" dataKey="nom" axisLine={false} tickLine={false} width={124} interval={0}
          tick={({ x, y, payload }: any) => {
            const v = String(payload.value);
            return (
              <text x={x - 6} y={y} dy={4} textAnchor="end" fill={AXIS} fontSize={11}>
                <title>{v}</title>
                {v.length > 19 ? v.slice(0, 18) + '…' : v}
              </text>
            );
          }} />
        <Tooltip cursor={{ fill: 'rgba(255,255,255,0.03)' }} content={<Tip fmt={fmt} />} />
        <Bar dataKey={dataKey} name={name} fill={color} radius={[0, 6, 6, 0]} maxBarSize={18} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function Donut({ data }: { data: { name: string; value: number }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row xl:flex-col">
      <div className="relative h-[180px] w-[180px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={58} outerRadius={84} paddingAngle={2} stroke="none">
              {data.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
            </Pie>
            <Tooltip content={<Tip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-xl font-bold text-white">{total}</span>
          <span className="text-[10px] uppercase tracking-wider text-muted">réservations</span>
        </div>
      </div>
      <ul className="w-full space-y-2 text-sm">
        {data.map((d, i) => (
          <li key={d.name} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: PALETTE[i % PALETTE.length] }} />
            <span className="min-w-0 flex-1 truncate text-soft">{d.name}</span>
            <span className="font-semibold text-white">{d.value}</span>
            <span className="w-12 text-right text-xs text-muted">{total ? Math.round((d.value / total) * 100) : 0} %</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

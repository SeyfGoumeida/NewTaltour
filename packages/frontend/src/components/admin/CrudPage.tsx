'use client';

import clsx from 'clsx';
import { useMemo, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import Markdown from '@/components/Markdown';
import { Alert, Button, Field, Input, Modal, Select, Switch, Textarea } from '@/components/ui';
import { ConfirmModal, EmptyRow, errMsg, LoadingRow, PageHead, qs, rowCls, SearchBox, TableBox, TagInput, Td, Th, useAdmin, useToast } from './kit';

type Row = Record<string, any> & { id: number };

export type FieldDef = {
  key: string;
  label: string;
  type?: 'text' | 'textarea' | 'markdown' | 'number' | 'date' | 'select' | 'switch' | 'tags' | 'email';
  options?: { value: string; label: string }[];
  required?: boolean;
  step?: string;
  min?: number;
  hint?: React.ReactNode;
  placeholder?: string;
  full?: boolean;
  nullable?: boolean;
  show?: (form: Record<string, any>) => boolean;
};

export type ColDef<T> = { key: string; label: string; render?: (row: T) => React.ReactNode; right?: boolean; className?: string };

export interface CrudProps<T extends Row> {
  title: string;
  sub?: React.ReactNode;
  endpoint: string;
  itemLabel: string;
  columns: ColDef<T>[];
  fields: FieldDef[];
  defaults: Record<string, any>;
  serverSearch?: boolean;
  clientSearch?: (row: T, term: string) => boolean;
  searchPlaceholder?: string;
  toggle?: { key: string; label: string };
  filter?: { label: string; options: { value: string; label: string }[]; test: (row: T, v: string) => boolean };
  toForm?: (row: T) => Record<string, any>;
  toPayload?: (form: Record<string, any>) => Record<string, any>;
  rowTitle?: (row: T) => string;
  wide?: boolean;
  headerExtra?: React.ReactNode;
  emptyText?: string;
}

function defaultPayload(fields: FieldDef[], form: Record<string, any>) {
  const out: Record<string, any> = {};
  for (const f of fields) {
    let v = form[f.key];
    if (f.type === 'number') v = v === '' || v === null || v === undefined ? (f.nullable ? null : '') : Number(v);
    else if (f.type === 'switch') v = !!v;
    else if (f.type === 'tags') v = v || [];
    else if (f.type === 'select' && f.nullable && v === '') v = null;
    else if (typeof v === 'string' && f.nullable) v = v.trim() || null;
    out[f.key] = v;
  }
  return out;
}

export function FormField({ f, value, onChange }: { f: FieldDef; value: any; onChange: (v: any) => void }) {
  const [preview, setPreview] = useState(false);
  if (f.type === 'switch') return <div className={clsx('flex items-end pb-2', f.full && 'sm:col-span-2')}><Switch checked={!!value} onChange={onChange} label={f.label} /></div>;
  const common = { value: value ?? '', placeholder: f.placeholder, required: f.required };
  let ctrl: React.ReactNode;
  if (f.type === 'textarea') ctrl = <Textarea {...common} onChange={(e) => onChange(e.target.value)} />;
  else if (f.type === 'markdown') {
    ctrl = (
      <div>
        <div className="mb-2 flex gap-1.5">
          {['Édition', 'Aperçu'].map((l, i) => (
            <button key={l} type="button" onClick={() => setPreview(i === 1)} className={clsx('rounded-lg px-2.5 py-1 text-xs font-medium', preview === (i === 1) ? 'bg-brand-blue text-white' : 'text-muted hover:text-white')}>{l}</button>
          ))}
        </div>
        {preview ? <div className="glass-soft max-h-[50vh] min-h-[200px] overflow-y-auto p-4"><Markdown text={String(value || '')} /></div>
          : <Textarea {...common} className="min-h-[240px] font-mono text-[13px]" onChange={(e) => onChange(e.target.value)} />}
      </div>
    );
  } else if (f.type === 'select') {
    ctrl = (
      <Select {...common} onChange={(e) => onChange(e.target.value)}>
        {(f.nullable || !f.required) && !f.options?.some((o) => o.value === '') && <option value="">—</option>}
        {f.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </Select>
    );
  } else if (f.type === 'tags') ctrl = <TagInput value={value || []} onChange={onChange} />;
  else ctrl = <Input {...common} type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : f.type === 'email' ? 'email' : 'text'} step={f.step} min={f.min} onChange={(e) => onChange(e.target.value)} />;
  if (f.type === 'tags' || f.type === 'markdown')
    return (
      <div className="sm:col-span-2">
        <span className="label">{f.label} {f.required && <span className="text-accent">*</span>}</span>
        {ctrl}
        {f.hint && <span className="mt-1 block text-xs text-muted">{f.hint}</span>}
      </div>
    );
  return (
    <Field label={f.label} required={f.required} hint={f.hint} className={clsx((f.full || f.type === 'textarea') && 'sm:col-span-2')}>
      {ctrl}
    </Field>
  );
}

export default function CrudPage<T extends Row>(p: CrudProps<T>) {
  const toast = useToast();
  const [term, setTerm] = useState('');
  const [fv, setFv] = useState('');
  const key = p.serverSearch ? qs(p.endpoint, { q: term }) : p.endpoint;
  const { data, error, isLoading, mutate } = useAdmin<T[]>(key);
  const [edit, setEdit] = useState<{ row: T | null; form: Record<string, any> } | null>(null);
  const [del, setDel] = useState<T | null>(null);
  const [saving, setSaving] = useState(false);
  const [formErr, setFormErr] = useState<string | null>(null);

  const rows = useMemo(() => {
    let r = data || [];
    if (p.clientSearch && term) r = r.filter((x) => p.clientSearch!(x, term.toLowerCase()));
    if (p.filter && fv) r = r.filter((x) => p.filter!.test(x, fv));
    return r;
  }, [data, term, fv, p.clientSearch, p.filter]);

  const payload = (form: Record<string, any>) => (p.toPayload ? p.toPayload(form) : defaultPayload(p.fields, form));
  const formOf = (row: T) => {
    if (p.toForm) return p.toForm(row);
    const f: Record<string, any> = {};
    for (const d of p.fields) f[d.key] = row[d.key] ?? (d.type === 'tags' ? [] : d.type === 'switch' ? false : '');
    return f;
  };

  const open = (row: T | null) => {
    setFormErr(null);
    setEdit({ row, form: row ? formOf(row) : { ...p.defaults } });
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!edit) return;
    setSaving(true);
    setFormErr(null);
    try {
      const body = payload(edit.form);
      if (edit.row) await api(`${p.endpoint}/${edit.row.id}`, { method: 'PUT', body });
      else await api(p.endpoint, { method: 'POST', body });
      await mutate();
      toast(edit.row ? `${p.itemLabel} mis(e) à jour` : `${p.itemLabel} créé(e)`);
      setEdit(null);
    } catch (e) {
      setFormErr(errMsg(e));
    } finally {
      setSaving(false);
    }
  };

  const quickToggle = async (row: T) => {
    if (!p.toggle) return;
    const k = p.toggle.key;
    const next = !row[k];
    mutate((d) => d?.map((x) => (x.id === row.id ? { ...x, [k]: next } : x)), { revalidate: false });
    try {
      await api(`${p.endpoint}/${row.id}`, { method: 'PUT', body: payload({ ...formOf(row), [k]: next }) });
      toast(`${p.toggle.label} : ${next ? 'oui' : 'non'}`);
    } catch (e) {
      toast(errMsg(e), 'danger');
    }
    mutate();
  };

  const cols = p.columns.length + (p.toggle ? 1 : 0) + 1;
  const title = (row: T) => (p.rowTitle ? p.rowTitle(row) : String(row.nom || row.titre || row.code || row.libelle || row.question || `#${row.id}`));

  return (
    <div>
      <PageHead title={p.title} sub={p.sub} actions={<>{p.headerExtra}<Button onClick={() => open(null)}><Plus className="h-4 w-4" /> Ajouter</Button></>} />
      {(p.serverSearch || p.clientSearch || p.filter) && (
        <div className="mb-4 flex flex-wrap items-center gap-3">
          {(p.serverSearch || p.clientSearch) && <SearchBox value={term} onChange={setTerm} placeholder={p.searchPlaceholder} className="w-full sm:w-80" />}
          {p.filter && (
            <Select value={fv} onChange={(e) => setFv(e.target.value)} className="w-full sm:w-56">
              <option value="">{p.filter.label} : tous</option>
              {p.filter.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </Select>
          )}
          <span className="text-xs text-muted">{rows.length} élément{rows.length > 1 ? 's' : ''}</span>
        </div>
      )}
      {error && <Alert tone="danger" className="mb-4">{errMsg(error)}</Alert>}
      <TableBox>
        <thead>
          <tr>
            {p.columns.map((c) => <Th key={c.key} right={c.right}>{c.label}</Th>)}
            {p.toggle && <Th>{p.toggle.label}</Th>}
            <Th right>Actions</Th>
          </tr>
        </thead>
        <tbody>
          {isLoading && !data ? <LoadingRow cols={cols} /> : !rows.length ? <EmptyRow cols={cols}>{p.emptyText || 'Aucun élément'}</EmptyRow> : rows.map((row) => (
            <tr key={row.id} className={clsx(rowCls, 'cursor-pointer')} onClick={() => open(row)}>
              {p.columns.map((c) => <Td key={c.key} right={c.right}>{c.className ? <div className={c.className}>{c.render ? c.render(row) : (row[c.key] ?? '—')}</div> : c.render ? c.render(row) : (row[c.key] ?? '—')}</Td>)}
              {p.toggle && <Td onClick={(e) => e.stopPropagation()}><Switch checked={!!row[p.toggle.key]} onChange={() => quickToggle(row)} /></Td>}
              <Td right onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-end gap-1">
                  <button onClick={() => open(row)} className="rounded-lg p-2 text-muted hover:bg-white/[0.06] hover:text-white" title="Modifier" aria-label="Modifier"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => setDel(row)} className="rounded-lg p-2 text-muted hover:bg-danger/10 hover:text-danger" title="Supprimer" aria-label="Supprimer"><Trash2 className="h-4 w-4" /></button>
                </div>
              </Td>
            </tr>
          ))}
        </tbody>
      </TableBox>

      <Modal open={!!edit} onClose={() => setEdit(null)} wide={p.wide} title={edit?.row ? `Modifier : ${title(edit.row)}` : `Ajouter : ${p.itemLabel.toLowerCase()}`}
        footer={<><Button variant="ghost" onClick={() => setEdit(null)}>Annuler</Button><Button type="submit" form="crud-form" loading={saving}>Enregistrer</Button></>}>
        {edit && (
          <form id="crud-form" onSubmit={save} className="grid gap-4 sm:grid-cols-2">
            {formErr && <Alert tone="danger" className="sm:col-span-2">{formErr}</Alert>}
            {p.fields.filter((f) => !f.show || f.show(edit.form)).map((f) => (
              <FormField key={f.key} f={f} value={edit.form[f.key]} onChange={(v) => setEdit((s) => (s ? { ...s, form: { ...s.form, [f.key]: v } } : s))} />
            ))}
          </form>
        )}
      </Modal>

      <ConfirmModal open={!!del} onClose={() => setDel(null)} title={`Supprimer ${p.itemLabel.toLowerCase()}`}
        onConfirm={async () => {
          if (!del) return;
          await api(`${p.endpoint}/${del.id}`, { method: 'DELETE' });
          await mutate();
          toast(`${p.itemLabel} supprimé(e)`);
        }}>
        Supprimer définitivement <strong className="text-white">{del ? title(del) : ''}</strong> ? Cette action est irréversible.
      </ConfirmModal>
    </div>
  );
}

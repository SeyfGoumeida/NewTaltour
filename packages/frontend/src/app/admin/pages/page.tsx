'use client';

import clsx from 'clsx';
import { useEffect, useState } from 'react';
import { ExternalLink, FileText } from 'lucide-react';
import { api } from '@/lib/api';
import Markdown from '@/components/Markdown';
import { errMsg, PageHead, useAdmin, useToast } from '@/components/admin/kit';
import { Alert, Button, Field, Input, Loading, Textarea } from '@/components/ui';
import { dateHeure } from '@/lib/format';

type P = { slug: string; titre: string; contenu: string; updated_at: string };

export default function PagesPage() {
  const toast = useToast();
  const { data, error, isLoading, mutate } = useAdmin<P[]>('/admin/pages');
  const [slug, setSlug] = useState<string | null>(null);
  const [form, setForm] = useState<{ titre: string; contenu: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const current = data?.find((p) => p.slug === slug) || null;

  useEffect(() => {
    if (data?.length && !slug) setSlug(data[0].slug);
  }, [data, slug]);
  useEffect(() => {
    if (current) setForm({ titre: current.titre, contenu: current.contenu });
  }, [current?.slug]); // eslint-disable-line react-hooks/exhaustive-deps

  const dirty = !!current && !!form && (form.titre !== current.titre || form.contenu !== current.contenu);

  const choose = (s: string) => {
    if (dirty && !window.confirm('Des modifications non enregistrées seront perdues. Continuer ?')) return;
    setSlug(s);
  };

  const save = async () => {
    if (!form || !current) return;
    setSaving(true);
    try {
      await api(`/admin/pages/${current.slug}`, { method: 'PUT', body: form });
      await mutate();
      toast('Page enregistrée');
    } catch (e) {
      toast(errMsg(e), 'danger');
    } finally {
      setSaving(false);
    }
  };

  if (error) return <Alert tone="danger">{errMsg(error)}</Alert>;
  if (isLoading || !data) return <Loading />;

  return (
    <div>
      <PageHead title="Pages" sub="Contenus éditoriaux du site (conditions, mentions, présentation…)."
        actions={current && <>
          <a href={`/${current.slug}`} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-line px-3.5 text-sm font-semibold text-soft hover:border-white/25 hover:text-white"><ExternalLink className="h-4 w-4" /> Voir</a>
          <Button size="sm" onClick={save} loading={saving} disabled={!dirty}>Enregistrer</Button>
        </>} />
      <div className="space-y-4">
        <nav className="flex flex-wrap gap-2">
          {data.map((p) => (
            <button key={p.slug} onClick={() => choose(p.slug)}
              className={clsx('flex items-start gap-2.5 rounded-xl border px-3 py-2 text-left text-sm transition', p.slug === slug ? 'border-brand-blue/50 bg-brand-blue/15 text-white' : 'border-line bg-white/[0.03] text-soft hover:text-white')}>
              <FileText className={clsx('mt-0.5 h-4 w-4 shrink-0', p.slug === slug ? 'text-brand-cyan' : 'text-muted')} />
              <span className="min-w-0"><span className="block truncate font-medium">{p.titre}</span><span className="block truncate text-[11px] text-muted">/{p.slug}</span></span>
            </button>
          ))}
        </nav>
        {current && form && (
          <div className="min-w-0 space-y-4">
            <div className="glass p-5">
              <Field label="Titre" required><Input value={form.titre} onChange={(e) => setForm({ ...form, titre: e.target.value })} /></Field>
              <div className="mt-2 text-xs text-muted">Dernière modification : {dateHeure(current.updated_at)}{dirty && <span className="ml-2 text-warn">· modifications non enregistrées</span>}</div>
            </div>
            <div className="grid gap-4 xl:grid-cols-2">
              <div className="glass p-5">
                <div className="mb-2 flex items-center justify-between">
                  <span className="label mb-0">Contenu</span>
                  <span className="text-[11px] text-muted">« ## » titre · « - » liste · ligne vide = paragraphe</span>
                </div>
                <Textarea className="min-h-[60vh] font-mono text-[13px] leading-relaxed" value={form.contenu} onChange={(e) => setForm({ ...form, contenu: e.target.value })} />
              </div>
              <div className="glass p-5">
                <div className="label">Aperçu</div>
                <div className="max-h-[64vh] overflow-y-auto pr-2">
                  <h1 className="mb-6 text-2xl font-extrabold">{form.titre}</h1>
                  <Markdown text={form.contenu} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

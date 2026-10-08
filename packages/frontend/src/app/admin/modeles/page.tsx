'use client';

import clsx from 'clsx';
import { useMemo, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { ConfirmModal, EmptyRow, errMsg, LoadingRow, PageHead, rowCls, SearchBox, TableBox, TagInput, Td, Th, Thumb, useAdmin, useToast } from '@/components/admin/kit';
import { Alert, Badge, Button, Field, Input, Modal, Select, Switch, Tabs } from '@/components/ui';
import { euro } from '@/lib/format';

type M = Record<string, any> & { id: number; tarifs: { jours: number; prix: number }[]; nb_vehicules: number };

const NUMS = ['places', 'portes', 'coffre_l', 'reservoir_l', 'puissance_ch', 'airbags', 'vitesse_max'] as const;
const NUM_LABEL: Record<string, string> = { places: 'Places', portes: 'Portes', coffre_l: 'Coffre (L)', reservoir_l: 'Réservoir (L)', puissance_ch: 'Puissance (ch)', airbags: 'Airbags', vitesse_max: 'Vitesse max (km/h)' };
const EMPTY = {
  site: 'dz', slug: '', nom: '', nom_affiche: '', marque: '', categorie: '', categorie_libelle: '', places: '', portes: '', coffre_l: '', reservoir_l: '',
  carburant: 'essence', boite: 'manuelle', type_boite: '', puissance_ch: '', airbags: '', vitesse_max: '', consommation: '', caution: '', equipements: [] as string[],
  image: '', a_vendre: false, actif: true, ordre: 0, tarifs: {} as Record<number, string>,
};
type Form = typeof EMPTY;

const slugify = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const SITE_LABEL: Record<string, string> = { dz: 'Taltour Algérie', ma: 'Ouziad Marrakech Cars' };

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-4">
      <legend className="mb-3 text-xs font-semibold uppercase tracking-wider text-brand-cyan">{title}</legend>
      {children}
    </fieldset>
  );
}

export default function ModelesPage() {
  const toast = useToast();
  const { data, error, isLoading, mutate } = useAdmin<M[]>('/admin/modeles');
  const { data: params } = useAdmin<any>('/admin/parametres');
  const forfaits: number[] = params?.tarification?.forfaits || [1, 7, 14, 30, 90, 180];
  const [site, setSite] = useState<'all' | 'dz' | 'ma'>('dz');
  const [term, setTerm] = useState('');
  const [edit, setEdit] = useState<{ row: M | null; form: Form } | null>(null);
  const [del, setDel] = useState<M | null>(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const rows = useMemo(() => {
    const t = term.toLowerCase();
    return (data || []).filter((m) => (site === 'all' || m.site === site) && (!t || `${m.nom_affiche} ${m.marque} ${m.slug}`.toLowerCase().includes(t)));
  }, [data, site, term]);
  const counts = useMemo(() => ({ dz: (data || []).filter((m) => m.site === 'dz').length, ma: (data || []).filter((m) => m.site === 'ma').length }), [data]);

  const open = (row: M | null) => {
    setErr(null);
    if (!row) return setEdit({ row: null, form: { ...EMPTY, site: site === 'ma' ? 'ma' : 'dz', tarifs: {} } });
    const f: any = { ...EMPTY };
    for (const k of Object.keys(EMPTY)) if (k !== 'tarifs') f[k] = row[k] ?? (EMPTY as any)[k];
    f.categorie = row.categorie || '';
    f.tarifs = Object.fromEntries(row.tarifs.map((t) => [t.jours, String(t.prix)]));
    setEdit({ row, form: f });
  };

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setEdit((s) => (s ? { ...s, form: { ...s.form, [k]: v } } : s));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!edit) return;
    const f = edit.form;
    const body: Record<string, any> = {
      ...f,
      slug: f.slug.trim() || slugify(f.nom_affiche || f.nom),
      categorie: f.categorie || null,
      categorie_libelle: f.categorie_libelle || null,
      type_boite: f.type_boite || null,
      consommation: f.consommation || null,
      image: f.image || null,
      caution: Number(f.caution || 0),
      ordre: Number(f.ordre || 0),
      tarifs: Object.entries(f.tarifs).filter(([, p]) => p !== '' && p != null).map(([j, p]) => ({ jours: Number(j), prix: Number(p) })),
    };
    for (const k of NUMS) body[k] = f[k] === '' || f[k] == null ? null : Number(f[k]);
    setSaving(true);
    setErr(null);
    try {
      if (edit.row) await api(`/admin/modeles/${edit.row.id}`, { method: 'PUT', body });
      else await api('/admin/modeles', { method: 'POST', body });
      await mutate();
      toast(edit.row ? 'Modèle mis à jour' : 'Modèle créé');
      setEdit(null);
    } catch (e) {
      setErr(errMsg(e));
    } finally {
      setSaving(false);
    }
  };

  const toggleActif = async (m: M) => {
    try {
      mutate((d) => d?.map((x) => (x.id === m.id ? { ...x, actif: !m.actif } : x)), { revalidate: false });
      await api(`/admin/modeles/${m.id}`, { method: 'PUT', body: { ...m, actif: !m.actif } });
      toast(m.actif ? 'Modèle désactivé' : 'Modèle activé');
    } catch (e) {
      toast(errMsg(e), 'danger');
    }
    mutate();
  };

  const f = edit?.form;
  const prix = (m: M, j: number) => m.tarifs.find((t) => t.jours === j)?.prix;

  return (
    <div>
      <PageHead title="Modèles & tarifs" sub="Catalogue des modèles proposés à la location et grille tarifaire par forfait."
        actions={<Button onClick={() => open(null)}><Plus className="h-4 w-4" /> Nouveau modèle</Button>} />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Tabs value={site} onChange={setSite} items={[
          { value: 'dz', label: <>Taltour Algérie <span className="ml-1 text-xs opacity-70">{counts.dz}</span></> },
          { value: 'ma', label: <>Ouziad Marrakech <span className="ml-1 text-xs opacity-70">{counts.ma}</span></> },
          { value: 'all', label: 'Tous' },
        ]} />
        <SearchBox value={term} onChange={setTerm} placeholder="Rechercher un modèle…" className="w-full sm:w-72" delay={150} />
      </div>

      {error && <Alert tone="danger" className="mb-4">{errMsg(error)}</Alert>}

      <TableBox>
        <thead>
          <tr>
            <Th>Modèle</Th><Th>Cat.</Th><Th>Motorisation</Th>
            {forfaits.slice(0, 3).map((j) => <Th key={j} right>{j} j</Th>)}
            <Th right>Caution</Th><Th>Actif</Th><Th right>Actions</Th>
          </tr>
        </thead>
        <tbody>
          {isLoading && !data ? <LoadingRow cols={9} /> : !rows.length ? <EmptyRow cols={9}>Aucun modèle</EmptyRow> : rows.map((m) => (
            <tr key={m.id} className={clsx(rowCls, 'cursor-pointer', !m.actif && 'opacity-60')} onClick={() => open(m)}>
              <Td>
                <div className="flex items-center gap-3"><Thumb src={m.image} className="h-10 w-16" />
                  <div className="min-w-0"><div className="max-w-[220px] truncate font-medium text-white" title={m.nom_affiche}>{m.nom_affiche}</div><div className="text-xs text-muted">{m.marque} · {m.nb_vehicules} véhicule{m.nb_vehicules > 1 ? 's' : ''}{site === 'all' && ` · ${m.site === 'ma' ? 'Marrakech' : 'Algérie'}`}{m.a_vendre && ' · à vendre'}</div></div>
                </div>
              </Td>
              <Td>{m.categorie ? <Badge tone="info">{m.categorie}</Badge> : '—'}</Td>
              <Td className="text-xs capitalize text-soft">{m.carburant} · {m.boite}{m.puissance_ch ? ` · ${m.puissance_ch} ch` : ''}</Td>
              {forfaits.slice(0, 3).map((j) => <Td key={j} right className="tabular-nums text-white">{prix(m, j) != null ? euro(prix(m, j)) : <span className="text-muted">—</span>}</Td>)}
              <Td right className="tabular-nums">{euro(m.caution)}</Td>
              <Td onClick={(e) => e.stopPropagation()}><Switch checked={m.actif} onChange={() => toggleActif(m)} /></Td>
              <Td right onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-end gap-1">
                  <button onClick={() => open(m)} className="rounded-lg p-2 text-muted hover:bg-white/[0.06] hover:text-white" title="Modifier" aria-label="Modifier"><Pencil className="h-4 w-4" /></button>
                  <button onClick={() => setDel(m)} className="rounded-lg p-2 text-muted hover:bg-danger/10 hover:text-danger" title="Supprimer" aria-label="Supprimer"><Trash2 className="h-4 w-4" /></button>
                </div>
              </Td>
            </tr>
          ))}
        </tbody>
      </TableBox>
      <p className="mt-3 text-xs text-muted">Prix par jour selon le forfait (basse saison). En haute saison, le coefficient de la saison s&apos;applique.</p>

      <Modal open={!!edit} onClose={() => setEdit(null)} wide title={edit?.row ? `Modifier : ${edit.row.nom_affiche}` : 'Nouveau modèle'}
        footer={<><Button variant="ghost" onClick={() => setEdit(null)}>Annuler</Button><Button type="submit" form="modele-form" loading={saving}>Enregistrer</Button></>}>
        {f && (
          <form id="modele-form" onSubmit={save} className="space-y-8">
            {err && <Alert tone="danger">{err}</Alert>}
            <Section title="Identité">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Nom affiché" required className="sm:col-span-2"><Input required value={f.nom_affiche} onChange={(e) => set('nom_affiche', e.target.value)} /></Field>
                <Field label="Nom complet (fiche)" required><Input required value={f.nom} onChange={(e) => set('nom', e.target.value)} /></Field>
                <Field label="Marque" required><Input required value={f.marque} onChange={(e) => set('marque', e.target.value)} /></Field>
                <Field label="Slug (URL)" hint="Laisser vide pour le générer"><Input value={f.slug} onChange={(e) => set('slug', e.target.value)} /></Field>
                <Field label="Site" required>
                  <Select value={f.site} onChange={(e) => set('site', e.target.value)}><option value="dz">{SITE_LABEL.dz}</option><option value="ma">{SITE_LABEL.ma}</option></Select>
                </Field>
                <Field label="Catégorie">
                  <Select value={f.categorie} onChange={(e) => set('categorie', e.target.value)}><option value="">—</option>{['A', 'B', 'C', 'D'].map((c) => <option key={c} value={c}>{c}</option>)}</Select>
                </Field>
                <Field label="Libellé de catégorie"><Input value={f.categorie_libelle || ''} onChange={(e) => set('categorie_libelle', e.target.value)} /></Field>
              </div>
            </Section>

            <Section title="Caractéristiques">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <Field label="Carburant" required>
                  <Select value={f.carburant} onChange={(e) => set('carburant', e.target.value)}><option value="essence">Essence</option><option value="diesel">Diesel</option></Select>
                </Field>
                <Field label="Boîte" required>
                  <Select value={f.boite} onChange={(e) => set('boite', e.target.value)}><option value="manuelle">Manuelle</option><option value="automatique">Automatique</option></Select>
                </Field>
                <Field label="Type de boîte"><Input value={f.type_boite || ''} onChange={(e) => set('type_boite', e.target.value)} /></Field>
                <Field label="Consommation"><Input value={f.consommation || ''} placeholder="5.7L/100km" onChange={(e) => set('consommation', e.target.value)} /></Field>
                {NUMS.map((k) => (
                  <Field key={k} label={NUM_LABEL[k]}><Input type="number" min={0} value={f[k] ?? ''} onChange={(e) => set(k, e.target.value)} /></Field>
                ))}
              </div>
            </Section>

            <Section title="Tarifs (prix par jour, basse saison)">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {forfaits.map((j) => (
                  <Field key={j} label={`Basse saison ${j} j`}>
                    <div className="relative">
                      <Input type="number" step="0.01" min={0} value={f.tarifs[j] ?? ''} className="pr-14" onChange={(e) => set('tarifs', { ...f.tarifs, [j]: e.target.value })} />
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted">€ / j</span>
                    </div>
                  </Field>
                ))}
                <Field label="Caution (€)" required><Input type="number" step="0.01" min={0} required value={f.caution} onChange={(e) => set('caution', e.target.value)} /></Field>
              </div>
            </Section>

            <Section title="Présentation">
              <div>
                <span className="label">Équipements</span>
                <TagInput value={f.equipements} onChange={(v) => set('equipements', v)} />
              </div>
              <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
                <Field label="Image (chemin)" hint="ex. /cars/dacia-sandero-stepway.png"><Input value={f.image || ''} onChange={(e) => set('image', e.target.value)} /></Field>
                <Thumb src={f.image} className="h-20 w-32 self-end" />
              </div>
              <div className="flex flex-wrap items-end gap-6">
                <Field label="Ordre d'affichage" className="w-36"><Input type="number" value={f.ordre} onChange={(e) => set('ordre', e.target.value as any)} /></Field>
                <div className="pb-2"><Switch checked={f.actif} onChange={(v) => set('actif', v)} label="Modèle actif" /></div>
                <div className="pb-2"><Switch checked={f.a_vendre} onChange={(v) => set('a_vendre', v)} label="À vendre" /></div>
              </div>
            </Section>
          </form>
        )}
      </Modal>

      <ConfirmModal open={!!del} onClose={() => setDel(null)} title="Supprimer le modèle"
        onConfirm={async () => { if (!del) return; await api(`/admin/modeles/${del.id}`, { method: 'DELETE' }); await mutate(); toast('Modèle supprimé'); }}>
        Supprimer définitivement <strong className="text-white">{del?.nom_affiche}</strong> ?
        {del && del.nb_vehicules > 0 && <Alert tone="warn" className="mt-3">Ce modèle a {del.nb_vehicules} véhicule(s) : la suppression sera refusée. Désactivez-le plutôt.</Alert>}
      </ConfirmModal>
    </div>
  );
}

'use client';

import { useEffect, useRef, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { errMsg, PageHead, TagInput, useAdmin, useToast } from '@/components/admin/kit';
import { Alert, Button, Card, CardTitle, Field, Input, Loading, Tabs, Textarea } from '@/components/ui';

type Params = { entreprise: Record<string, any>; tarification: Record<string, any>; conducteur: Record<string, any>; sites: any[] };
type TabKey = 'tarification' | 'conducteur' | 'entreprise' | 'sites';

const TARIF_FIELDS: { key: string; label: string; unit: string; step?: string; hint?: string }[] = [
  { key: 'frais_aller_simple', label: "Frais d'aller simple", unit: '€', hint: 'Retour dans une autre ville que le départ' },
  { key: 'tarif_rapatriement_km', label: 'Tarif de rapatriement', unit: '€ / km', step: '0.01', hint: 'Si le véhicule doit être rapatrié vers sa ville' },
  { key: 'km_inclus_jour', label: 'Kilométrage inclus', unit: 'km / jour' },
  { key: 'remise_fidelite_pct', label: 'Remise fidélité', unit: '%', hint: 'Appliquée aux clients ayant déjà loué' },
  { key: 'reserve_gold', label: 'Réserve assurance Gold', unit: '€', hint: 'Lavage et carburant, restituée au retour' },
  { key: 'tolerance_heures', label: 'Tolérance de retard', unit: 'heures', hint: 'Avant facturation d’un jour supplémentaire' },
  { key: 'annulation_plus_48h_pct', label: 'Retenue annulation > 48 h', unit: '%' },
  { key: 'annulation_moins_48h_pct', label: 'Retenue annulation < 48 h', unit: '%' },
  { key: 'acompte_deux_fois_pct', label: 'Acompte paiement en deux fois', unit: '%' },
];

const COND_FIELDS: { key: string; label: string; unit: string; hint: string }[] = [
  { key: 'age_min', label: 'Âge minimum', unit: 'ans', hint: 'Sauf permis expérimenté' },
  { key: 'permis_min_ans', label: 'Ancienneté de permis minimum', unit: 'ans', hint: 'Obligatoire pour tous' },
  { key: 'permis_experimente_ans', label: 'Permis expérimenté', unit: 'ans', hint: 'En dessous : caution doublée et Gold interdite' },
  { key: 'puissance_seuil_ch', label: 'Seuil véhicule puissant', unit: 'ch', hint: 'Au-delà : règles renforcées' },
  { key: 'age_min_puissant', label: 'Âge minimum véhicule puissant', unit: 'ans', hint: 'Pour les véhicules au-delà du seuil' },
  { key: 'age_max_gold', label: 'Âge maximum assurance Gold', unit: 'ans', hint: 'Au-delà : caution doublée' },
];

function Unit({ unit, children }: { unit: string; children: React.ReactNode }) {
  return (
    <div className="relative">
      {children}
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted">{unit}</span>
    </div>
  );
}

function SaveBar({ dirty, saving, onSave, onReset }: { dirty: boolean; saving: boolean; onSave: () => void; onReset: () => void }) {
  return (
    <div className="mt-6 flex items-center justify-end gap-2 border-t border-line pt-4">
      {dirty && <span className="mr-auto text-xs text-warn">Modifications non enregistrées</span>}
      <Button variant="ghost" size="sm" disabled={!dirty} onClick={onReset}>Annuler</Button>
      <Button size="sm" disabled={!dirty} loading={saving} onClick={onSave}>Enregistrer</Button>
    </div>
  );
}

type AgeRow = [string, string];
const toRows = (v: Record<string, number>): AgeRow[] => Object.entries(v).sort((a, b) => Number(a[0]) - Number(b[0])).map(([k, x]) => [k, String(x)]);
const fromRows = (r: AgeRow[]) => Object.fromEntries(r.filter(([k, x]) => k !== '' && x !== '').map(([k, x]) => [String(Number(k)), Number(x)]));

function AgeEditor({ value, onChange }: { value: Record<string, number>; onChange: (v: Record<string, number>) => void }) {
  const [rows, setRows] = useState<AgeRow[]>(() => toRows(value));
  const last = useRef(JSON.stringify(value));
  useEffect(() => {
    const s = JSON.stringify(value);
    if (s !== last.current) {
      last.current = s;
      setRows(toRows(value));
    }
  }, [value]);
  const update = (r: AgeRow[]) => {
    setRows(r);
    const obj = fromRows(r);
    last.current = JSON.stringify(obj);
    onChange(obj);
  };
  return (
    <div className="space-y-2">
      {rows.map(([k, v], i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-20 text-xs text-muted">À partir de</span>
          <Unit unit="ans"><Input type="number" min={0} className="w-28 pr-10" value={k} onChange={(ev) => update(rows.map((r, j) => (j === i ? [ev.target.value, r[1]] : r)))} /></Unit>
          <Unit unit="%"><Input type="number" min={0} max={100} className="w-24 pr-8" value={v} onChange={(ev) => update(rows.map((r, j) => (j === i ? [r[0], ev.target.value] : r)))} /></Unit>
          <button type="button" onClick={() => update(rows.filter((_, j) => j !== i))} className="rounded-lg p-2 text-muted hover:bg-danger/10 hover:text-danger" aria-label="Retirer"><Trash2 className="h-4 w-4" /></button>
        </div>
      ))}
      <Button variant="outline" size="sm" type="button" onClick={() => update([...rows, [String(rows.length ? Math.max(...rows.map(([k]) => Number(k) || 0)) + 1 : 1), '0']])}>
        <Plus className="h-4 w-4" /> Ajouter un palier
      </Button>
      <span className="block text-xs text-muted">Réduction appliquée au prix de location quand le véhicule a au moins cet âge.</span>
    </div>
  );
}

export default function ParametresPage() {
  const toast = useToast();
  const { data, error, isLoading, mutate } = useAdmin<Params>('/admin/parametres');
  const [tab, setTab] = useState<TabKey>('tarification');
  const [draft, setDraft] = useState<Params | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    if (data) setDraft(structuredClone(data));
  }, [data]);

  if (error) return <Alert tone="danger">{errMsg(error)}</Alert>;
  if (isLoading || !data || !draft) return <Loading />;

  const dirty = (k: keyof Params) => JSON.stringify(draft[k]) !== JSON.stringify(data[k]);
  const reset = (k: keyof Params) => setDraft({ ...draft, [k]: structuredClone(data[k]) });
  const patch = (k: 'tarification' | 'conducteur' | 'entreprise', v: Record<string, any>) => setDraft({ ...draft, [k]: { ...draft[k], ...v } });

  const saveParam = async (cle: 'tarification' | 'conducteur' | 'entreprise') => {
    setSaving(cle);
    try {
      await api(`/admin/parametres/${cle}`, { method: 'PUT', body: draft[cle] });
      await mutate();
      toast('Paramètres enregistrés');
    } catch (e) {
      toast(errMsg(e), 'danger');
    } finally {
      setSaving(null);
    }
  };

  const saveSite = async (s: any) => {
    setSaving(s.code);
    try {
      await api(`/admin/sites/${s.code}`, { method: 'PUT', body: { nom: s.nom, titre: s.titre, slogan: s.slogan || null, telephones: s.telephones, hotline: s.hotline || null } });
      await mutate();
      toast(`Site ${s.nom} enregistré`);
    } catch (e) {
      toast(errMsg(e), 'danger');
    } finally {
      setSaving(null);
    }
  };

  const t = draft.tarification;
  const c = draft.conducteur;
  const e = draft.entreprise;

  return (
    <div>
      <PageHead title="Paramètres" sub="Règles tarifaires, conditions conducteur, informations de l'entreprise et des sites." />
      <Tabs className="mb-6" value={tab} onChange={setTab} items={[
        { value: 'tarification', label: 'Tarification' },
        { value: 'conducteur', label: 'Conducteur' },
        { value: 'entreprise', label: 'Entreprise' },
        { value: 'sites', label: 'Sites' },
      ]} />

      {tab === 'tarification' && (
        <Card className="max-w-5xl">
          <CardTitle>Règles de tarification</CardTitle>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {TARIF_FIELDS.map((f) => (
              <Field key={f.key} label={f.label} hint={f.hint}>
                <Unit unit={f.unit}><Input type="number" step={f.step || '1'} min={0} className="pr-20" value={t[f.key] ?? ''} onChange={(ev) => patch('tarification', { [f.key]: ev.target.value === '' ? '' : Number(ev.target.value) })} /></Unit>
              </Field>
            ))}
          </div>
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div>
              <span className="label">Forfaits de durée (jours)</span>
              <TagInput value={(t.forfaits || []).map(String)} placeholder="Ajouter un nombre de jours"
                onChange={(v) => patch('tarification', { forfaits: Array.from(new Set(v.map(Number).filter((n) => Number.isFinite(n) && n > 0))).sort((a, b) => a - b) })} />
              <span className="mt-1 block text-xs text-muted">Paliers de la grille tarifaire des modèles (ex. 1, 7, 14, 30, 90, 180).</span>
            </div>
            <div>
              <span className="label">Remise selon l&apos;âge du véhicule</span>
              <AgeEditor value={t.remise_age || {}} onChange={(v) => patch('tarification', { remise_age: v })} />
            </div>
          </div>
          <SaveBar dirty={dirty('tarification')} saving={saving === 'tarification'} onSave={() => saveParam('tarification')} onReset={() => reset('tarification')} />
        </Card>
      )}

      {tab === 'conducteur' && (
        <Card className="max-w-5xl">
          <CardTitle>Conditions du conducteur</CardTitle>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {COND_FIELDS.map((f) => (
              <Field key={f.key} label={f.label} hint={f.hint}>
                <Unit unit={f.unit}><Input type="number" min={0} className="pr-12" value={c[f.key] ?? ''} onChange={(ev) => patch('conducteur', { [f.key]: ev.target.value === '' ? '' : Number(ev.target.value) })} /></Unit>
              </Field>
            ))}
          </div>
          <SaveBar dirty={dirty('conducteur')} saving={saving === 'conducteur'} onSave={() => saveParam('conducteur')} onReset={() => reset('conducteur')} />
        </Card>
      )}

      {tab === 'entreprise' && (
        <Card className="max-w-5xl">
          <CardTitle>Entreprise</CardTitle>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Nom"><Input value={e.nom || ''} onChange={(ev) => patch('entreprise', { nom: ev.target.value })} /></Field>
            <Field label="Depuis (année)"><Input type="number" value={e.depuis ?? ''} onChange={(ev) => patch('entreprise', { depuis: Number(ev.target.value) })} /></Field>
            <Field label="Numéro panne / assistance"><Input value={e.panne || ''} onChange={(ev) => patch('entreprise', { panne: ev.target.value })} /></Field>
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div>
              <span className="label">Téléphones hotline (contact)</span>
              <TagInput value={e.hotline_contact || []} placeholder="Ajouter un numéro" onChange={(v) => patch('entreprise', { hotline_contact: v })} />
            </div>
            <Field label="Adresse d'envoi des chèques" hint="Une ligne par ligne d'adresse">
              <Textarea className="min-h-[110px]" value={(e.adresse_cheque || []).join('\n')} onChange={(ev) => patch('entreprise', { adresse_cheque: ev.target.value.split('\n') })}
                onBlur={() => patch('entreprise', { adresse_cheque: (e.adresse_cheque || []).map((l: string) => l.trim()).filter(Boolean) })} />
            </Field>
          </div>
          <h4 className="mb-3 mt-6 text-xs font-semibold uppercase tracking-wider text-brand-cyan">Coordonnées bancaires (virement)</h4>
          <div className="grid gap-4 sm:grid-cols-3">
            {[['titulaire', 'Titulaire'], ['iban', 'IBAN'], ['bic', 'BIC']].map(([k, l]) => (
              <Field key={k} label={l}><Input value={e.banque?.[k] || ''} onChange={(ev) => patch('entreprise', { banque: { ...(e.banque || {}), [k]: ev.target.value } })} /></Field>
            ))}
          </div>
          <h4 className="mb-3 mt-6 text-xs font-semibold uppercase tracking-wider text-brand-cyan">Réseaux sociaux</h4>
          <div className="grid gap-4 sm:grid-cols-3">
            {[['facebook', 'Facebook'], ['instagram', 'Instagram'], ['youtube', 'YouTube']].map(([k, l]) => (
              <Field key={k} label={l}><Input type="url" value={e[k] || ''} placeholder="https://" onChange={(ev) => patch('entreprise', { [k]: ev.target.value })} /></Field>
            ))}
          </div>
          <SaveBar dirty={dirty('entreprise')} saving={saving === 'entreprise'} onSave={() => saveParam('entreprise')} onReset={() => reset('entreprise')} />
        </Card>
      )}

      {tab === 'sites' && (
        <div className="grid max-w-6xl gap-6 lg:grid-cols-2">
          {draft.sites.map((s, i) => {
            const orig = data.sites.find((x) => x.code === s.code);
            const d = JSON.stringify(s) !== JSON.stringify(orig);
            const up = (v: Record<string, any>) => setDraft({ ...draft, sites: draft.sites.map((x, j) => (j === i ? { ...x, ...v } : x)) });
            return (
              <Card key={s.code}>
                <CardTitle action={<span className="font-mono text-xs uppercase text-muted">{s.code}</span>}>{s.code === 'ma' ? 'Ouziad Marrakech Cars' : 'Taltour Algérie'}</CardTitle>
                <div className="space-y-4">
                  <Field label="Nom" required><Input value={s.nom || ''} onChange={(ev) => up({ nom: ev.target.value })} /></Field>
                  <Field label="Titre (accroche principale)" required><Input value={s.titre || ''} onChange={(ev) => up({ titre: ev.target.value })} /></Field>
                  <Field label="Slogan"><Input value={s.slogan || ''} onChange={(ev) => up({ slogan: ev.target.value })} /></Field>
                  <div>
                    <span className="label">Téléphones</span>
                    <TagInput value={s.telephones || []} placeholder="Ajouter un numéro" onChange={(v) => up({ telephones: v })} />
                  </div>
                  <Field label="Hotline"><Input value={s.hotline || ''} onChange={(ev) => up({ hotline: ev.target.value })} /></Field>
                </div>
                <SaveBar dirty={d} saving={saving === s.code} onSave={() => saveSite(s)} onReset={() => up(structuredClone(orig))} />
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

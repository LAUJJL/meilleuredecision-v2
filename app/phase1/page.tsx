'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

/**
 * Phase 1 — formulaire minimal
 * - Un seul bouton "Passer à la phase 2"
 * - Rien n'est sauvegardé tant que l'utilisateur ne clique pas sur ce bouton
 * - Données stockées en localStorage: key = `md:phase1:${visionId}`
 */

type Phase1Form = {
  stock0: number;           // valeur initiale du stock
  inflowName: string;       // nom flux d'entrée
  inflowK: number;          // constante d'entrée
  outflowName: string;      // nom flux de sortie
  outflowK: number;         // constante de sortie
  yMin: number;             // borne mini pour le graphe
  yMax: number;             // borne maxi pour le graphe
};

const defaultForm: Phase1Form = {
  stock0: 1000,
  inflowName: 'Recettes',
  inflowK: 200,
  outflowName: 'Dépenses',
  outflowK: 150,
  yMin: -1000,
  yMax: 3000,
};

export default function Phase1Page() {
  const router = useRouter();
  const params = useSearchParams();
  const visionId = params.get('visionId') ?? '';

  const [form, setForm] = React.useState<Phase1Form>(defaultForm);

  // Charger éventuellement un brouillon si l’utilisateur revient en arrière
  React.useEffect(() => {
    if (!visionId) return;
    const raw = localStorage.getItem(`md:phase1:${visionId}`);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as Phase1Form;
        setForm(parsed);
      } catch {}
    }
  }, [visionId]);

  const setNum = (k: keyof Phase1Form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    // on autorise nombres négatifs + décimaux
    const v = e.target.value === '' ? NaN : Number(e.target.value);
    setForm((f) => ({ ...f, [k]: isNaN(v) ? ('' as unknown as number) : v }));
  };

  const setStr = (k: keyof Phase1Form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const isValidNumber = (v: unknown) => typeof v === 'number' && !Number.isNaN(v);
  const valid =
    visionId &&
    isValidNumber(form.stock0) &&
    form.inflowName.trim().length > 0 &&
    isValidNumber(form.inflowK) &&
    form.outflowName.trim().length > 0 &&
    isValidNumber(form.outflowK) &&
    isValidNumber(form.yMin) &&
    isValidNumber(form.yMax) &&
    form.yMin < form.yMax;

  const handleNext = () => {
    if (!valid || !visionId) return;
    localStorage.setItem(`md:phase1:${visionId}`, JSON.stringify(form));
    // on considère la phase1 "validée" au moment du passage en phase 2
    localStorage.setItem(`md:phase1:validated:${visionId}`, '1');
    router.push(`/phase2?visionId=${encodeURIComponent(visionId)}`);
  };

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-semibold mb-6">Phase 1 — modèle minimal</h1>

      {!visionId && (
        <p className="mb-6 text-red-600">
          Identifiant de vision manquant : cette page requiert <code>?visionId=…</code>.
        </p>
      )}

      <section className="space-y-6">
        <div>
          <label className="block text-sm font-medium">Valeur initiale du stock</label>
          <input
            type="number"
            step="any"
            value={Number.isNaN(form.stock0 as unknown as number) ? '' : form.stock0}
            onChange={setNum('stock0')}
            className="mt-1 w-full rounded border px-3 py-2"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium">Nom du flux d’entrée</label>
            <input
              type="text"
              value={form.inflowName}
              onChange={setStr('inflowName')}
              className="mt-1 w-full rounded border px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Constante d’entrée (par unité de temps)</label>
            <input
              type="number"
              step="any"
              value={Number.isNaN(form.inflowK as unknown as number) ? '' : form.inflowK}
              onChange={setNum('inflowK')}
              className="mt-1 w-full rounded border px-3 py-2"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium">Nom du flux de sortie</label>
            <input
              type="text"
              value={form.outflowName}
              onChange={setStr('outflowName')}
              className="mt-1 w-full rounded border px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Constante de sortie (par unité de temps)</label>
            <input
              type="number"
              step="any"
              value={Number.isNaN(form.outflowK as unknown as number) ? '' : form.outflowK}
              onChange={setNum('outflowK')}
              className="mt-1 w-full rounded border px-3 py-2"
            />
          </div>
        </div>

        <fieldset className="border rounded p-4">
          <legend className="px-2 text-sm font-medium">Graphe du stock (bornes Y)</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium">Y min</label>
              <input
                type="number"
                step="any"
                value={Number.isNaN(form.yMin as unknown as number) ? '' : form.yMin}
                onChange={setNum('yMin')}
                className="mt-1 w-full rounded border px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Y max</label>
              <input
                type="number"
                step="any"
                value={Number.isNaN(form.yMax as unknown as number) ? '' : form.yMax}
                onChange={setNum('yMax')}
                className="mt-1 w-full rounded border px-3 py-2"
              />
            </div>
          </div>
          <p className="mt-2 text-xs text-gray-600">
            Astuce : Y min peut être négatif. Seule contrainte : Y min &lt; Y max.
          </p>
        </fieldset>
      </section>

      <div className="mt-8 flex items-center gap-4">
        <button
          onClick={handleNext}
          disabled={!valid}
          className={`rounded px-4 py-2 text-white ${
            valid ? 'bg-black hover:bg-gray-800' : 'bg-gray-400 cursor-not-allowed'
          }`}
        >
          ➡️ Passer à la phase 2
        </button>
        <p className="text-sm text-gray-600">
          La phase 1 n’est enregistrée <strong>que</strong> lorsque vous passez à la phase 2.
        </p>
      </div>
    </main>
  );
}

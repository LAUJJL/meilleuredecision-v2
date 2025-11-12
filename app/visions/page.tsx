'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

/**
 * Visions du problème (simple)
 * - Liste des visions du problème sélectionné (problemId)
 * - Création d'une vision (nom + longue description)
 * - Badge "Phase 1 validée" si `md:phase1:validated:${visionId}` est présent
 * - Bouton "Aller à la phase 2" uniquement si Phase 1 validée
 * - Sinon bouton "Démarrer la phase 1"
 *
 * Les visions sont stockées dans localStorage:
 *   key = `md:visions:${problemId}` ; value = Vision[]
 */

type Vision = {
  id: string;
  name: string;
  longDef: string;
  createdAt: number;
};

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export default function VisionsPage() {
  const router = useRouter();
  const params = useSearchParams();
  const problemId = params.get('problemId') ?? 'default-problem';

  const storageKey = `md:visions:${problemId}`;
  const [visions, setVisions] = React.useState<Vision[]>([]);
  const [name, setName] = React.useState('');
  const [longDef, setLongDef] = React.useState('');

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      setVisions(raw ? (JSON.parse(raw) as Vision[]) : []);
    } catch {
      setVisions([]);
    }
  }, [storageKey]);

  const persist = (list: Vision[]) => {
    setVisions(list);
    localStorage.setItem(storageKey, JSON.stringify(list));
  };

  const createVision = () => {
    if (!name.trim() || !longDef.trim()) return;
    const v: Vision = { id: uid(), name: name.trim(), longDef: longDef.trim(), createdAt: Date.now() };
    const list = [v, ...visions];
    persist(list);
    // on enchaîne directement vers la Phase 1 de cette vision
    router.push(`/phase1?visionId=${encodeURIComponent(v.id)}`);
  };

  const removeVision = (id: string) => {
    if (!confirm('Supprimer cette vision ?')) return;
    const list = visions.filter((v) => v.id !== id);
    persist(list);
    // nettoyer aussi l'éventuelle validation phase 1
    localStorage.removeItem(`md:phase1:${id}`);
    localStorage.removeItem(`md:phase1:validated:${id}`);
  };

  const isPhase1Validated = (id: string) => localStorage.getItem(`md:phase1:validated:${id}`) === '1';

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-semibold mb-6">Visions du problème (démo minimaliste)</h1>

      {/* Liste des visions existantes */}
      <section className="space-y-4 mb-10">
        {visions.length === 0 ? (
          <p className="text-gray-600">Aucune vision pour ce problème. Créez-en une ci-dessous.</p>
        ) : (
          visions.map((v) => {
            const validated = isPhase1Validated(v.id);
            return (
              <div key={v.id} className="rounded border p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="font-medium">
                      {v.name}{' '}
                      {validated ? (
                        <span className="ml-2 rounded bg-green-100 px-2 py-0.5 text-xs text-green-800">
                          Phase 1 validée
                        </span>
                      ) : (
                        <span className="ml-2 rounded bg-yellow-100 px-2 py-0.5 text-xs text-yellow-800">
                          Phase 1 à faire
                        </span>
                      )}
                    </div>
                    <div className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">{v.longDef}</div>
                  </div>

                  <div className="flex items-center gap-2">
                    {validated ? (
                      <button
                        className="rounded bg-black px-3 py-1.5 text-white hover:bg-gray-800"
                        onClick={() => router.push(`/phase2?visionId=${encodeURIComponent(v.id)}`)}
                      >
                        👉 Aller à la phase 2
                      </button>
                    ) : (
                      <button
                        className="rounded border px-3 py-1.5 hover:bg-gray-50"
                        onClick={() => router.push(`/phase1?visionId=${encodeURIComponent(v.id)}`)}
                      >
                        Démarrer la phase 1
                      </button>
                    )}

                    <button
                      className="rounded border px-3 py-1.5 text-red-600 hover:bg-red-50"
                      onClick={() => removeVision(v.id)}
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </section>

      {/* Création d’une nouvelle vision */}
      <section className="rounded border p-4">
        <h2 className="mb-3 font-medium">Créer une nouvelle vision</h2>

        <div className="mb-3">
          <label className="block text-sm font-medium">Nom de la vision (identification)</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded border px-3 py-2"
            placeholder="Ex. Vision 'trésorerie optimiste'"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">
            Définition longue (plusieurs lignes) — votre représentation complète du problème
          </label>
          <textarea
            value={longDef}
            onChange={(e) => setLongDef(e.target.value)}
            rows={10}
            className="mt-1 w-full rounded border px-3 py-2"
            placeholder="Décrivez librement et précisément (plusieurs dizaines de lignes possibles)…"
          />
        </div>

        <div className="mt-4 flex items-center gap-2">
          <button
            onClick={createVision}
            disabled={!name.trim() || !longDef.trim()}
            className={`rounded px-4 py-2 text-white ${
              name.trim() && longDef.trim() ? 'bg-black hover:bg-gray-800' : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            Créer la vision (puis démarrer la phase 1)
          </button>
        </div>
      </section>
    </main>
  );
}

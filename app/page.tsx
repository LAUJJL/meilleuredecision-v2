// app/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getState,
  setState,
  createProblem,
  selectProblem,
  createRefinementForCurrentProblem,
} from "@/lib/rps";

export default function Home() {
  const [stateVersion, setStateVersion] = useState(0);
  const s = getState();
  const problems = s.problems;
  const currentProblemId = s.currentProblemId;

  // Forcer un rafraîchissement quand on modifie le localStorage
  const refresh = () => setStateVersion(v => v + 1);

  // Formulaires
  const [pTitle, setPTitle] = useState("");
  const [pSummary, setPSummary] = useState("");

  const currentRefs = useMemo(
    () => s.refinements.filter(r => r.problemId === currentProblemId),
    [currentProblemId, stateVersion] // dépend du stateVersion pour se re-rendre
  );

  useEffect(() => { /* SSR safe */ }, [stateVersion]);

  const onCreateProblem = () => {
    if (!pTitle.trim()) return;
    createProblem(pTitle.trim(), pSummary.trim());
    setPTitle(""); setPSummary("");
    refresh();
  };

  const onSelectProblem = (pid: string) => {
    if (!pid) return;
    selectProblem(pid);
    refresh();
  };

  const onCreateRef = () => {
    const id = createRefinementForCurrentProblem();
    if (!id) return;
    // Ouvrir la Phase 0
    window.location.href = "/phase0";
  };

  // UI
  return (
    <main className="min-h-screen grid place-items-center p-8">
      <div className="max-w-3xl w-full space-y-10">
        <header className="text-center space-y-1">
          <h1 className="text-2xl font-semibold">Décisions par simulation</h1>
          <p className="opacity-70 text-sm">
            1 Problème (nom + courte définition) → plusieurs Raffinements/Modèles (Phase 0 → 1 → 2).
          </p>
        </header>

        {/* 1) Créer un Problème */}
        <section className="space-y-3">
          <h2 className="text-lg font-medium">1) Définir un problème</h2>
          <input
            className="border rounded-lg p-2 w-full"
            placeholder="Nom du problème (ex. Mobilité Quartier Nord)"
            maxLength={120}
            value={pTitle}
            onChange={e => setPTitle(e.target.value)}
          />
          <textarea
            className="border rounded-lg p-2 w-full h-20"
            placeholder="Courte définition (2–3 lignes) — pour distinguer ce problème d'autres problèmes."
            value={pSummary}
            onChange={e => setPSummary(e.target.value)}
          />
          <button
            className="px-4 py-2 rounded-lg border"
            onClick={onCreateProblem}
          >
            Créer ce problème
          </button>
        </section>

        {/* 2) Choisir un Problème existant */}
        <section className="space-y-3">
          <h2 className="text-lg font-medium">2) Choisir un problème existant</h2>
          {problems.length === 0 ? (
            <div className="opacity-60 text-sm">Aucun problème pour le moment.</div>
          ) : (
            <>
              <select
                className="border rounded-lg p-2 w-full"
                value={currentProblemId || ""}
                onChange={e => onSelectProblem(e.target.value)}
              >
                <option value="">— Choisir —</option>
                {problems.map(p => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>

              {currentProblemId && (
                <div className="border rounded-lg p-3 space-y-2 bg-gray-50">
                  <div className="text-sm opacity-70">
                    Raffinements / Modèles de ce problème :
                  </div>
                  {currentRefs.length === 0 ? (
                    <div className="text-sm opacity-60">Aucun encore.</div>
                  ) : (
                    <ul className="list-disc pl-5 text-sm">
                      {currentRefs.map(r => (
                        <li key={r.id}>
                          {(r.name.trim() || "Raffinement sans nom")} • Phase {r.phase}
                        </li>
                      ))}
                    </ul>
                  )}

                  <button className="px-4 py-2 rounded-lg border" onClick={onCreateRef}>
                    Créer un nouveau raffinement (ouvrir en Phase 0)
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </main>
  );
}

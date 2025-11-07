// app/phase0/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { getState, updatePhase0, goToPhase } from "@/lib/rps";

export default function Phase0() {
  const s = getState();
  const problem = useMemo(
    () => s.problems.find(p => p.id === s.currentProblemId),
    [s]
  );
  const ref = useMemo(
    () => s.refinements.find(r => r.id === s.currentRefinementId),
    [s]
  );

  const [name, setName] = useState(ref?.name ?? "");
  const [desc, setDesc] = useState(ref?.longDescription ?? "");

  useEffect(() => {
    if (!problem || !ref) {
      // Arriver ici sans contexte → retour accueil
      window.location.href = "/";
    }
  }, [problem, ref]);

  const next = () => {
    updatePhase0(name, desc);
    goToPhase(1);
    // Phase 1 pas encore faite → retour Accueil pour l’instant
    window.location.href = "/";
  };

  if (!problem || !ref) return null;

  return (
    <main className="min-h-screen grid place-items-center p-8">
      <div className="max-w-2xl w-full space-y-5">
        <h1 className="text-xl font-semibold text-center">Phase 0 — Démarrer un raffinement</h1>

        <div className="rounded-lg border p-3 bg-gray-50">
          <div className="text-sm font-medium">Problème (lecture seule)</div>
          <div className="mt-1"><span className="text-sm opacity-70">Nom :</span> {problem.title || "—"}</div>
          <div className="mt-1"><span className="text-sm opacity-70">Définition courte :</span> {problem.summary || "—"}</div>
        </div>

        <label className="block">
          <span className="text-sm">Nom du raffinement/modèle (max. 80 caractères)</span>
          <input
            className="mt-1 w-full border rounded-lg p-2"
            maxLength={80}
            placeholder="Ex. Scénario tramway + piétonnisation"
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </label>

        <label className="block">
          <span className="text-sm">Définition longue (~100 mots)</span>
          <textarea
            className="mt-1 w-full border rounded-lg p-2 h-32"
            placeholder="Décrivez ce raffinement : hypothèses, périmètre, variations par rapport à d'autres modèles…"
            value={desc}
            onChange={e => setDesc(e.target.value)}
          />
        </label>

        <div className="flex gap-3">
          <a href="/" className="px-4 py-2 rounded-lg border">Accueil</a>
          <button className="px-4 py-2 rounded-lg border" onClick={next}>
            Continuer → (Phase 1 bientôt)
          </button>
        </div>
      </div>
    </main>
  );
}

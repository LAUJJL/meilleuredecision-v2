// app/phase0/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getState,
  listPhases,
  updatePhase0Draft,
  validatePhase0,
  clearSelection, // ✅ nouveau
} from "@/lib/rps_v3";

export default function Phase0() {
  const s = getState();
  const project = s.projects.find(p => p.id === s.currentProjectId);
  const sequence = s.sequences.find(r => r.id === s.currentSequenceId);

  useEffect(() => {
    if (!project || !sequence) window.location.href = "/";
  }, [project, sequence]);

  const phases = useMemo(() => sequence ? listPhases(sequence.id) : [], [sequence]);
  const p0 = phases.find(p => p.idx === 0);

  const [draft, setDraft] = useState(p0?.draft || "");
  const [testsDone, setTestsDone] = useState(false);
  const [bypassReason, setBypassReason] = useState("");

  useEffect(() => {
    if (p0 && !p0.lockedAt) setDraft(p0.draft || "");
  }, [p0]);

  if (!project || !sequence || !p0) return null;

  const locked = !!p0.lockedAt;

  const onSaveDraft = (value: string) => {
    setDraft(value);
    updatePhase0Draft(value);
  };

  const canValidate = () => {
    if (locked) return false;
    const textOK = (draft || "").trim().length > 0;
    if (!textOK) return false;
    if (testsDone) return true;
    return (bypassReason || "").trim().length >= 10;
  };

  const onValidate = () => {
    if (!canValidate()) return;
    validatePhase0({ testsDone, bypassReason: testsDone ? undefined : bypassReason });
    window.location.href = "/"; // Phase 1 à venir
  };

  const goChooseAnotherProject = () => {
    clearSelection();               // ✅ on efface projet & séquence courants
    window.location.href = "/";     // retour Accueil pour recréer/choisir
  };

  return (
    <main className="min-h-screen grid place-items-center p-6">
      <div className="w-full max-w-2xl space-y-6">
        <h1 className="text-xl font-semibold text-center">Phase 0 — Définition longue du raffinement</h1>

        {/* Contexte (lecture seule) : seulement les NOMS */}
        <div className="rounded-lg border p-3 bg-gray-50 text-sm">
          <div><span className="opacity-70">Projet :</span> {project.title}</div>
          <div className="mt-1"><span className="opacity-70">Raffinement :</span> {sequence.title}</div>
        </div>

        {/* Phase précédente (lecture seule) — ici rien en Phase 0 */}
        {/* (Pour les phases > 0, on affichera nom + contenu de la phase précédente) */}

        {locked ? (
          <div className="space-y-3">
            <div className="text-sm opacity-70">Cette phase est validée (lecture seule).</div>
            <div className="rounded-lg border p-3 whitespace-pre-wrap bg-white">{p0.content || "—"}</div>
            <div className="text-sm">
              {p0.testsDone
                ? "✅ Tests de compréhension effectués (déclarés)."
                : `⚠️ Validée sans tests — raison : ${p0.bypassReason || "non fournie"}`}
            </div>
            <div className="flex gap-3">
              <a href="/" className="px-4 py-2 rounded-lg border">Accueil</a>
              <button className="px-4 py-2 rounded-lg border" onClick={goChooseAnotherProject}>
                Choisir / créer un autre projet
              </button>
            </div>

            {/* Visionnage des phases validées */}
            <div className="text-sm opacity-70 pt-4">Phases validées (lecture seule) :</div>
            <ul className="text-sm list-disc pl-5">
              <li>Phase 0 — validée {p0.lockedAt}</li>
            </ul>
          </div>
        ) : (
          <div className="space-y-4">
            <label className="block">
              <span className="text-sm">Définition longue (~100 mots)</span>
              <textarea
                className="mt-1 w-full border rounded-lg p-2 h-40"
                placeholder="Expliquez précisément ce raffinement : hypothèses, périmètre, ce qui le distingue d'autres séquences…"
                value={draft}
                onChange={e => onSaveDraft(e.target.value)}
              />
            </label>

            <div className="rounded-lg border p-3 space-y-2">
              <div className="text-sm font-medium">Tests de compréhension (recommandés)</div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={testsDone} onChange={e => setTestsDone(e.target.checked)} />
                J’ai réalisé un rapide auto-test (lecture attentive, cohérence interne, scénario-type).
              </label>

              {!testsDone && (
                <div className="space-y-1">
                  <div className="text-xs opacity-70">
                    Vous pouvez valider sans tests, mais indiquez une raison (10+ caractères) pour lever le blocage.
                  </div>
                  <input
                    className="border rounded-lg p-2 w-full text-sm"
                    placeholder="Raison pour valider sans tests…"
                    value={bypassReason}
                    onChange={e => setBypassReason(e.target.value)}
                  />
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <a href="/" className="px-4 py-2 rounded-lg border">Accueil</a>
              <button
                className={`px-4 py-2 rounded-lg border ${canValidate() ? "" : "opacity-50 cursor-not-allowed"}`}
                onClick={onValidate}
                disabled={!canValidate()}
              >
                Valider & Continuer
              </button>
              <button className="px-4 py-2 rounded-lg border" onClick={goChooseAnotherProject}>
                Choisir / créer un autre projet
              </button>
            </div>

            <div className="text-sm opacity-70 pt-2">
              Phases validées : aucune pour le moment.
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

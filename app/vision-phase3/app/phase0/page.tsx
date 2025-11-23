// app/phase0/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getState,
  listPhases,
  updatePhase0Draft,
  validatePhase0,
  clearSelection,
} from "@/lib/rps_v3";

export default function Phase0() {
  const s = getState();
  const project = s.projects.find(p => p.id === s.currentProjectId);
  const vision = s.sequences.find(r => r.id === s.currentSequenceId);

  useEffect(() => {
    if (!project || !vision) window.location.href = "/projects";
  }, [project, vision]);

  const phases = useMemo(() => vision ? listPhases(vision.id) : [], [vision]);
  const p0 = phases.find(p => p.idx === 0);

  const [draft, setDraft] = useState(p0?.draft || "");

  useEffect(() => {
    if (p0 && !p0.lockedAt) setDraft(p0.draft || "");
  }, [p0]);

  if (!project || !vision || !p0) return null;

  const locked = !!p0.lockedAt;

  const onSaveDraft = (value: string) => {
    setDraft(value);
    updatePhase0Draft(value);
  };

  const onValidate = () => {
    if (locked) return;
    if (!(draft || "").trim()) return;
    validatePhase0({ testsDone: true });
    window.location.href = "/phase1"; // ✅ enchaînement Phase 1
  };

  const goChooseAnotherProject = () => {
    clearSelection();
    window.location.href = "/projects";
  };

  return (
    <main className="min-h-screen grid place-items-center p-6">
      <div className="w-full max-w-2xl space-y-6">
        <h1 className="text-xl font-semibold text-center">Définition de la vision (non numérotée)</h1>

        <div className="rounded-lg border p-3 bg-gray-50 text-sm">
          <div><span className="opacity-70">Problème :</span> {project.title}</div>
          <div className="mt-1"><span className="opacity-70">Vision :</span> {vision.title}</div>
        </div>

        {locked ? (
          <div className="space-y-3">
            <div className="text-sm opacity-70">Cette définition est validée (lecture seule).</div>
            <div className="rounded-lg border p-3 whitespace-pre-wrap bg-white">{p0.content || "—"}</div>
            <div className="flex gap-3">
              <a href="/phase1" className="px-4 py-2 rounded-lg border">Aller à la Phase 1</a>
              <button className="px-4 py-2 rounded-lg border" onClick={goChooseAnotherProject}>
                Choisir / créer un autre problème
              </button>
            </div>

            <div className="text-sm opacity-70 pt-4">Historique :</div>
            <ul className="text-sm list-disc pl-5">
              <li>Définition de la vision — validée {p0.lockedAt}</li>
            </ul>
          </div>
        ) : (
          <div className="space-y-4">
            <label className="block">
              <span className="text-sm">Définition longue (~100 mots)</span>
              <textarea
                className="mt-1 w-full border rounded-lg p-2 h-40"
                placeholder="Décrivez précisément cette vision du problème : hypothèses, périmètre, parti pris, ce qui la distingue d’une autre vision…"
                value={draft}
                onChange={e => onSaveDraft(e.target.value)}
              />
            </label>

            <div className="flex gap-3">
              <a href="/refinements" className="px-4 py-2 rounded-lg border">Visions</a>
              <button
                className={`px-4 py-2 rounded-lg border ${draft.trim() ? "" : "opacity-50 cursor-not-allowed"}`}
                onClick={onValidate}
                disabled={!draft.trim()}
              >
                Valider & Continuer
              </button>
              <button className="px-4 py-2 rounded-lg border" onClick={goChooseAnotherProject}>
                Choisir / créer un autre problème
              </button>
            </div>

            <div className="text-sm opacity-70 pt-2">Aucune phase numérotée tant que la vision n’est pas validée.</div>
          </div>
        )}
      </div>
    </main>
  );
}

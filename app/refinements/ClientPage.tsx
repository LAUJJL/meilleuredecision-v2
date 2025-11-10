"use client";

import { useEffect, useMemo, useState } from "react";
// Import SANS alias pour éviter les soucis de config de paths sur Vercel
import { getState, saveState, listPhases, clearSelection } from "../../lib/rps_v3";

/**
 * Composant **client** "Visions du problème"
 * - Liste les visions du problème courant
 * - Création d'une nouvelle vision
 * - Pour chaque vision : lien "Ouvrir la définition" (Phase 0)
 *   + bouton "→ Phase 2" (visible si Phase 1 est validée)
 */
export default function RefinementsClient() {
  const s = getState();
  const project = s.projects.find((p) => p.id === s.currentProjectId);

  // Si aucun projet sélectionné → retour aux problèmes
  useEffect(() => {
    if (!project) {
      window.location.href = "/projects";
    }
  }, [project?.id]);

  const visions = useMemo(() => {
    if (!project) return [];
    return s.sequences.filter((v) => v.projectId === project.id);
  }, [s.sequences, project?.id]);

  // Création d'une vision
  const [title, setTitle] = useState("");
  const [shortDef, setShortDef] = useState("");

  const createVision = () => {
    const t = title.trim();
    if (!project || !t) return;
    const v = {
      id: crypto.randomUUID(),
      projectId: project.id,
      title: t,
      short: shortDef.trim(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    s.sequences.unshift(v);
    s.currentSequenceId = v.id;
    saveState(s);
    window.location.href = "/phase0";
  };

  const openPhase0 = (visionId: string) => {
    s.currentSequenceId = visionId;
    saveState(s);
    window.location.href = "/phase0";
  };

  const canGoPhase2 = (visionId: string) => {
    const phases = listPhases(visionId);
    const p1 = phases.find((p) => p.idx === 1);
    return !!p1?.validated;
  };

  const goPhase2 = (visionId: string) => {
    window.location.href = `/phase2?seq=${encodeURIComponent(visionId)}`;
  };

  const deleteVision = (visionId: string) => {
    if (!confirm("Supprimer définitivement cette vision ?")) return;
    const i = s.sequences.findIndex((v) => v.id === visionId);
    if (i >= 0) {
      s.sequences.splice(i, 1);
      if (s.currentSequenceId === visionId) s.currentSequenceId = undefined as any;
      saveState(s);
      window.location.reload();
    }
  };

  if (!project) return null;

  return (
    <main className="min-h-screen grid place-items-center p-6">
      <div className="w-full max-w-3xl space-y-6">
        <h1 className="text-xl font-semibold text-center">Visions du problème</h1>
        <div className="text-sm text-center opacity-70">Problème : {project.title}</div>

        <section className="space-y-2">
          <h2 className="font-medium">Ouvrir une vision existante</h2>
          {visions.length === 0 && (
            <div className="text-sm opacity-70">Aucune vision pour le moment.</div>
          )}
          <ul className="space-y-2">
            {visions.map((v) => {
              const phases = listPhases(v.id);
              const p1Validated = phases.find((p) => p.idx === 1)?.validated;
              return (
                <li key={v.id} className="border rounded p-3">
                  <div className="font-medium">{v.title}</div>
                  {v.short && <div className="text-sm opacity-70">{v.short}</div>}

                  <div className="mt-2 flex flex-wrap gap-2">
                    <button className="px-3 py-1 border rounded" onClick={() => openPhase0(v.id)}>
                      Ouvrir la définition de la vision
                    </button>

                    <button
                      className={`px-3 py-1 border rounded ${
                        p1Validated ? "" : "opacity-50 cursor-not-allowed"
                      }`}
                      disabled={!p1Validated}
                      onClick={() => goPhase2(v.id)}
                      title={p1Validated ? "" : "Phase 1 non validée pour cette vision"}
                    >
                      → Phase 2
                    </button>

                    <button className="px-3 py-1 border rounded" onClick={() => deleteVision(v.id)}>
                      Supprimer la vision
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="font-medium">Créer une nouvelle vision</h2>
          <label className="block">
            <span className="text-sm">Nom de la vision (80 car. max)</span>
            <input
              className="mt-1 w-full border rounded p-2"
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, 80))}
              placeholder="Ex : Vision 'trésorerie mensuelle'"
            />
          </label>

          <label className="block">
            <span className="text-sm">Définition courte (1 ligne)</span>
            <input
              className="mt-1 w-full border rounded p-2"
              value={shortDef}
              onChange={(e) => setShortDef(e.target.value)}
              placeholder="Facultatif"
            />
          </label>

          <div className="flex gap-2">
            <button
              className={`px-3 py-2 border rounded ${
                title.trim() ? "" : "opacity-50 cursor-not-allowed"
              }`}
              disabled={!title.trim()}
              onClick={createVision}
            >
              Créer une nouvelle vision (ouvre sa définition)
            </button>
            <button
              className="px-3 py-2 border rounded"
              onClick={() => {
                clearSelection();
                window.location.href = "/projects";
              }}
            >
              ← Revenir aux problèmes
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}

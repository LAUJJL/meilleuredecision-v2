// app/refinements/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getState,
  selectSequence,
  createSequence,
  listPhases,
  deleteSequence,
  clearSelection,
} from "@/lib/rps_v3";

export default function RefinementsPage() {
  const s = getState();
  const project = s.projects.find(p => p.id === s.currentProjectId);
  const sequences = useMemo(
    () => s.sequences.filter(r => r.projectId === s.currentProjectId),
    [s]
  );

  useEffect(() => {
    if (!project) window.location.href = "/projects";
  }, [project]);

  const [title, setTitle] = useState("");
  const [tag, setTag] = useState("");

  if (!project) return null;

  const openSeq = (id: string) => {
    selectSequence(id);
    window.location.href = "/phase0";
  };

  const create = () => {
    const name = title.trim();
    if (!name) return;
    const id = createSequence(name, tag.trim());
    if (id) window.location.href = "/phase0";
  };

  const backToProjects = () => {
    clearSelection();
    window.location.href = "/projects";
  };

  return (
    <main className="min-h-screen grid place-items-center p-6">
      <div className="w-full max-w-4xl space-y-6">
        <h1 className="text-2xl font-semibold text-center">Visions du problème</h1>
        <div className="text-center opacity-70">Problème : {project.title}</div>

        {/* Visions existantes */}
        <section className="space-y-2">
          <h2 className="text-lg font-medium">Ouvrir une vision existante</h2>
          <ul className="space-y-1">
            {sequences.length === 0 && <li className="opacity-60">Aucune vision pour l’instant.</li>}
            {sequences.map(v => {
              const p0 = listPhases(v.id).find(p => p.idx === 0);
              const status = p0?.lockedAt ? "• Définition de la vision validée" : "• Définition de la vision (en cours)";
              return (
                <li key={v.id} className="flex items-center justify-between gap-3">
                  <span>{v.title} {status ? <span className="opacity-60">{status}</span> : null}</span>
                  <div className="flex gap-3">
                    <button className="underline" onClick={() => openSeq(v.id)}>Ouvrir la définition de la vision</button>
                    <button
                      className="text-red-600 underline"
                      onClick={() => {
                        if (confirm("Supprimer cette vision et ses phases ?")) {
                          deleteSequence(v.id);
                          location.reload();
                        }
                      }}
                    >
                      Supprimer
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Nouvelle vision */}
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Créer une nouvelle vision</h2>
          <input
            className="w-full border rounded-lg p-2"
            placeholder="Nom de la vision (80 car. max)"
            maxLength={80}
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
          <input
            className="w-full border rounded-lg p-2"
            placeholder="Définition courte (1 ligne)"
            value={tag}
            onChange={e => setTag(e.target.value)}
          />
          <button className="w-full border rounded-lg p-2" onClick={create}>
            Créer une nouvelle vision (ouvre sa définition)
          </button>
        </section>

        <div>
          <button className="border rounded-lg px-3 py-2" onClick={backToProjects}>
            ← Revenir aux problèmes
          </button>
        </div>
      </div>
    </main>
  );
}

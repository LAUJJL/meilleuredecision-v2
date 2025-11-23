// app/projects/page.tsx
"use client";

import { useMemo, useState } from "react";
import {
  getState,
  createProject,
  selectProject,
  clearSelection,
  deleteProject,
  selectSequence,
} from "@/lib/rps_v3";

export default function ProjectsPage() {
  const s = getState();
  const [title, setTitle] = useState("");
  const [tag, setTag] = useState("");

  const projects = useMemo(() => s.projects, [s.projects]);

  const create = () => {
    const name = title.trim();
    if (!name) return;
    createProject(name, tag.trim());
    setTitle("");
    setTag("");
    // Après création, on va au choix/creation de vision
    window.location.href = "/refinements";
  };

  const open = (projectId: string) => {
    selectProject(projectId);
    window.location.href = "/refinements";
  };

  const purge = (projectId: string) => {
    if (!confirm("Supprimer ce problème et toutes ses visions/phases ?")) return;
    deleteProject(projectId);
    // recharger la page
    window.location.reload();
  };

  const resetSel = () => {
    clearSelection();
    window.location.href = "/projects";
  };

  return (
    <main className="min-h-screen grid place-items-center p-6">
      <div className="w-full max-w-4xl space-y-6">
        <h1 className="text-2xl font-semibold text-center">
          Problèmes <span className="text-xs opacity-60">(gestion)</span>
        </h1>

        {/* Liste des problèmes */}
        <section className="space-y-2">
          <h2 className="text-lg font-medium">Ouvrir un problème existant</h2>
          <ul className="space-y-1">
            {projects.length === 0 && <li className="opacity-60">Aucun problème pour l’instant.</li>}
            {projects.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3">
                <div className="truncate">
                  <span className="font-medium">{p.title}</span>
                  {p.tag ? <span className="opacity-60"> — {p.tag}</span> : null}
                </div>
                <div className="flex gap-3">
                  <button className="underline" onClick={() => open(p.id)}>
                    Ouvrir
                  </button>
                  <button className="text-red-600 underline" onClick={() => purge(p.id)}>
                    Supprimer
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Nouveau problème */}
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Créer un nouveau problème</h2>
          <input
            className="w-full border rounded-lg p-2"
            placeholder="Nom du problème (80 car. max)"
            maxLength={80}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <input
            className="w-full border rounded-lg p-2"
            placeholder="Définition courte (1 ligne, optionnel)"
            value={tag}
            onChange={(e) => setTag(e.target.value)}
          />
          <button className="w-full border rounded-lg p-2" onClick={create}>
            Créer le problème (puis choisir/créer sa vision)
          </button>
        </section>

        <div>
          <button className="border rounded-lg px-3 py-2" onClick={resetSel}>
            Réinitialiser la sélection
          </button>
        </div>
      </div>
    </main>
  );
}

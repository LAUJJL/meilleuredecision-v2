// app/projects/page.tsx
"use client";

import { useEffect, useState } from "react";
import { getState, createProject, selectProject } from "@/lib/rps_v3";

export default function ProjectsPage() {
  const [tick, setTick] = useState(0);
  const s = getState();
  const projects = s.projects;
  const currentProjectId = s.currentProjectId;

  const [pTitle, setPTitle] = useState("");
  const [pTag, setPTag] = useState("");

  const refresh = () => setTick(v => v + 1);
  useEffect(() => {}, [tick]);

  const goRefinements = () => {
    window.location.href = "/refinements";
  };

  return (
    <main className="min-h-screen grid place-items-center p-6">
      <div className="w-full max-w-3xl space-y-10">
        <header className="text-center space-y-1">
          <h1 className="text-2xl font-semibold">Décisions par simulation</h1>
          <p className="text-sm opacity-70">Étape 1 : Créer ou choisir un problème.</p>
        </header>

        {/* Créer un nouveau problème */}
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Créer un nouveau problème</h2>
          <div className="grid gap-2">
            <input
              className="border rounded-lg p-2"
              placeholder="Nom du problème"
              value={pTitle}
              maxLength={120}
              onChange={e => setPTitle(e.target.value)}
            />
            <input
              className="border rounded-lg p-2"
              placeholder="Définition courte (optionnelle)"
              value={pTag}
              maxLength={200}
              onChange={e => setPTag(e.target.value)}
            />
            <button
              className="px-4 py-2 rounded-lg border"
              onClick={() => {
                if (!pTitle.trim()) return;
                createProject(pTitle.trim(), pTag.trim());
                setPTitle(""); setPTag("");
                refresh();
                goRefinements();
              }}
            >
              Créer ce problème
            </button>
          </div>
        </section>

        {/* Choisir un problème existant */}
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Choisir un problème existant</h2>
          {projects.length === 0 ? (
            <div className="text-sm opacity-60">Aucun problème enregistré pour le moment.</div>
          ) : (
            <div className="grid gap-2">
              <select
                className="border rounded-lg p-2 w-full"
                value={currentProjectId || ""}
                onChange={e => { selectProject(e.target.value); refresh(); }}
              >
                <option value="">— Choisir un problème —</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.title}</option>
                ))}
              </select>

              <div className="flex gap-3">
                <button
                  className="px-4 py-2 rounded-lg border"
                  onClick={() => { if (currentProjectId) goRefinements(); }}
                  disabled={!currentProjectId}
                >
                  Continuer → Raffinements
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

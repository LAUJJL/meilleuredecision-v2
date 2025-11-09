// app/refinements/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getState,
  createSequence,
  selectSequence,
  listPhases,
  clearSelection
} from "@/lib/rps_v3";

export default function RefinementsPage() {
  const [tick, setTick] = useState(0);
  const s = getState();
  const project = s.projects.find(p => p.id === s.currentProjectId);

  useEffect(() => {
    if (!project) window.location.href = "/projects"; // sécurité
  }, [project]);

  const sequences = s.sequences.filter(seq => seq.projectId === s.currentProjectId);

  const [seqTitle, setSeqTitle] = useState("");
  const [seqTag, setSeqTag] = useState("");

  const refresh = () => setTick(v => v + 1);
  useEffect(() => {}, [tick]);

  const previousSequences = useMemo(() => {
    return sequences.map(seq => {
      const phases = listPhases(seq.id);
      const p0 = phases.find(p => p.idx === 0);
      const status = p0?.lockedAt ? "Définition de la vision validée" : "Définition de la vision (en cours)";
      return { seq, status };
    });
  }, [sequences, tick]);

  const openPhase0 = (sequenceId?: string) => {
    if (!sequenceId) return;
    selectSequence(sequenceId);
    window.location.href = "/phase0";
  };

  const backToProjects = () => {
    clearSelection();
    window.location.href = "/projects";
  };

  if (!project) return null;

  return (
    <main className="min-h-screen grid place-items-center p-6">
      <div className="w-full max-w-3xl space-y-8">
        <header className="space-y-1 text-center">
          <h1 className="text-2xl font-semibold">Visions du problème</h1>
          <div className="text-sm opacity-70">Problème : {project.title}</div>
        </header>

        {/* Visions existantes */}
        {previousSequences.length > 0 && (
          <section className="space-y-2">
            <h2 className="text-lg font-medium">Ouvrir une vision existante</h2>
            <ul className="list-disc pl-5 text-sm space-y-1">
              {previousSequences.map(({ seq, status }) => (
                <li key={seq.id} className="flex items-center gap-2">
                  <span className="flex-1">{seq.title} • {status}</span>
                  <button className="underline text-sm" onClick={() => openPhase0(seq.id)}>
                    Ouvrir la définition de la vision
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Créer une nouvelle vision */}
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Créer une nouvelle vision</h2>
          <div className="grid gap-2">
            <input
              className="border rounded-lg p-2"
              placeholder="Nom de la vision (80 car. max)"
              value={seqTitle}
              maxLength={80}
              onChange={e => setSeqTitle(e.target.value)}
            />
            <input
              className="border rounded-lg p-2"
              placeholder="Définition courte (1 ligne)"
              value={seqTag}
              maxLength={120}
              onChange={e => setSeqTag(e.target.value)}
            />
            <button
              className="px-4 py-2 rounded-lg border"
              onClick={() => {
                if (!seqTitle.trim()) return;
                const id = createSequence(seqTitle.trim(), seqTag.trim());
                if (id) openPhase0(id);
              }}
            >
              Créer une nouvelle vision (ouvre sa définition)
            </button>
          </div>
        </section>

        <div className="flex gap-3">
          <button className="px-4 py-2 rounded-lg border" onClick={backToProjects}>
            ← Revenir aux problèmes
          </button>
        </div>
      </div>
    </main>
  );
}

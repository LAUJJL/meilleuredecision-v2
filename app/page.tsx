// app/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getState,
  createProject, selectProject,
  createSequence, selectSequence,
  listPhases
} from "@/lib/rps_v3";

export default function Home() {
  const [tick, setTick] = useState(0);
  const s = getState();
  const projects = s.projects;
  const sequences = s.sequences.filter(seq => seq.projectId === s.currentProjectId);
  const currentProjectId = s.currentProjectId;
  const currentSequenceId = s.currentSequenceId;

  const [pTitle, setPTitle] = useState("");
  const [pTag, setPTag] = useState("");
  const [seqTitle, setSeqTitle] = useState("");
  const [seqTag, setSeqTag] = useState("");

  const refresh = () => setTick(v => v + 1);
  useEffect(() => {}, [tick]);

  const openPhase0 = () => {
    if (!currentSequenceId) return;
    window.location.href = "/phase0";
  };

  const previousSequences = useMemo(() => {
    return sequences.map(seq => {
      const phases = listPhases(seq.id);
      const p0 = phases.find(p => p.idx === 0);
      const status = p0?.lockedAt ? "Phase 0 validée" : "Phase 0 (en cours)";
      return { seq, status };
    });
  }, [sequences, tick]);

  return (
    <main className="min-h-screen grid place-items-center p-6">
      <div className="w-full max-w-3xl space-y-10">
        <header className="text-center space-y-1">
          <h1 className="text-2xl font-semibold">Décisions par simulation</h1>
          <p className="text-sm opacity-70">Flux immuable : Projet → Séquence → Phase 0 → …</p>
        </header>

        <section className="space-y-3">
          <h2 className="text-lg font-medium">1) Définir un problème (Projet)</h2>
          <div className="grid gap-2">
            <input className="border rounded-lg p-2" placeholder="Nom du problème" value={pTitle} maxLength={120} onChange={e => setPTitle(e.target.value)} />
            <input className="border rounded-lg p-2" placeholder="Reconnaissance courte" value={pTag} maxLength={200} onChange={e => setPTag(e.target.value)} />
            <button className="px-4 py-2 rounded-lg border" onClick={() => { if (!pTitle.trim()) return; createProject(pTitle.trim(), pTag.trim()); setPTitle(""); setPTag(""); refresh(); }}>
              Créer ce projet (verrouillé)
            </button>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-medium">2) Choisir un projet existant</h2>
          {projects.length === 0 ? (
            <div className="text-sm opacity-60">Aucun projet pour le moment.</div>
          ) : (
            <>
              <select className="border rounded-lg p-2 w-full" value={currentProjectId || ""} onChange={e => { selectProject(e.target.value); refresh(); }}>
                <option value="">— Choisir —</option>
                {projects.map(p => (<option key={p.id} value={p.id}>{p.title}</option>))}
              </select>

              {currentProjectId && (
                <div className="border rounded-lg p-3 space-y-3 bg-gray-50">
                  <div className="text-sm opacity-70">Séquences de ce projet</div>

                  <div className="grid gap-2">
                    <input className="border rounded-lg p-2" placeholder="Nom du raffinement (80 car.)" value={seqTitle} maxLength={80} onChange={e => setSeqTitle(e.target.value)} />
                    <input className="border rounded-lg p-2" placeholder="Reconnaissance courte" value={seqTag} maxLength={120} onChange={e => setSeqTag(e.target.value)} />
                    <button className="px-4 py-2 rounded-lg border" onClick={() => {
                      if (!seqTitle.trim()) return;
                      const id = createSequence(seqTitle.trim(), seqTag.trim());
                      if (id) { selectSequence(id); refresh(); window.location.href = "/phase0"; }
                    }}>
                      Créer une séquence (ouvre Phase 0)
                    </button>
                  </div>

                  {previousSequences.length === 0 ? (
                    <div className="text-sm opacity-60">Aucune séquence pour l’instant.</div>
                  ) : (
                    <ul className="list-disc pl-5 text-sm space-y-1">
                      {previousSequences.map(({ seq, status }) => (
                        <li key={seq.id}>
                          <button className="underline" onClick={() => { selectSequence(seq.id); refresh(); openPhase0(); }}>
                            {seq.title} • {status}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </main>
  );
}

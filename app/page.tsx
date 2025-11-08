"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getState,
  createProject,
  selectProject,
  createSequence,
  selectSequence,
  listPhases
} from "@/lib/rps_v3";

export default function Home() {
  const [tick, setTick] = useState(0);
  const s = getState();
  const projects = s.projects;
  const currentProjectId = s.currentProjectId;
  const sequences = s.sequences.filter(seq => seq.projectId === currentProjectId);

  const [pTitle, setPTitle] = useState("");
  const [pTag, setPTag] = useState("");
  const [seqTitle, setSeqTitle] = useState("");
  const [seqTag, setSeqTag] = useState("");

  const refresh = () => setTick(v => v + 1);
  useEffect(() => {}, [tick]);

  const openPhase0 = () => {
    if (!s.currentSequenceId) return;
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
          <p className="text-sm opacity-70">
            Flux immuable : Problème → Raffinement → Phase 0 → …
          </p>
        </header>

        {/* --- Créer un nouveau problème --- */}
        <section className="space-y-3">
          <h2 className="text-lg font-medium">1) Créer un nouveau problème</h2>
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
                setPTitle("");
                setPTag("");
                refresh();
              }}
            >
              Créer ce problème
            </button>
          </div>
        </section>

        {/* --- Choisir un problème existant --- */}
        <section className="space-y-3">
          <h2 className="text-lg font-medium">2) Choisir un problème existant</h2>
          {projects.length === 0 ? (
            <div className="text-sm opacity-60">Aucun problème enregistré.</div>
          ) : (
            <>
              <select
                className="border rounded-lg p-2 w-full"
                value={currentProjectId || ""}
                onChange={e => {
                  selectProject(e.target.value);
                  refresh();
                }}
              >
                <option value="">— Choisir un problème —</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>

              {currentProjectId && (
                <div className="border rounded-lg p-3 space-y-4 bg-gray-50">
                  <div className="text-sm font-medium">Raffinements du problème sélectionné</div>

                  {/* A) Raffinements existants */}
                  {sequences.length > 0 && (
                    <ul className="list-disc pl-5 text-sm space-y-1">
                      {previousSequences.map(({ seq, status }) => (
                        <li key={seq.id} className="flex items-center gap-2">
                          <span className="flex-1">{seq.title} • {status}</span>
                          <button
                            className="underline text-sm"
                            onClick={() => {
                              selectSequence(seq.id);
                              window.location.href = "/phase0";
                            }}
                          >
                            Ouvrir en Phase 0
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* B) Si aucune séquence n'existe */}
                  {sequences.length === 0 && (
                    <div className="text-sm opacity-60">
                      Aucun raffinement pour ce problème. Créez le premier ci-dessous.
                    </div>
                  )}

                  {/* C) Créer un nouveau raffinement */}
                  <div className="grid gap-2">
                    <div className="text-sm font-medium">Créer un nouveau raffinement</div>
                    <input
                      className="border rounded-lg p-2"
                      placeholder="Nom du raffinement (80 car. max)"
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
                        if (id) {
                          selectSequence(id);
                          window.location.href = "/phase0";
                        }
                      }}
                    >
                      Créer une nouvelle séquence (ouvre Phase 0)
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </main>
  );
}

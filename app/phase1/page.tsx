// app/phase1/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getState,
  listPhases,
  getPhase1,
  ensurePhase1,
  updatePhase1Draft,
  validatePhase1,
  TIME_UNITS,
  type Phase1Spec,
  clearSelection,
} from "@/lib/rps_v3";

export default function Phase1() {
  const s = getState();
  const project = s.projects.find(p => p.id === s.currentProjectId);
  const vision = s.sequences.find(r => r.id === s.currentSequenceId);

  // Sécurité de navigation
  useEffect(() => {
    if (!project || !vision) window.location.href = "/projects";
  }, [project, vision]);

  // Assurer l'existence de la phase 1
  useEffect(() => {
    if (vision) ensurePhase1(vision.id);
  }, [vision]);

  const phases = useMemo(() => (vision ? listPhases(vision.id) : []), [vision]);
  const p0 = phases.find(p => p.idx === 0); // définition de la vision (validée)
  const p1 = vision ? getPhase1(vision.id) : undefined;

  // État du formulaire (prefill depuis draft si présent)
  const [spec, setSpec] = useState<Phase1Spec>({
    stockName: "",
    stockUnit: "",
    timeUnit: "mois",
    inflowName: "",
    outflowName: "",
    initialStockName: "",
    derivedFlowUnit: "",
    derivedStockUnit: "",
  });

  useEffect(() => {
    if (p1?.draft && !p1.lockedAt) {
      try {
        const parsed = JSON.parse(p1.draft) as Phase1Spec;
        setSpec(parsed);
      } catch {}
    }
  }, [p1]);

  if (!project || !vision || !p0 || !p1) return null;

  const locked = !!p1.lockedAt;

  // Helpers
  const update = (patch: Partial<Phase1Spec>) => {
    const next = {
      ...spec,
      ...patch,
    };
    // recalcul dérivés en local
    next.derivedStockUnit = next.stockUnit || "";
    next.derivedFlowUnit = next.stockUnit ? `${next.stockUnit} / ${next.timeUnit}` : "";
    setSpec(next);
    updatePhase1Draft(next);
  };

  const canValidate = () => {
    if (locked) return false;
    return (
      spec.stockName.trim() &&
      spec.stockUnit.trim() &&
      spec.inflowName.trim() &&
      spec.outflowName.trim() &&
      spec.initialStockName.trim()
    );
  };

  const onValidate = () => {
    if (!canValidate()) return;
    validatePhase1();
    // Pour l’instant, retour aux "Visions" après validation de la Phase 1
    window.location.href = "/refinements";
  };

  const backToProjects = () => {
    clearSelection();
    window.location.href = "/projects";
  };

  return (
    <main className="min-h-screen grid place-items-center p-6">
      <div className="w-full max-w-3xl space-y-6">
        <h1 className="text-xl font-semibold text-center">Phase 1 — Stock + flux constants</h1>

        {/* Contexte (lecture seule) */}
        <div className="rounded-lg border p-3 bg-gray-50 text-sm space-y-1">
          <div><span className="opacity-70">Problème :</span> {project.title}</div>
          <div><span className="opacity-70">Vision :</span> {vision.title}</div>
        </div>

        {/* Mémo de la définition de la vision (lecture seule) */}
        <div className="rounded-lg border p-3 bg-white text-sm">
          <div className="opacity-70 mb-1">Définition de la vision :</div>
          <div className="whitespace-pre-wrap">{p0.content || "—"}</div>
        </div>

        {locked ? (
          <div className="space-y-4">
            <div className="text-sm opacity-70">Cette phase est validée (lecture seule).</div>
            <SpecView content={p1.content} />
            <div className="flex gap-3">
              <a href="/refinements" className="px-4 py-2 rounded-lg border">Visions</a>
              <button className="px-4 py-2 rounded-lg border" onClick={backToProjects}>
                Choisir / créer un autre problème
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Formulaire minimal */}
            <section className="space-y-3">
              <h2 className="text-lg font-medium">Paramètres de la Phase 1</h2>

              <div className="grid gap-3">
                <label className="block">
                  <span className="text-sm">Nom du stock (représente l’état du système)</span>
                  <input
                    className="mt-1 w-full border rounded-lg p-2"
                    placeholder="Ex. Trésorerie, Habitants, Points…"
                    value={spec.stockName}
                    onChange={e => update({ stockName: e.target.value })}
                  />
                </label>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <label className="block">
                    <span className="text-sm">Unité du stock</span>
                    <input
                      className="mt-1 w-full border rounded-lg p-2"
                      placeholder="Ex. euros, habitants, points…"
                      value={spec.stockUnit}
                      onChange={e => update({ stockUnit: e.target.value })}
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm">Unité de temps (pas du modèle)</span>
                    <select
                      className="mt-1 w-full border rounded-lg p-2"
                      value={spec.timeUnit}
                      onChange={e => update({ timeUnit: e.target.value as any })}
                    >
                      {TIME_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <label className="block">
                    <span className="text-sm">Nom du flux d’entrée</span>
                    <input
                      className="mt-1 w-full border rounded-lg p-2"
                      placeholder="Ex. Recettes, Naissances…"
                      value={spec.inflowName}
                      onChange={e => update({ inflowName: e.target.value })}
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm">Nom du flux de sortie</span>
                    <input
                      className="mt-1 w-full border rounded-lg p-2"
                      placeholder="Ex. Dépenses, Décès…"
                      value={spec.outflowName}
                      onChange={e => update({ outflowName: e.target.value })}
                    />
                  </label>
                </div>

                <label className="block">
                  <span className="text-sm">Nom du stock de départ</span>
                  <input
                    className="mt-1 w-full border rounded-lg p-2"
                    placeholder="Ex. Trésorerie initiale"
                    value={spec.initialStockName}
                    onChange={e => update({ initialStockName: e.target.value })}
                  />
                </label>
              </div>
            </section>

            {/* Unités dérivées (affichage auto) */}
            <section className="rounded-lg border p-3 bg-gray-50 text-sm">
              <div className="font-medium mb-2">Unités (automatiques)</div>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>{spec.stockName || "Stock"}</strong> : {spec.derivedStockUnit || "—"}</li>
                <li><strong>{spec.inflowName || "Flux d’entrée"}</strong> : {spec.derivedFlowUnit || "—"}</li>
                <li><strong>{spec.outflowName || "Flux de sortie"}</strong> : {spec.derivedFlowUnit || "—"}</li>
                <li><strong>{spec.initialStockName || "Stock de départ"}</strong> : {spec.derivedStockUnit || "—"}</li>
              </ul>
            </section>

            <div className="flex gap-3">
              <a href="/refinements" className="px-4 py-2 rounded-lg border">Visions</a>
              <button
                className={`px-4 py-2 rounded-lg border ${canValidate() ? "" : "opacity-50 cursor-not-allowed"}`}
                onClick={onValidate}
                disabled={!canValidate()}
              >
                Valider & Continuer
              </button>
              <button className="px-4 py-2 rounded-lg border" onClick={backToProjects}>
                Choisir / créer un autre problème
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

/* ——— Vue lecture seule de la spec (après validation) ——— */
function SpecView({ content }: { content?: string }) {
  if (!content) return <div className="text-sm">—</div>;
  let spec: Phase1Spec | null = null;
  try { spec = JSON.parse(content) as Phase1Spec; } catch { return <div className="text-sm">—</div>; }

  return (
    <div className="rounded-lg border p-3 bg-white text-sm">
      <div className="font-medium mb-2">Spécification Phase 1</div>
      <ul className="list-disc pl-5 space-y-1">
        <li><strong>Stock</strong> : {spec.stockName} ({spec.derivedStockUnit})</li>
        <li><strong>Flux d’entrée</strong> : {spec.inflowName} ({spec.derivedFlowUnit})</li>
        <li><strong>Flux de sortie</strong> : {spec.outflowName} ({spec.derivedFlowUnit})</li>
        <li><strong>Stock de départ</strong> : {spec.initialStockName} ({spec.derivedStockUnit})</li>
        <li><strong>Unité de temps</strong> : {spec.timeUnit}</li>
      </ul>
    </div>
  );
}

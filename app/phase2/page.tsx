// app/phase2/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getState,
  listPhases,
  TIME_UNITS,
  clearSelection,
} from "@/lib/rps_v3";

/**
 * Phase 2 (prototype minimal) — Assistant de raffinement :
 * Étapes :
 * 1) Saisie du souhait de raffinement (phrase courte)
 * 2) Deux reformulations proposées (éditables) à valider
 * 3) Choix d’un gabarit d’équations (3 choix simples) ou "trop complexe" => suggestion
 * 4) Réglages param., simulation & graphe (bornes min/max ajustables à la main)
 * 5) Valider (retour aux visions)
 *
 * Persistance simple via localStorage, scoping par visionId.
 */

type RefinementDraft = {
  wish: string;
  paraphrase1: string;
  paraphrase2: string;
  accepted: boolean;
  chosenTemplate: "inflow_trend" | "outflow_prop" | "inflow_seasonal" | null;
  // paramètres (selon template choisi)
  // inflow_trend : inflow(t) = a + b*t
  trend_a?: number;
  trend_b?: number;
  // outflow_prop : outflow(t) = k * stock(t)
  prop_k?: number;
  // inflow_seasonal : inflow(t) = a + b*sin(2πt/P)
  seas_a?: number;
  seas_b?: number;
  seas_P?: number;
  // bornes graphe :
  yMin?: number;
  yMax?: number;
};

const lsKey = (visionId: string) => `rps:phase2:${visionId}`;

function loadDraft(visionId: string): RefinementDraft | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(lsKey(visionId));
  if (!raw) return null;
  try { return JSON.parse(raw) as RefinementDraft; } catch { return null; }
}
function saveDraft(visionId: string, draft: RefinementDraft) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(lsKey(visionId), JSON.stringify(draft));
}

// — Reformulations "deterministes" minimalistes (sans IA)
function paraphraseA(s: string) {
  let p = s.trim();
  if (!p) return "";
  // petites règles : verbes à l’infinitif au début / préciser la cible
  if (!/^ajouter|rendre|faire|introduire|remplacer/i.test(p)) {
    p = "Introduire un raffinement : " + p.charAt(0).toLowerCase() + p.slice(1);
  }
  return p.replace(/\s+/g, " ").trim();
}
function paraphraseB(s: string) {
  let p = s.trim();
  if (!p) return "";
  // insister sur le but + variable touchée (si mention "entrée"/"sortie")
  p = p.replace(/flux d[’']?entrée/gi, "flux d’entrée (inflow)")
       .replace(/flux de sortie/gi, "flux de sortie (outflow)")
       .replace(/\s+/g, " ");
  return "Objectif du raffinement : " + p;
}

// — Simulation commune avec Phase 1 : stock discret S(t+1)=S(t)+(inflow-outflow)
function simulate({
  horizon,
  s0,
  inflowAt,
  outflowAt,
}: {
  horizon: number;
  s0: number;
  inflowAt: (t: number, Sprev: number) => number;
  outflowAt: (t: number, Sprev: number) => number;
}): number[] {
  const n = Math.max(1, Math.min(720, Math.round(horizon)));
  const arr: number[] = new Array(n + 1);
  arr[0] = s0;
  for (let t = 1; t <= n; t++) {
    const prev = arr[t-1];
    const infl = Math.max(0, inflowAt(t-1, prev));
    const out  = Math.max(0, outflowAt(t-1, prev));
    arr[t] = prev + (infl - out);
  }
  return arr;
}

export default function Phase2() {
  const s = getState();
  const project = s.projects.find(p => p.id === s.currentProjectId);
  const vision  = s.sequences.find(r => r.id === s.currentSequenceId);
  const phases  = useMemo(() => (vision ? listPhases(vision.id) : []), [vision]);
  const p0 = phases.find(p => p.idx === 0);
  const p1 = phases.find(p => p.idx === 1); // phase 1 validée (stock + flux const)

  useEffect(() => {
    if (!project || !vision || !p1) {
      // Il faut au moins P0 (texte) + P1 validée pour raffiner
      window.location.href = "/refinements";
    }
  }, [project, vision, p1]);

  // Paramètres hérités de la Phase 1 (lecture seule)
  const base = useMemo(() => {
    if (!p1 || !p1.content) return null;
    try {
      const spec = JSON.parse(p1.content);
      return {
        stockName: spec.stockName || "Stock",
        stockUnit: spec.derivedStockUnit || "",
        flowUnit:  spec.derivedFlowUnit || "",
        timeUnit:  spec.timeUnit || "pas",
        initialStockValue: Number(spec.initialStockValue) || 0,
        inflowValue: Number(spec.inflowValue) || 0,
        outflowValue: Number(spec.outflowValue) || 0,
        horizon: Number(spec.horizon) || 60,
      };
    } catch { return null; }
  }, [p1?.content]);

  const [step, setStep] = useState<1|2|3|4>(1);
  const [draft, setDraft] = useState<RefinementDraft>({
    wish: "",
    paraphrase1: "",
    paraphrase2: "",
    accepted: false,
    chosenTemplate: null,
  });

  // load/persist draft
  useEffect(() => {
    if (!vision) return;
    const d = loadDraft(vision.id);
    if (d) setDraft(d);
  }, [vision?.id]);
  useEffect(() => {
    if (!vision) return;
    saveDraft(vision.id, draft);
  }, [vision?.id, draft]);

  if (!project || !vision || !p0 || !p1 || !base) return null;

  // Étape 1 : souhait + génération paraphrases
  const onGenerateParaphrases = () => {
    const w = draft.wish.trim();
    if (!w) return;
    setDraft(d => ({
      ...d,
      paraphrase1: paraphraseA(w),
      paraphrase2: paraphraseB(w),
      accepted: false,
    }));
    setStep(2);
  };

  const paraphrasesAccepted = () => {
    if (!draft.paraphrase1.trim() || !draft.paraphrase2.trim()) return false;
    return true;
  };

  // Étape 3 : templates
  type Template = {
    id: RefinementDraft["chosenTemplate"];
    title: string;
    hint: string;
  };
  const TEMPLATES: Template[] = [
    {
      id: "inflow_trend",
      title: "Rendre le flux d’entrée croissant/décroissant (tendance)",
      hint: "inflow(t) = a + b·t ; outflow = constant",
    },
    {
      id: "outflow_prop",
      title: "Rendre le flux de sortie proportionnel au stock",
      hint: "outflow(t) = k × stock(t) ; inflow = constant",
    },
    {
      id: "inflow_seasonal",
      title: "Saisonnalité sur le flux d’entrée",
      hint: "inflow(t) = a + b·sin(2πt/P) ; outflow = constant",
    },
  ];

  // init paramètres par défaut selon template choisi
  const ensureTemplateDefaults = (id: NonNullable<RefinementDraft["chosenTemplate"]>) => {
    const patch: Partial<RefinementDraft> = {};
    if (id === "inflow_trend") {
      if (draft.trend_a == null) patch.trend_a = base.inflowValue || 10;
      if (draft.trend_b == null) patch.trend_b = 0;
    } else if (id === "outflow_prop") {
      if (draft.prop_k == null) patch.prop_k = 0.05;
    } else if (id === "inflow_seasonal") {
      if (draft.seas_a == null) patch.seas_a = base.inflowValue || 10;
      if (draft.seas_b == null) patch.seas_b = (base.inflowValue || 10) * 0.2;
      if (draft.seas_P == null) patch.seas_P = Math.max(2, Math.round(base.horizon / 6));
    }
    setDraft(d => ({ ...d, ...patch }));
  };

  // Étape 4 : simulation selon le template
  const series = useMemo(() => {
    if (!draft.chosenTemplate) return [];
    const s0 = base.initialStockValue;
    const T  = base.horizon;

    if (draft.chosenTemplate === "inflow_trend") {
      const a = Number.isFinite(draft.trend_a!) ? draft.trend_a! : base.inflowValue;
      const b = Number.isFinite(draft.trend_b!) ? draft.trend_b! : 0;
      const inflowAt  = (t: number) => Math.max(0, a + b * t);
      const outflowAt = (_t: number, _S: number) => base.outflowValue;
      return simulate({ horizon: T, s0, inflowAt, outflowAt });
    }
    if (draft.chosenTemplate === "outflow_prop") {
      const k = Number.isFinite(draft.prop_k!) ? Math.max(0, draft.prop_k!) : 0.05;
      const inflowAt  = (_t: number) => base.inflowValue;
      const outflowAt = (_t: number, S: number) => Math.max(0, k * S);
      return simulate({ horizon: T, s0, inflowAt, outflowAt });
    }
    if (draft.chosenTemplate === "inflow_seasonal") {
      const a = Number.isFinite(draft.seas_a!) ? draft.seas_a! : base.inflowValue;
      const b = Number.isFinite(draft.seas_b!) ? Math.max(0, draft.seas_b!) : (base.inflowValue * 0.2);
      const P = Number.isFinite(draft.seas_P!) ? Math.max(2, draft.seas_P!) : Math.max(2, Math.round(T/6));
      const inflowAt  = (t: number) => Math.max(0, a + b * Math.sin((2*Math.PI*t)/P));
      const outflowAt = (_t: number) => base.outflowValue;
      return simulate({ horizon: T, s0, inflowAt, outflowAt });
    }
    return [];
  }, [draft.chosenTemplate, draft.trend_a, draft.trend_b, draft.prop_k, draft.seas_a, draft.seas_b, draft.seas_P, base]);

  // Bornes graphe (manuelles), défaut simple : min = min(0, min série - marge), max = max(100, max série, 2×S0)
  const autoMin = useMemo(() => {
    if (!series.length) return -10;
    const mn = Math.min(...series);
    const pad = Math.max(1, Math.abs(mn) * 0.05);
    return Math.min(0, mn - pad);
  }, [series]);
  const autoMax = useMemo(() => {
    if (!series.length) return 100;
    const mx = Math.max(...series);
    return Math.max(100, mx);
  }, [series]);

  const yMin = Number.isFinite(draft.yMin!) ? draft.yMin! : autoMin;
  const yMax = Number.isFinite(draft.yMax!) ? draft.yMax! : Math.max(autoMax, (base.initialStockValue || 0) * 2);

  const applyBounds = (min: number, max: number) => {
    const safeMin = Number(min);
    const safeMax = Number(max);
    if (!Number.isFinite(safeMin) || !Number.isFinite(safeMax)) return;
    if (safeMax <= safeMin) return;
    setDraft(d => ({ ...d, yMin: safeMin, yMax: safeMax }));
  };

  const backToProjects = () => {
    clearSelection();
    window.location.href = "/projects";
  };
  const backToRefinements = () => { window.location.href = "/refinements"; };

  const canValidate = () => {
    return !!draft.accepted && !!draft.chosenTemplate;
  };
  const onValidate = () => {
    // Version prototype : on revient à la page des visions.
    backToRefinements();
  };

  return (
    <main className="min-h-screen grid place-items-center p-6">
      <div className="w-full max-w-4xl space-y-6">
        <h1 className="text-xl font-semibold text-center">Phase 2 — Assistant de raffinement (prototype)</h1>

        {/* Contexte Phase 0 + Phase 1 */}
        <div className="rounded-lg border p-3 bg-gray-50 text-sm space-y-1">
          <div><span className="opacity-70">Problème :</span> {project.title}</div>
          <div><span className="opacity-70">Vision :</span> {vision.title}</div>
          <div><span className="opacity-70">Phase 0 (résumé) :</span> <span className="whitespace-pre-wrap">{(phases.find(p=>p.idx===0)?.content)||"—"}</span></div>
          <div className="opacity-70">Phase 1 validée — <em>{base.stockName}</em> ; inflow = {base.inflowValue} ; outflow = {base.outflowValue} ; pas = {base.timeUnit} ; horizon = {base.horizon}</div>
        </div>

        {/* Étapes */}
        <ol className="flex flex-wrap gap-2 text-sm">
          {[1,2,3,4].map(n => (
            <li key={n} className={`px-2 py-1 border rounded ${step===n ? "bg-black text-white" : "bg-white"}`}>Étape {n}</li>
          ))}
        </ol>

        {step===1 && (
          <section className="space-y-3">
            <h2 className="text-lg font-medium">1) Décrire le raffinement souhaité</h2>
            <p className="text-sm opacity-70">
              Une phrase courte (exemples : “rendre le flux d’entrée croissant”, “faire dépendre le flux de sortie du stock”, “ajouter une saisonnalité sur les entrées”…).
              Si c’est trop complexe, nous te proposerons une version plus simple.
            </p>
            <TextArea label="Votre souhait" value={draft.wish} onChange={v => setDraft(d => ({...d, wish: v}))} rows={3} ph="Ex. Rendre les recettes croissantes avec le temps" />
            <div className="flex gap-2">
              <button className={`px-3 py-2 border rounded ${draft.wish.trim() ? "" : "opacity-50 cursor-not-allowed"}`} disabled={!draft.wish.trim()} onClick={onGenerateParaphrases}>
                Générer 2 reformulations
              </button>
              <button className="px-3 py-2 border rounded" onClick={backToRefinements}>Annuler</button>
            </div>
          </section>
        )}

        {step===2 && (
          <section className="space-y-3">
            <h2 className="text-lg font-medium">2) Valider deux reformulations</h2>
            <p className="text-sm opacity-70">Modifie-les si nécessaire. Tu dois approuver <strong>les deux</strong>.</p>
            <TextArea label="Reformulation A" value={draft.paraphrase1} onChange={v => setDraft(d => ({...d, paraphrase1: v}))} rows={2} />
            <TextArea label="Reformulation B" value={draft.paraphrase2} onChange={v => setDraft(d => ({...d, paraphrase2: v}))} rows={2} />
            <div className="flex gap-2">
              <button
                className={`px-3 py-2 border rounded ${paraphrasesAccepted() ? "" : "opacity-50 cursor-not-allowed"}`}
                disabled={!paraphrasesAccepted()}
                onClick={() => { setDraft(d => ({...d, accepted: true})); setStep(3); }}
              >
                J’approuve ces deux reformulations
              </button>
              <button className="px-3 py-2 border rounded" onClick={() => setStep(1)}>Revenir à l’étape 1</button>
            </div>
          </section>
        )}

        {step===3 && (
          <section className="space-y-3">
            <h2 className="text-lg font-medium">3) Choisir un gabarit (équations)</h2>
            <p className="text-sm opacity-70">
              Si ton souhait initial est très complexe, commence par un raffinement simple ci-dessous (tu pourras enchaîner d’autres raffinements ensuite).
            </p>
            <div className="grid gap-2">
              {TEMPLATES.map(t => (
                <label key={t.id} className="border rounded p-2 flex items-start gap-2">
                  <input
                    type="radio"
                    name="tmpl"
                    checked={draft.chosenTemplate===t.id}
                    onChange={() => { setDraft(d => ({...d, chosenTemplate: t.id})); ensureTemplateDefaults(t.id!); }}
                  />
                  <div>
                    <div className="font-medium">{t.title}</div>
                    <div className="text-xs opacity-70">{t.hint}</div>
                  </div>
                </label>
              ))}
              <div className="border rounded p-2 text-sm">
                <div className="font-medium">Mon souhait reste trop complexe</div>
                <div className="opacity-70">Suggestion : commence par <em>rendre le flux d’entrée croissant</em> OU <em>rendre le flux de sortie proportionnel au stock</em>.</div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                className={`px-3 py-2 border rounded ${draft.chosenTemplate ? "" : "opacity-50 cursor-not-allowed"}`}
                disabled={!draft.chosenTemplate}
                onClick={() => setStep(4)}
              >
                Continuer
              </button>
              <button className="px-3 py-2 border rounded" onClick={() => setStep(2)}>Revenir à l’étape 2</button>
            </div>
          </section>
        )}

        {step===4 && draft.chosenTemplate && (
          <section className="space-y-6">
            <h2 className="text-lg font-medium">4) Réglages & simulation</h2>

            {/* Paramètres selon template */}
            {draft.chosenTemplate === "inflow_trend" && (
              <div className="border rounded p-3 space-y-2">
                <div className="text-sm opacity-70">inflow(t) = a + b·t ; outflow = constant</div>
                <NumberField label={`a (niveau de départ) [${base.flowUnit||"unit/temps"}]`} value={draft.trend_a ?? 10} onChange={v => setDraft(d=>({...d, trend_a: v}))} />
                <NumberField label="b (pente par pas de temps)" value={draft.trend_b ?? 0} onChange={v => setDraft(d=>({...d, trend_b: v}))} />
              </div>
            )}
            {draft.chosenTemplate === "outflow_prop" && (
              <div className="border rounded p-3 space-y-2">
                <div className="text-sm opacity-70">outflow(t) = k × stock(t) ; inflow = constant</div>
                <NumberField label="k (proportion)" value={draft.prop_k ?? 0.05} onChange={v => setDraft(d=>({...d, prop_k: Math.max(0, v)}))} />
              </div>
            )}
            {draft.chosenTemplate === "inflow_seasonal" && (
              <div className="border rounded p-3 space-y-2">
                <div className="text-sm opacity-70">inflow(t) = a + b·sin(2πt/P) ; outflow = constant</div>
                <NumberField label={`a (moyenne) [${base.flowUnit||"unit/temps"}]`} value={draft.seas_a ?? 10} onChange={v => setDraft(d=>({...d, seas_a: v}))} />
                <NumberField label="b (amplitude)" value={draft.seas_b ?? 2} onChange={v => setDraft(d=>({...d, seas_b: Math.max(0, v)}))} />
                <NumberField label={`P (période en ${base.timeUnit}s)`} value={draft.seas_P ?? Math.max(2, Math.round(base.horizon/6))} onChange={v => setDraft(d=>({...d, seas_P: Math.max(2, Math.round(v))}))} />
              </div>
            )}

            {/* Bornes du graphe */}
            <div className="border rounded p-3 space-y-2">
              <div className="text-sm font-medium">Bornes du graphique</div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <NumberField label={`Min Y (${base.stockUnit||"unit"})`} value={yMin} onChange={v => setDraft(d=>({...d, yMin: v}))} />
                <NumberField label={`Max Y (${base.stockUnit||"unit"})`} value={yMax} onChange={v => setDraft(d=>({...d, yMax: v}))} />
                <div className="flex items-end">
                  <button className="px-3 py-2 border rounded w-full" onClick={() => applyBounds(draft.yMin ?? autoMin, draft.yMax ?? autoMax)}>
                    Appliquer
                  </button>
                </div>
              </div>
              <div className="text-xs opacity-70">Astuce : tu peux mettre un min négatif si le stock peut descendre sous zéro.</div>
            </div>

            {/* Graphe */}
            <div>
              <h3 className="text-md font-medium mb-2">Graphique du {base.stockName}</h3>
              <MiniChart
                series={series}
                unitY={base.stockUnit || ""}
                unitX={base.timeUnit}
                yMin={yMin}
                yMax={yMax}
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <button className="px-3 py-2 border rounded" onClick={() => setStep(3)}>Précédent</button>
              <button className={`px-3 py-2 border rounded ${canValidate() ? "" : "opacity-50 cursor-not-allowed"}`} disabled={!canValidate()} onClick={onValidate}>
                Valider & revenir aux visions
              </button>
              <button className="px-3 py-2 border rounded" onClick={backToRefinements}>Annuler</button>
              <button className="px-3 py-2 border rounded" onClick={backToProjects}>Choisir / créer un autre problème</button>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

/* — UI mini — */
function TextArea({ label, value, onChange, rows=3, ph }: { label: string; value: string; onChange: (v:string)=>void; rows?: number; ph?: string; }) {
  return (
    <label className="block">
      <span className="text-sm">{label}</span>
      <textarea className="mt-1 w-full border rounded-lg p-2" rows={rows} placeholder={ph||""} value={value} onChange={e => onChange(e.target.value)} />
    </label>
  );
}
function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (v:number)=>void; }) {
  return (
    <label className="block">
      <span className="text-sm">{label}</span>
      <input type="number" className="mt-1 w-full border rounded-lg p-2" value={String(value)} onChange={e => onChange(Number(e.target.value))} />
    </label>
  );
}

/* — Mini graphe : bornes Y fixées par l’utilisateur (négatif autorisé) — */
function MiniChart({
  series,
  unitY,
  unitX,
  yMin,
  yMax,
}: {
  series: number[];
  unitY: string;
  unitX: string;
  yMin: number;
  yMax: number;
}) {
  const W = 640, H = 260, PAD = 40;
  const safe = (series && series.length >= 2) ? series : [0, 0];

  let minY = yMin;
  let maxY = yMax;
  if (maxY <= minY) { maxY = minY + 1; }

  const toX = (i: number) => PAD + (i * (W - 2 * PAD)) / (safe.length - 1 || 1);
  const toY = (v: number) => H - PAD - ((v - minY) * (H - 2 * PAD)) / (maxY - minY || 1);
  const d = safe.map((v, i) => `${i === 0 ? "M" : "L"} ${toX(i)},${toY(v)}`).join(" ");
  const yMid = (minY + maxY) / 2;
  const pathKey = `${safe[0]}-${safe[safe.length - 1]}-${safe.length}-${minY}-${maxY}`;

  return (
    <svg width={W} height={H} className="border rounded-lg bg-white">
      <line x1={PAD} y1={H-PAD} x2={W-PAD} y2={H-PAD} stroke="#ccc" />
      <line x1={PAD} y1={PAD}   x2={PAD}   y2={H-PAD} stroke="#ccc" />

      {[minY, yMid, maxY].map((v, idx) => (
        <g key={idx}>
          <line x1={PAD-4} y1={toY(v)} x2={W-PAD} y2={toY(v)} stroke="#eee" />
          <text x={8} y={toY(v)+4} fontSize="10" fill="#666">{Math.round(v*100)/100}</text>
        </g>
      ))}

      <path key={pathKey} d={d} fill="none" stroke="#222" strokeWidth={2} />

      <text x={W/2} y={H-8} fontSize="11" fill="#666" textAnchor="middle">{unitX}</text>
      <text x={12} y={14} fontSize="11" fill="#666">{unitY}</text>
    </svg>
  );
}

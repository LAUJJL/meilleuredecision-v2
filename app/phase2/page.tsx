// app/phase2/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getState,
  saveState,
  listPhases,
  clearSelection,
} from "@/lib/rps_v3";

/**
 * Phase 2 (prototype) — Voir description détaillée dans la version précédente.
 * Ajout : support de l’URL ?seq=<visionId> pour ouvrir directement une vision.
 */

type RefinementDraft = {
  wish: string;
  paraphrase1: string;
  paraphrase2: string;
  accepted: boolean;
  chosenTemplate: "inflow_trend" | "outflow_prop" | "inflow_seasonal" | null;
  trend_a?: number;
  trend_b?: number;
  prop_k?: number;
  seas_a?: number;
  seas_b?: number;
  seas_P?: number;
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

function paraphraseA(s: string) {
  let p = s.trim();
  if (!p) return "";
  if (!/^ajouter|rendre|faire|introduire|remplacer/i.test(p)) {
    p = "Introduire un raffinement : " + p.charAt(0).toLowerCase() + p.slice(1);
  }
  return p.replace(/\s+/g, " ").trim();
}
function paraphraseB(s: string) {
  let p = s.trim();
  if (!p) return "";
  p = p.replace(/flux d[’']?entrée/gi, "flux d’entrée (inflow)")
       .replace(/flux de sortie/gi, "flux de sortie (outflow)")
       .replace(/\s+/g, " ");
  return "Objectif du raffinement : " + p;
}

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
  // Lecture éventuelle du paramètre ?seq=...
  const [seqFromUrl, setSeqFromUrl] = useState<string | null>(null);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const seq = params.get("seq");
    if (seq) setSeqFromUrl(seq);
  }, []);

  const s = getState();
  // Si ?seq présent, on "utilise" cette vision, sinon la vision sélectionnée
  const visionId = seqFromUrl || s.currentSequenceId || "";
  const vision  = s.sequences.find(r => r.id === visionId);
  const project = vision ? s.projects.find(p => p.id === vision.projectId) : null;

  // Si on a un seqFromUrl, on synchronise la sélection (facultatif mais pratique)
  useEffect(() => {
    if (vision && project && s.currentSequenceId !== vision.id) {
      s.currentProjectId = project.id;
      s.currentSequenceId = vision.id;
      saveState(s);
    }
  }, [visionId, vision?.id, project?.id]);

  const phases  = useMemo(() => (vision ? listPhases(vision.id) : []), [vision?.id]);
  const p0 = phases.find(p => p.idx === 0);
  const p1 = phases.find(p => p.idx === 1);

  useEffect(() => {
    if (!project || !vision || !p1) {
      window.location.href = "/refinements";
    }
  }, [project?.id, vision?.id, p1?.validated]);

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

  type Template = {
    id: NonNullable<RefinementDraft["chosenTemplate"]>;
    title: string;
    hint: string;
  };
  const TEMPLATES: Template[] = [
    { id: "inflow_trend",   title: "Flux d’entrée avec tendance",            hint: "inflow(t) = a + b·t ; outflow constant" },
    { id: "outflow_prop",   title: "Flux de sortie proportionnel au stock",  hint: "outflow(t) = k × stock(t) ; inflow constant" },
    { id: "inflow_seasonal",title: "Flux d’entrée saisonnier",               hint: "inflow(t) = a + b·sin(2πt/P) ; outflow constant" },
  ];

  const ensureTemplateDefaults = (id: Template["id"]) => {
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

  const series = useMemo(() => {
    if (!draft.chosenTemplate) return [];
    const s0 = base.initialStockValue;
    const T  = base.horizon;

    if (draft.chosenTemplate === "inflow_trend") {
      const a = Number.isFinite(draft.trend_a!) ? draft.trend_a! : base.inflowValue;
      const b = Number.isFinite(draft.trend_b!) ? draft.trend_b! : 0;
      const inflowAt  = () => (t: number) => Math.max(0, a + b * t);
      const outflowAt = () => (_t: number, _S: number) => base.outflowValue;
      return simulate({ horizon: T, s0, inflowAt: inflowAt(), outflowAt: outflowAt() });
    }
    if (draft.chosenTemplate === "outflow_prop") {
      const k = Number.isFinite(draft.prop_k!) ? Math.max(0, draft.prop_k!) : 0.05;
      const inflowAt  = () => (_t: number) => base.inflowValue;
      const outflowAt = () => (_t: number, S: number) => Math.max(0, k * S);
      return simulate({ horizon: T, s0, inflowAt: inflowAt(), outflowAt: outflowAt() });
    }
    if (draft.chosenTemplate === "inflow_seasonal") {
      const a = Number.isFinite(draft.seas_a!) ? draft.seas_a! : base.inflowValue;
      const b = Number.isFinite(draft.seas_b!) ? Math.max(0, draft.seas_b!) : (base.inflowValue * 0.2);
      const P = Number.isFinite(draft.seas_P!) ? Math.max(2, draft.seas_P!) : Math.max(2, Math.round(T/6));
      const inflowAt  = () => (t: number) => Math.max(0, a + b * Math.sin((2*Math.PI*t)/P));
      const outflowAt = () => (_t: number) => base.outflowValue;
      return simulate({ horizon: T, s0, inflowAt: inflowAt(), outflowAt: outflowAt() });
    }
    return [];
  }, [draft.chosenTemplate, draft.trend_a, draft.trend_b, draft.prop_k, draft.seas_a, draft.seas_b, draft.seas_P, base]);

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

  const backToProjects = () => { clearSelection(); window.location.href = "/projects"; };
  const backToRefinements = () => { window.location.href = "/refinements"; };

  const canValidate = () => !!draft.accepted && !!draft.chosenTemplate;
  const onValidate = () => backToRefinements();

  return (
    <main className="min-h-screen grid place-items-center p-6">
      <div className="w-full max-w-4xl space-y-6">
        <h1 className="text-xl font-semibold text-center">Phase 2 — Assistant de raffinement (prototype)</h1>

        <div className="rounded-lg border p-3 bg-gray-50 text-sm space-y-1">
          <div><span className="opacity-70">Problème :</span> {project?.title}</div>
          <div><span className="opacity-70">Vision :</span> {vision?.title}</div>
          <div><span className="opacity-70">Phase 0 (résumé) :</span> <span className="whitespace-pre-wrap">{(listPhases(vision!.id).find(p=>p.idx===0)?.content)||"—"}</span></div>
          <div className="opacity-70">Phase 1 validée — <em>{base.stockName}</em> ; inflow = {base.inflowValue} ; outflow = {base.outflowValue} ; pas = {base.timeUnit} ; horizon = {base.horizon}</div>
        </div>

        <ol className="flex flex-wrap gap-2 text-sm">
          {[1,2,3,4].map(n => (
            <li key={n} className={`px-2 py-1 border rounded ${n===1? "bg-black text-white":""} ${n===2? "bg-black text-white":""} ${n===3? "bg-black text-white":""} ${n===4? "bg-black text-white":""}`}>Étape {n}</li>
          ))}
        </ol>

        {step===1 && (
          <section className="space-y-3">
            <h2 className="text-lg font-medium">1) Décrire le raffinement souhaité</h2>
            <p className="text-sm opacity-70">Phrase courte (ex : “rendre le flux d’entrée croissant”)…</p>
            <TextArea label="Votre souhait" value={draft.wish} onChange={v => setDraft(d => ({...d, wish: v}))} rows={3} ph="Ex. Rendre les recettes croissantes avec le temps" />
            <div className="flex gap-2">
              <button className={`px-3 py-2 border rounded ${draft.wish.trim() ? "" : "opacity-50 cursor-not-allowed"}`} disabled={!draft.wish.trim()} onClick={onGenerateParaphrases}>Générer 2 reformulations</button>
              <button className="px-3 py-2 border rounded" onClick={backToRefinements}>Annuler</button>
            </div>
          </section>
        )}

        {step===2 && (
          <section className="space-y-3">
            <h2 className="text-lg font-medium">2) Valider deux reformulations</h2>
            <TextArea label="Reformulation A" value={draft.paraphrase1} onChange={v => setDraft(d => ({...d, paraphrase1: v}))} rows={2} />
            <TextArea label="Reformulation B" value={draft.paraphrase2} onChange={v => setDraft(d => ({...d, paraphrase2: v}))} rows={2} />
            <div className="flex gap-2">
              <button className={`px-3 py-2 border rounded ${paraphrasesAccepted() ? "" : "opacity-50 cursor-not-allowed"}`} disabled={!paraphrasesAccepted()} onClick={() => { setDraft(d => ({...d, accepted: true})); setStep(3); }}>J’approuve</button>
              <button className="px-3 py-2 border rounded" onClick={() => setStep(1)}>Revenir</button>
            </div>
          </section>
        )}

        {step===3 && (
          <section className="space-y-3">
            <h2 className="text-lg font-medium">3) Choisir un gabarit</h2>
            <div className="grid gap-2">
              {["inflow_trend","outflow_prop","inflow_seasonal"].map((id) => {
                const defs: any = {
                  inflow_trend:   { title: "Flux d’entrée avec tendance", hint: "inflow(t) = a + b·t ; outflow constant" },
                  outflow_prop:   { title: "Flux de sortie proportionnel au stock", hint: "outflow(t) = k × stock(t) ; inflow constant" },
                  inflow_seasonal:{ title: "Flux d’entrée saisonnier", hint: "inflow(t) = a + b·sin(2πt/P) ; outflow constant" },
                };
                return (
                  <label key={id} className="border rounded p-2 flex items-start gap-2">
                    <input type="radio" name="tmpl" checked={draft.chosenTemplate===id} onChange={() => { setDraft(d => ({...d, chosenTemplate: id as any})); ensureTemplateDefaults(id as any); }} />
                    <div>
                      <div className="font-medium">{defs[id].title}</div>
                      <div className="text-xs opacity-70">{defs[id].hint}</div>
                    </div>
                  </label>
                );
              })}
            </div>
            <div className="flex gap-2">
              <button className={`px-3 py-2 border rounded ${draft.chosenTemplate ? "" : "opacity-50 cursor-not-allowed"}`} disabled={!draft.chosenTemplate} onClick={() => setStep(4)}>Continuer</button>
              <button className="px-3 py-2 border rounded" onClick={() => setStep(2)}>Revenir</button>
            </div>
          </section>
        )}

        {step===4 && draft.chosenTemplate && (
          <section className="space-y-6">
            <h2 className="text-lg font-medium">4) Réglages & simulation</h2>

            {draft.chosenTemplate === "inflow_trend" && (
              <div className="border rounded p-3 space-y-2">
                <div className="text-sm opacity-70">inflow(t) = a + b·t ; outflow = constant</div>
                <NumberField label={`a (${base.flowUnit||"unit/temps"})`} value={draft.trend_a ?? 10} onChange={v => setDraft(d=>({...d, trend_a: v}))} />
                <NumberField label="b (pente)" value={draft.trend_b ?? 0} onChange={v => setDraft(d=>({...d, trend_b: v}))} />
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
                <NumberField label={`a (${base.flowUnit||"unit/temps"})`} value={draft.seas_a ?? 10} onChange={v => setDraft(d=>({...d, seas_a: v}))} />
                <NumberField label="b (amplitude)" value={draft.seas_b ?? 2} onChange={v => setDraft(d=>({...d, seas_b: Math.max(0, v)}))} />
                <NumberField label={`P (en ${base.timeUnit}s)`} value={draft.seas_P ?? Math.max(2, Math.round(base.horizon/6))} onChange={v => setDraft(d=>({...d, seas_P: Math.max(2, Math.round(v))}))} />
              </div>
            )}

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
              <div className="text-xs opacity-70">Tu peux mettre un min négatif si le stock peut passer sous zéro.</div>
            </div>

            <div>
              <h3 className="text-md font-medium mb-2">Graphique du {base.stockName}</h3>
              <MiniChart series={series} unitY={base.stockUnit||""} unitX={base.timeUnit} yMin={yMin} yMax={yMax} />
            </div>

            <div className="flex flex-wrap gap-2">
              <button className="px-3 py-2 border rounded" onClick={() => setStep(3)}>Précédent</button>
              <button className={`px-3 py-2 border rounded ${canValidate() ? "" : "opacity-50 cursor-not-allowed"}`} disabled={!canValidate()} onClick={onValidate}>Valider & revenir aux visions</button>
              <button className="px-3 py-2 border rounded" onClick={backToRefinements}>Annuler</button>
              <button className="px-3 py-2 border rounded" onClick={backToProjects}>Choisir / créer un autre problème</button>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

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
function MiniChart({ series, unitY, unitX, yMin, yMax }: { series: number[]; unitY: string; unitX: string; yMin: number; yMax: number; }) {
  const W = 640, H = 260, PAD = 40;
  const safe = (series && series.length >= 2) ? series : [0, 0];
  let minY = yMin, maxY = yMax;
  if (maxY <= minY) maxY = minY + 1;
  const toX = (i: number) => PAD + (i * (W - 2 * PAD)) / (safe.length - 1 || 1);
  const toY = (v: number) => H - PAD - ((v - minY) * (H - 2 * PAD)) / (maxY - minY || 1);
  const d = safe.map((v, i) => `${i===0?"M":"L"} ${toX(i)},${toY(v)}`).join(" ");
  const yMid = (minY + maxY) / 2;
  const pathKey = `${safe[0]}-${safe[safe.length-1]}-${safe.length}-${minY}-${maxY}`;
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

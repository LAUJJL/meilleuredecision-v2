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
  type SliderKey,
  clearSelection,
} from "@/lib/rps_v3";

const DEFAULT_SPEC: Phase1Spec = {
  stockName: "",
  stockUnit: "",
  timeUnit: "mois",
  inflowName: "",
  outflowName: "",
  initialStockName: "",
  initialStockValue: 100,
  inflowValue: 10,
  outflowValue: 8,
  horizon: 60,
  sliderKeys: [],
  sliderMaxInflow: undefined,
  sliderMaxOutflow: undefined,
  sliderMaxInitial: undefined,
  derivedFlowUnit: "",
  derivedStockUnit: "",
};

function lsKey(visionId: string) {
  return `rps:phase1:ymax:${visionId}`;
}

export default function Phase1() {
  const s = getState();
  const project = s.projects.find(p => p.id === s.currentProjectId);
  const vision  = s.sequences.find(r => r.id === s.currentSequenceId);

  useEffect(() => { if (!project || !vision) window.location.href = "/projects"; }, [project, vision]);
  useEffect(() => { if (vision) ensurePhase1(vision.id); }, [vision]);

  const phases = useMemo(() => (vision ? listPhases(vision.id) : []), [vision]);
  const p0 = phases.find(p => p.idx === 0);
  const p1 = vision ? getPhase1(vision.id) : undefined;

  const [spec, setSpec] = useState<Phase1Spec>(DEFAULT_SPEC);

  // — Borne Max Y demandée au visiteur (persistée par vision dans localStorage)
  const [yMax, setYMax] = useState<number | null>(null);
  const [yMaxInput, setYMaxInput] = useState<string>("");

  // Charger le brouillon Phase1 + init yMax depuis localStorage (ou fallback 2×initial ou 100)
  useEffect(() => {
    if (p1?.draft && !p1.lockedAt) {
      try {
        const parsed = JSON.parse(p1.draft) as Phase1Spec;
        const merged = { ...DEFAULT_SPEC, ...parsed };
        setSpec(merged);
      } catch { setSpec(DEFAULT_SPEC); }
    } else {
      setSpec(DEFAULT_SPEC);
    }
  }, [p1?.draft, p1?.lockedAt]);

  useEffect(() => {
    if (!vision) return;
    // si localStorage a une valeur, on la prend ; sinon on calcule un défaut simple
    const saved = typeof window !== "undefined" ? window.localStorage.getItem(lsKey(vision.id)) : null;
    if (saved !== null) {
      const v = Number(saved);
      const safe = Number.isFinite(v) && v > 0 ? v : 100;
      setYMax(safe);
      setYMaxInput(String(safe));
    } else {
      const fallback = Math.max(100, (Number.isFinite(spec.initialStockValue) ? spec.initialStockValue : 0) * 2);
      setYMax(fallback);
      setYMaxInput(String(fallback));
    }
  }, [vision?.id, spec.initialStockValue]);

  if (!project || !vision || !p0 || !p1) return null;
  const locked = !!p1.lockedAt;

  const update = (patch: Partial<Phase1Spec>) => {
    const next = { ...spec, ...patch };
    next.derivedStockUnit = next.stockUnit || "";
    next.derivedFlowUnit  = next.stockUnit ? `${next.stockUnit} / ${next.timeUnit}` : "";
    setSpec(next);
    updatePhase1Draft(next);
  };

  const initBounds = (sp: Phase1Spec) => ({
    inflow:  Math.max(10, (sp.inflowValue  || 0) * 2),
    outflow: Math.max(10, (sp.outflowValue || 0) * 2),
    initial: Math.max(10, (sp.initialStockValue || 0) * 2),
  });

  const toggleSlider = (key: SliderKey) => {
    const set = new Set(spec.sliderKeys);
    const bounds = initBounds(spec);
    const patch: Partial<Phase1Spec> = {};
    if (set.has(key)) set.delete(key);
    else if (set.size < 2) {
      set.add(key);
      if (key === "inflow"  && !spec.sliderMaxInflow)  patch.sliderMaxInflow  = bounds.inflow;
      if (key === "outflow" && !spec.sliderMaxOutflow) patch.sliderMaxOutflow = bounds.outflow;
      if (key === "initial" && !spec.sliderMaxInitial) patch.sliderMaxInitial = bounds.initial;
    }
    update({ sliderKeys: Array.from(set) as SliderKey[], ...patch });
  };

  const canValidate = () =>
    !locked &&
    spec.stockName.trim() &&
    spec.stockUnit.trim() &&
    spec.inflowName.trim() &&
    spec.outflowName.trim() &&
    spec.initialStockName.trim();

  const onValidate = () => {
    if (!canValidate()) return;
    try { validatePhase1(); } catch {}
    window.location.href = "/refinements";
  };

  const backToProjects = () => {
    clearSelection();
    window.location.href = "/projects";
  };

  // Série (simulation)
  const series = useMemo(() => {
    const n = Math.max(1, Math.min(720, Math.round(Number(spec.horizon) || 0)));
    const arr: number[] = new Array(n + 1);
    const init = Number.isFinite(spec.initialStockValue) ? spec.initialStockValue : 0;
    const infl = Math.max(0, Number.isFinite(spec.inflowValue) ? spec.inflowValue : 0);
    const out  = Math.max(0, Number.isFinite(spec.outflowValue) ? spec.outflowValue : 0);
    arr[0] = init;
    for (let t = 1; t <= n; t++) arr[t] = arr[t - 1] + (infl - out);
    return arr;
  }, [spec.initialStockValue, spec.inflowValue, spec.outflowValue, spec.horizon]);

  const applyYMaxFromTop = () => {
    const v = Number(String(yMaxInput).replace(",", "."));
    if (!Number.isFinite(v) || v <= 0) return;
    setYMax(v);
    if (typeof window !== "undefined") window.localStorage.setItem(lsKey(vision.id), String(v));
  };

  const applyYMaxFromChart = () => {
    const v = Number(String(yMaxInput).replace(",", "."));
    if (!Number.isFinite(v) || v <= 0) return;
    setYMax(v);
    if (typeof window !== "undefined") window.localStorage.setItem(lsKey(vision.id), String(v));
  };

  return (
    <main className="min-h-screen grid place-items-center p-6">
      <div className="w-full max-w-4xl space-y-6">
        <h1 className="text-xl font-semibold text-center">Phase 1 — Stock + flux constants</h1>

        {/* Contexte */}
        <div className="rounded-lg border p-3 bg-gray-50 text-sm space-y-1">
          <div><span className="opacity-70">Problème :</span> {project.title}</div>
          <div><span className="opacity-70">Vision :</span> {vision.title}</div>
        </div>

        {/* Mémo Phase 0 */}
        <div className="rounded-lg border p-3 bg-white text-sm">
          <div className="opacity-70 mb-1">Définition de la vision :</div>
          <div className="whitespace-pre-wrap">{p0.content || "—"}</div>
        </div>

        {locked ? (
          <LockedView content={p1.content} />
        ) : (
          <div className="space-y-6">
            {/* 1) Paramètres textuels + Max Y demandé ici */}
            <section className="space-y-3">
              <h2 className="text-lg font-medium">Paramètres textuels</h2>
              <div className="grid gap-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <TextField label="Nom du stock" ph="Ex. Trésorerie" value={spec.stockName} onChange={v => update({ stockName: v })} />
                  {/* Borne Max Y demandée ici */}
                  <NumberInline
                    label={`Borne max du graphe (Max Y) ${spec.derivedStockUnit ? `(${spec.derivedStockUnit})` : ""}`}
                    value={yMaxInput}
                    onChange={setYMaxInput}
                    onApply={applyYMaxFromTop}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <TextField label="Unité du stock" ph="Ex. euros, habitants" value={spec.stockUnit} onChange={v => update({ stockUnit: v })} />
                  <SelectField label="Unité de temps (pas du modèle)" value={spec.timeUnit} onChange={v => update({ timeUnit: v as any })} options={TIME_UNITS as unknown as string[]} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <TextField label="Nom du flux d’entrée" ph="Ex. Recettes" value={spec.inflowName} onChange={v => update({ inflowName: v })} />
                  <TextField label="Nom du flux de sortie" ph="Ex. Dépenses" value={spec.outflowName} onChange={v => update({ outflowName: v })} />
                </div>

                <TextField label="Nom du stock de départ" ph="Ex. Trésorerie initiale" value={spec.initialStockName} onChange={v => update({ initialStockName: v })} />
              </div>
            </section>

            {/* 2) Valeurs numériques */}
            <section className="space-y-3">
              <h2 className="text-lg font-medium">Valeurs des constantes</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <NumberField label={`Valeur du stock de départ (${spec.initialStockName || "Stock de départ"})`} value={spec.initialStockValue} onChange={v => update({ initialStockValue: v })} />
                <NumberField label={`Flux d’entrée constant (${spec.inflowName || "Entrée"})`} value={spec.inflowValue} min={0} onChange={v => update({ inflowValue: Math.max(0, v) })} />
                <NumberField label={`Flux de sortie constant (${spec.outflowName || "Sortie"})`} value={spec.outflowValue} min={0} onChange={v => update({ outflowValue: Math.max(0, v) })} />
                <NumberField label={`Horizon (nombre de ${spec.timeUnit}s)`} value={spec.horizon} min={1} max={720} step={1} onChange={v => update({ horizon: Math.max(1, Math.min(720, Math.round(v))) })} />
              </div>
              <div className="text-xs opacity-70">
                Unités : flux = {spec.derivedFlowUnit || "—"} ; stock = {spec.derivedStockUnit || "—"}.
              </div>
            </section>

            {/* 3) Sliders (optionnels, max 2) */}
            <section className="space-y-2">
              <h2 className="text-lg font-medium">Sliders (optionnels, max 2)</h2>
              <div className="flex flex-wrap gap-3 text-sm">
                <Check label={spec.inflowName || "Flux d’entrée"} checked={spec.sliderKeys.includes("inflow")} onChange={() => toggleSlider("inflow")} />
                <Check label={spec.outflowName || "Flux de sortie"} checked={spec.sliderKeys.includes("outflow")} onChange={() => toggleSlider("outflow")} />
                <Check label={spec.initialStockName || "Stock de départ"} checked={spec.sliderKeys.includes("initial")} onChange={() => toggleSlider("initial")} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                {spec.sliderKeys.includes("inflow") && (
                  <NumberField label="Max slider entrée" value={spec.sliderMaxInflow ?? 100}
                    onChange={v => update({ sliderMaxInflow: Math.max(1, v) })} />
                )}
                {spec.sliderKeys.includes("outflow") && (
                  <NumberField label="Max slider sortie" value={spec.sliderMaxOutflow ?? 100}
                    onChange={v => update({ sliderMaxOutflow: Math.max(1, v) })} />
                )}
                {spec.sliderKeys.includes("initial") && (
                  <NumberField label="Max slider stock départ" value={spec.sliderMaxInitial ?? 100}
                    onChange={v => update({ sliderMaxInitial: Math.max(1, v) })} />
                )}
              </div>

              <div className="grid gap-3">
                {spec.sliderKeys.includes("inflow") && (
                  <RangeField label={`Slider ${spec.inflowName || "Entrée"} (${spec.derivedFlowUnit || "—"})`}
                    value={spec.inflowValue} min={0}
                    max={spec.sliderMaxInflow ?? 100}
                    step={Math.max(1, Math.round((spec.sliderMaxInflow ?? 100) / 50))}
                    onChange={v => update({ inflowValue: v })} />
                )}
                {spec.sliderKeys.includes("outflow") && (
                  <RangeField label={`Slider ${spec.outflowName || "Sortie"} (${spec.derivedFlowUnit || "—"})`}
                    value={spec.outflowValue} min={0}
                    max={spec.sliderMaxOutflow ?? 100}
                    step={Math.max(1, Math.round((spec.sliderMaxOutflow ?? 100) / 50))}
                    onChange={v => update({ outflowValue: v })} />
                )}
                {spec.sliderKeys.includes("initial") && (
                  <RangeField label={`Slider ${spec.initialStockName || "Stock de départ"} (${spec.derivedStockUnit || "—"})`}
                    value={spec.initialStockValue} min={0}
                    max={spec.sliderMaxInitial ?? 100}
                    step={Math.max(1, Math.round((spec.sliderMaxInitial ?? 100) / 50))}
                    onChange={v => update({ initialStockValue: v })} />
                )}
              </div>
            </section>

            {/* 4) Graphique + rappel/édition Max Y */}
            <section className="space-y-3">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <label className="inline-flex items-center gap-2">
                  <span className="opacity-70">
                    Max Y {spec.derivedStockUnit ? `(${spec.derivedStockUnit})` : ""}
                  </span>
                  <input
                    className="w-28 border rounded p-1"
                    type="number"
                    step="any"
                    value={yMaxInput}
                    onChange={e => setYMaxInput(e.target.value)}
                  />
                </label>
                <button className="px-2 py-1 border rounded" onClick={applyYMaxFromChart}>Appliquer</button>
                {yMax !== null && (
                  <span className="opacity-60 text-xs">[actuel : {Math.round(yMax * 100) / 100}]</span>
                )}
              </div>

              <h2 className="text-lg font-medium">Graphique du {spec.stockName || "stock"}</h2>
              <MiniChart
                series={series}
                unitY={spec.derivedStockUnit || ""}
                unitX={spec.timeUnit}
                yMax={yMax ?? 100}
              />
            </section>

            <div className="flex gap-3">
              <a href="/refinements" className="px-4 py-2 rounded-lg border">Visions</a>
              <button className={`px-4 py-2 rounded-lg border ${canValidate() ? "" : "opacity-50 cursor-not-allowed"}`} onClick={onValidate} disabled={!canValidate()}>
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

/* — Composants — */
function TextField({ label, ph, value, onChange }: { label: string; ph?: string; value: string; onChange: (v: string) => void; }) {
  return (
    <label className="block">
      <span className="text-sm">{label}</span>
      <input className="mt-1 w-full border rounded-lg p-2" placeholder={ph} value={value} onChange={e => onChange(e.target.value)} />
    </label>
  );
}
function NumberInline({ label, value, onChange, onApply }: { label: string; value: string; onChange: (v: string) => void; onApply: () => void; }) {
  return (
    <label className="block">
      <span className="text-sm">{label}</span>
      <div className="mt-1 flex items-center gap-2">
        <input className="w-40 border rounded-lg p-2" value={value} onChange={e => onChange(e.target.value)} />
        <button className="px-2 py-1 border rounded" onClick={onApply}>Appliquer</button>
      </div>
    </label>
  );
}
function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[]; }) {
  return (
    <label className="block">
      <span className="text-sm">{label}</span>
      <select className="mt-1 w-full border rounded-lg p-2" value={value} onChange={e => onChange(e.target.value)}>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
}
function NumberField({ label, value, onChange, min, max, step }: { label: string; value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number; }) {
  return (
    <label className="block">
      <span className="text-sm">{label}</span>
      <input type="number" className="mt-1 w-full border rounded-lg p-2" value={String(value)} min={min} max={max} step={step ?? 1} onChange={e => onChange(Number(e.target.value))} />
    </label>
  );
}
function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void; }) {
  return (
    <label className="inline-flex items-center gap-2">
      <input type="checkbox" checked={checked} onChange={onChange} />
      {label}
    </label>
  );
}
function RangeField({ label, value, onChange, min, max, step }: { label: string; value: number; onChange: (v: number) => void; min: number; max: number; step: number; }) {
  return (
    <label className="block">
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <span className="opacity-70">{Math.round(value * 1000) / 1000}</span>
      </div>
      <input type="range" className="w-full" min={min} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))} />
      <div className="flex justify-between text-xs opacity-60"><span>{min}</span><span>{max}</span></div>
    </label>
  );
}

/* — Mini graphe : Min auto, Max choisi par le visiteur — */
function MiniChart({
  series,
  unitY,
  unitX,
  yMax,
}: {
  series: number[];
  unitY: string;
  unitX: string;
  yMax: number; // borne haute imposée par le visiteur
}) {
  const W = 640, H = 260, PAD = 40;
  const safe = (series && series.length >= 2) ? series : [0, 0];

  // Min auto simple (avec petit coussin)
  let minY = Math.min(...safe);
  let maxY = yMax;
  if (minY === maxY) { minY -= 1; maxY += 1; }
  const padBottom = Math.max(1, (maxY - minY) * 0.05);
  minY = minY - padBottom;

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

function LockedView({ content }: { content?: string; }) {
  let spec: Phase1Spec = DEFAULT_SPEC;
  try { if (content) spec = { ...DEFAULT_SPEC, ...(JSON.parse(content) as Phase1Spec) }; } catch {}
  // En lecture seule, on n’édite pas la borne Max ; on affiche avec défaut 2×initial (ou 100)
  const defaultMax = Math.max(100, (Number.isFinite(spec.initialStockValue) ? spec.initialStockValue : 0) * 2);
  const series = (() => {
    const n = Math.max(1, Math.min(720, Math.round(Number(spec.horizon) || 0)));
    const arr: number[] = new Array(n + 1);
    arr[0] = Number.isFinite(spec.initialStockValue) ? spec.initialStockValue : 0;
    const infl = Math.max(0, Number.isFinite(spec.inflowValue) ? spec.inflowValue : 0);
    const out  = Math.max(0, Number.isFinite(spec.outflowValue) ? spec.outflowValue : 0);
    for (let t = 1; t <= n; t++) arr[t] = arr[t-1] + (infl - out);
    return arr;
  })();

  return (
    <div className="space-y-4">
      <div className="text-sm opacity-70">Cette phase est validée (lecture seule).</div>
      <div className="rounded-lg border p-3 bg-white text-sm">
        <div className="font-medium mb-2">Spécification Phase 1</div>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Stock</strong> : {spec.stockName} ({spec.derivedStockUnit || "—"})</li>
          <li><strong>Flux d’entrée</strong> : {spec.inflowName} ({spec.derivedFlowUnit || "—"}) = {spec.inflowValue}</li>
          <li><strong>Flux de sortie</strong> : {spec.outflowName} ({spec.derivedFlowUnit || "—"}) = {spec.outflowValue}</li>
          <li><strong>Stock de départ</strong> : {spec.initialStockName} ({spec.derivedStockUnit || "—"}) = {spec.initialStockValue}</li>
          <li><strong>Unité de temps</strong> : {spec.timeUnit}</li>
          <li><strong>Horizon</strong> : {spec.horizon}</li>
          <li><strong>Sliders</strong> : {spec.sliderKeys.join(", ") || "aucun"}</li>
        </ul>
      </div>
      <MiniChart series={series} unitY={spec.derivedStockUnit || ""} unitX={spec.timeUnit} yMax={defaultMax} />
    </div>
  );
}

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
  derivedFlowUnit: "",
  derivedStockUnit: "",
};

export default function Phase1() {
  const s = getState();
  const project = s.projects.find(p => p.id === s.currentProjectId);
  const vision  = s.sequences.find(r => r.id === s.currentSequenceId);

  useEffect(() => {
    if (!project || !vision) window.location.href = "/projects";
  }, [project, vision]);

  useEffect(() => { if (vision) ensurePhase1(vision.id); }, [vision]);

  const phases = useMemo(() => (vision ? listPhases(vision.id) : []), [vision]);
  const p0 = phases.find(p => p.idx === 0);
  const p1 = vision ? getPhase1(vision.id) : undefined;

  const [spec, setSpec] = useState<Phase1Spec>(DEFAULT_SPEC);

  useEffect(() => {
    if (p1?.draft && !p1.lockedAt) {
      try {
        const parsed = JSON.parse(p1.draft) as Phase1Spec;
        setSpec({ ...DEFAULT_SPEC, ...parsed });
      } catch {
        setSpec(DEFAULT_SPEC);
      }
    } else {
      setSpec(DEFAULT_SPEC);
    }
  }, [p1?.draft, p1?.lockedAt]);

  if (!project || !vision || !p0 || !p1) return null;

  const locked = !!p1.lockedAt;

  const update = (patch: Partial<Phase1Spec>) => {
    const next = { ...spec, ...patch };
    next.derivedStockUnit = next.stockUnit || "";
    next.derivedFlowUnit  = next.stockUnit ? `${next.stockUnit} / ${next.timeUnit}` : "";
    setSpec(next);
    updatePhase1Draft(next);
  };

  const toggleSlider = (key: SliderKey) => {
    const set = new Set(spec.sliderKeys);
    if (set.has(key)) set.delete(key);
    else if (set.size < 2) set.add(key);
    update({ sliderKeys: Array.from(set) as SliderKey[] });
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

  // Simulation sûre
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
          <LockedView content={p1.content} onBack={backToProjects} />
        ) : (
          <div className="space-y-6">
            {/* 1) Noms + unités */}
            <section className="space-y-3">
              <h2 className="text-lg font-medium">Paramètres textuels</h2>
              <div className="grid gap-3">
                <TextField label="Nom du stock" ph="Ex. Trésorerie" value={spec.stockName} onChange={v => update({ stockName: v })} />
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

            {/* 3) Sliders (max 2) */}
            <section className="space-y-2">
              <h2 className="text-lg font-medium">Sliders (optionnels, max 2)</h2>
              <div className="flex flex-wrap gap-3 text-sm">
                <Check label={spec.inflowName || "Flux d’entrée"} checked={spec.sliderKeys.includes("inflow")} onChange={() => toggleSlider("inflow")} />
                <Check label={spec.outflowName || "Flux de sortie"} checked={spec.sliderKeys.includes("outflow")} onChange={() => toggleSlider("outflow")} />
                <Check label={spec.initialStockName || "Stock de départ"} checked={spec.sliderKeys.includes("initial")} onChange={() => toggleSlider("initial")} />
              </div>

              <div className="grid gap-3">
                {spec.sliderKeys.includes("inflow") && (
                  <RangeField label={`Slider ${spec.inflowName || "Entrée"} (${spec.derivedFlowUnit || "—"})`}
                    value={spec.inflowValue} min={0} max={bestMax(spec.inflowValue)} step={Math.max(1, Math.round(bestMax(spec.inflowValue) / 50))}
                    onChange={v => update({ inflowValue: v })} />
                )}
                {spec.sliderKeys.includes("outflow") && (
                  <RangeField label={`Slider ${spec.outflowName || "Sortie"} (${spec.derivedFlowUnit || "—"})`}
                    value={spec.outflowValue} min={0} max={bestMax(spec.outflowValue)} step={Math.max(1, Math.round(bestMax(spec.outflowValue) / 50))}
                    onChange={v => update({ outflowValue: v })} />
                )}
                {spec.sliderKeys.includes("initial") && (
                  <RangeField label={`Slider ${spec.initialStockName || "Stock de départ"} (${spec.derivedStockUnit || "—"})`}
                    value={spec.initialStockValue} min={0} max={bestMax(spec.initialStockValue)} step={Math.max(1, Math.round(bestMax(spec.initialStockValue) / 50))}
                    onChange={v => update({ initialStockValue: v })} />
                )}
              </div>
            </section>

            {/* 4) Graphique */}
            <section className="space-y-2">
              <h2 className="text-lg font-medium">Graphique du {spec.stockName || "stock"}</h2>
              <MiniChart series={series} unitY={spec.derivedStockUnit || ""} unitX={spec.timeUnit} />
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
function bestMax(v: number) {
  const base = Math.max(1, Math.abs(v)) || 10;
  const m = Math.pow(10, Math.floor(Math.log10(base)));
  const k = Math.ceil(base / m);
  return (k * m) * 2;
}

/* Mini graphe SVG */
function MiniChart({ series, unitY, unitX }: { series: number[]; unitY: string; unitX: string; }) {
  const W = 640, H = 260, PAD = 40;
  const safe = (series && series.length >= 2) ? series : [0, 0];
  const minY = Math.min(...safe);
  const maxY = Math.max(...safe);
  const y0 = minY === maxY ? minY - 1 : minY;
  const y1 = minY === maxY ? maxY + 1 : maxY;

  const toX = (i: number) => PAD + (i * (W - 2 * PAD)) / (safe.length - 1 || 1);
  const toY = (v: number) => H - PAD - ((v - y0) * (H - 2 * PAD)) / (y1 - y0 || 1);
  const d = safe.map((v, i) => `${i === 0 ? "M" : "L"} ${toX(i)},${toY(v)}`).join(" ");

  const yMid = (y0 + y1) / 2;

  return (
    <svg width={W} height={H} className="border rounded-lg bg-white">
      <line x1={PAD} y1={H-PAD} x2={W-PAD} y2={H-PAD} stroke="#ccc" />
      <line x1={PAD} y1={PAD}   x2={PAD}   y2={H-PAD} stroke="#ccc" />
      {[y0, yMid, y1].map((v, idx) => (
        <g key={idx}>
          <line x1={PAD-4} y1={toY(v)} x2={W-PAD} y2={toY(v)} stroke="#eee" />
          <text x={8} y={toY(v)+4} fontSize="10" fill="#666">{Math.round(v*100)/100}</text>
        </g>
      ))}
      <path d={d} fill="none" stroke="#222" strokeWidth={2} />
      <text x={W/2} y={H-8} fontSize="11" fill="#666" textAnchor="middle">{unitX}</text>
      <text x={12} y={14} fontSize="11" fill="#666">{unitY}</text>
    </svg>
  );
}

function LockedView({ content, onBack }: { content?: string; onBack: () => void; }) {
  let spec: Phase1Spec = DEFAULT_SPEC;
  try { if (content) spec = { ...DEFAULT_SPEC, ...(JSON.parse(content) as Phase1Spec) }; } catch {}
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
      <ReadOnlyChart spec={spec} />
      <div className="flex gap-3">
        <a href="/refinements" className="px-4 py-2 rounded-lg border">Visions</a>
        <button className="px-4 py-2 rounded-lg border" onClick={onBack}>
          Choisir / créer un autre problème
        </button>
      </div>
    </div>
  );
}
function ReadOnlyChart({ spec }: { spec: Phase1Spec }) {
  const series = useMemo(() => {
    const n = Math.max(1, Math.min(720, Math.round(Number(spec.horizon) || 0)));
    const arr: number[] = new Array(n + 1);
    arr[0] = Number.isFinite(spec.initialStockValue) ? spec.initialStockValue : 0;
    const infl = Math.max(0, Number.isFinite(spec.inflowValue) ? spec.inflowValue : 0);
    const out  = Math.max(0, Number.isFinite(spec.outflowValue) ? spec.outflowValue : 0);
    for (let t = 1; t <= n; t++) arr[t] = arr[t-1] + (infl - out);
    return arr;
  }, [spec]);
  return <MiniChart series={series} unitY={spec.derivedStockUnit || ""} unitX={spec.timeUnit} />;
}

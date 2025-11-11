'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

type Vision = {
  id: number;
  name: string;
  shortDef?: string;
  phase1Done?: boolean;
  phase1?: {
    stockName: string;
    stockUnit: string;
    timeUnit: 'year' | 'month' | 'week' | 'day';
    horizon: number;
    initialStock: number;
    inflowName: string;
    inflowConstant: number;
    outflowName: string;
    outflowConstant: number;
    yMin: number;
    yMax: number;
  };
};

// Parsing “souple” : autorise '', '-' pendant la saisie
const toNumber = (s: string, fallback = 0) => {
  if (s === '' || s === '-' || s === '+') return fallback;
  const n = Number(s);
  return Number.isFinite(n) ? n : fallback;
};

export default function Phase1Page() {
  const router = useRouter();
  const [problemId, setProblemId] = useState<number | null>(null);
  const [vision, setVision] = useState<Vision | null>(null);

  // --- 1) Charger la vision sélectionnée ---
  useEffect(() => {
    const p = localStorage.getItem('currentProblem');
    const v = localStorage.getItem('currentVision');
    if (!p || !v) {
      router.push('/visions');
      return;
    }
    setProblemId(JSON.parse(p).id);
    setVision(JSON.parse(v));
  }, [router]);

  // --- 2) État du formulaire (strings pour éviter le “0 collant”) ---
  const [stockName, setStockName] = useState('Stock');
  const [stockUnit, setStockUnit] = useState('€');
  const [timeUnit, setTimeUnit] = useState<'year' | 'month' | 'week' | 'day'>('month');

  const [horizonStr, setHorizonStr] = useState('12');
  const [initialStockStr, setInitialStockStr] = useState('1000');

  const [inflowName, setInflowName] = useState('Recettes');
  const [inflowConstantStr, setInflowConstantStr] = useState('200');

  const [outflowName, setOutflowName] = useState('Dépenses');
  const [outflowConstantStr, setOutflowConstantStr] = useState('150');

  const [yMinStr, setYMinStr] = useState('0');
  const [yMaxStr, setYMaxStr] = useState('3000');

  // Charger d’éventuelles valeurs déjà saisies
  useEffect(() => {
    if (!vision?.phase1) return;
    const p1 = vision.phase1;
    setStockName(p1.stockName);
    setStockUnit(p1.stockUnit);
    setTimeUnit(p1.timeUnit);
    setHorizonStr(String(p1.horizon));
    setInitialStockStr(String(p1.initialStock));
    setInflowName(p1.inflowName);
    setInflowConstantStr(String(p1.inflowConstant));
    setOutflowName(p1.outflowName);
    setOutflowConstantStr(String(p1.outflowConstant));
    setYMinStr(String(p1.yMin));
    setYMaxStr(String(p1.yMax));
  }, [vision?.phase1]);

  // --- 3) Conversion numérique pour calcul/schéma ---
  const horizon = Math.max(1, Math.min(500, Math.floor(toNumber(horizonStr, 1))));
  const initialStock = toNumber(initialStockStr, 0);
  const inflowConstant = toNumber(inflowConstantStr, 0);
  const outflowConstant = toNumber(outflowConstantStr, 0);
  const yMin = toNumber(yMinStr, 0);
  const yMax = toNumber(yMaxStr, 1);

  // --- 4) Simulation simple ---
  const series = useMemo(() => {
    const n = Math.max(1, Math.min(500, horizon));
    const s: number[] = [];
    s.push(initialStock);
    const delta = inflowConstant - outflowConstant;
    let stop = false;

    for (let t = 0; t < n; t++) {
      if (stop) break;
      const next = (s[s.length - 1] ?? initialStock) + delta;
      // si on dépasse la fenêtre [yMin, yMax], on STOPPE la courbe
      if (next > Math.max(yMax, yMin) || next < Math.min(yMin, yMax)) {
        // on arrête sans ajouter ce point
        break;
      }
      s.push(next);
    }
    return s;
  }, [horizon, initialStock, inflowConstant, outflowConstant, yMin, yMax]);

  const ticks = useMemo(() => {
    const n = Math.min(series.length - 1, 24);
    const labels: string[] = [];
    for (let t = 0; t <= n; t++) labels.push(String(t));
    return labels;
  }, [series.length]);

  // --- 5) SVG Chart minimaliste (stop quand hors cadre) ---
  const Chart = () => {
    const W = 640;
    const H = 280;
    const PAD = 40;

    const n = series.length - 1;
    const xFor = (t: number) => {
      if (n <= 0) return PAD;
      return PAD + (t / n) * (W - 2 * PAD);
    };

    // Sécurise l'ordre min/max sans empêcher min négatif
    const yMinSafe = Math.min(yMin, yMax - 1e-9);
    const yMaxSafe = Math.max(yMax, yMin + 1e-9);

    const yFor = (val: number) => {
      const a = (val - yMinSafe) / (yMaxSafe - yMinSafe);
      const y = H - PAD - a * (H - 2 * PAD);
      return Math.max(PAD, Math.min(H - PAD, y));
    };

    let d = '';
    for (let t = 0; t < series.length; t++) {
      const val = series[t];
      // si le point actuel est hors cadre, on arrête (pas de tracé au-delà)
      if (val > yMaxSafe || val < yMinSafe) break;
      const x = xFor(t);
      const y = yFor(val);
      d += t === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
    }

    return (
      <svg width={W} height={H} style={{ border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff' }}>
        {/* Axes */}
        <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} stroke="#aaa" />
        <line x1={PAD} y1={PAD} x2={PAD} y2={H - PAD} stroke="#aaa" />

        {/* Graduation Y (min / max) */}
        <text x={4} y={yFor(yMaxSafe)} fontSize="10" fill="#555">{yMaxSafe.toFixed(0)} {stockUnit}</text>
        <text x={4} y={yFor(yMinSafe)} fontSize="10" fill="#555">{yMinSafe.toFixed(0)} {stockUnit}</text>

        {/* Graduation X */}
        {ticks.map((lab, i) => {
          const denom = Math.max(1, ticks.length - 1);
          const step = Math.max(1, Math.floor((series.length - 1) / denom));
          const t = Math.min(series.length - 1, i * step);
          const x = xFor(t);
          return (
            <g key={i}>
              <line x1={x} y1={H - PAD} x2={x} y2={H - PAD + 4} stroke="#aaa" />
              <text x={x} y={H - PAD + 14} fontSize="10" fill="#555" textAnchor="middle">{lab}</text>
            </g>
          );
        })}

        {/* courbe (arrêtée si sortie du cadre) */}
        {d && <path d={d} fill="none" stroke="#2563eb" strokeWidth={2} />}
      </svg>
    );
  };

  // --- 6) Sauvegarde Phase 1 + validation ---
  const savePhase1 = (markDone: boolean) => {
    if (!problemId || !vision) return;
    const all = JSON.parse(localStorage.getItem('visions') || '{}') as Record<number, Vision[]>;
    const list = all[problemId] || [];
    const idx = list.findIndex(v => v.id === vision.id);
    if (idx < 0) return;

    const updated: Vision = {
      ...list[idx],
      phase1Done: markDone ? true : !!list[idx].phase1Done,
      phase1: {
        stockName: stockName.trim() || 'Stock',
        stockUnit: stockUnit.trim() || '€',
        timeUnit,
        horizon,
        initialStock,
        inflowName: inflowName.trim() || 'Recettes',
        inflowConstant,
        outflowName: outflowName.trim() || 'Dépenses',
        outflowConstant,
        yMin,
        yMax,
      },
    };

    list[idx] = updated;
    all[problemId] = list;
    localStorage.setItem('visions', JSON.stringify(all));
    localStorage.setItem('currentVision', JSON.stringify(updated));
    setVision(updated);
    alert(markDone ? 'Phase 1 validée pour cette vision.' : 'Phase 1 enregistrée.');
  };

  if (!vision) return null;

  const timeUnitLabel: Record<typeof timeUnit, string> = {
    year: 'année',
    month: 'mois',
    week: 'semaine',
    day: 'jour',
  };

  return (
    <main style={{ padding: 40, maxWidth: 980, margin: '0 auto' }}>
      <nav style={{ marginBottom: 20 }}>
        <Link href="/">Accueil</Link> → <Link href="/visions">Visions</Link> → <b>Phase 1</b>
      </nav>

      <h2>Phase 1 — {vision.name}</h2>
      <p style={{ color: '#555' }}>
        Point de départ minimal : un <b>stock</b> et deux flux constants (<i>{inflowName}</i> / <i>{outflowName}</i>).  
        Ajustez les paramètres, observez le graphe, puis <b>validez</b> la phase 1.
      </p>

      {/* Paramètres */}
      <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 20 }}>
        <div>
          <label>Nom du stock</label>
          <input value={stockName} onChange={e => setStockName(e.target.value)} style={{ width: '100%' }} />
        </div>
        <div>
          <label>Unité du stock</label>
          <input value={stockUnit} onChange={e => setStockUnit(e.target.value)} style={{ width: '100%' }} />
        </div>

        <div>
          <label>Unité de temps</label>
          <select value={timeUnit} onChange={e => setTimeUnit(e.target.value as any)} style={{ width: '100%' }}>
            <option value="year">année</option>
            <option value="month">mois</option>
            <option value="week">semaine</option>
            <option value="day">jour</option>
          </select>
        </div>
        <div>
          <label>Horizon (nombre de {timeUnitLabel[timeUnit]}s)</label>
          <input
            type="text"
            inputMode="numeric"
            value={horizonStr}
            onChange={e => setHorizonStr(e.target.value)}
            style={{ width: '100%' }}
            placeholder="ex: 12"
          />
        </div>

        <div>
          <label>Valeur initiale du stock</label>
          <input
            type="text"
            inputMode="decimal"
            value={initialStockStr}
            onChange={e => setInitialStockStr(e.target.value)}
            style={{ width: '100%' }}
            placeholder="ex: 1000"
          />
        </div>
        <div></div>

        <div>
          <label>Nom du flux d’entrée</label>
          <input value={inflowName} onChange={e => setInflowName(e.target.value)} style={{ width: '100%' }} />
        </div>
        <div>
          <label>Constante d’entrée ({stockUnit}/{timeUnitLabel[timeUnit]})</label>
          <input
            type="text"
            inputMode="decimal"
            value={inflowConstantStr}
            onChange={e => setInflowConstantStr(e.target.value)}
            style={{ width: '100%' }}
            placeholder="ex: 200"
          />
        </div>

        <div>
          <label>Nom du flux de sortie</label>
          <input value={outflowName} onChange={e => setOutflowName(e.target.value)} style={{ width: '100%' }} />
        </div>
        <div>
          <label>Constante de sortie ({stockUnit}/{timeUnitLabel[timeUnit]})</label>
          <input
            type="text"
            inputMode="decimal"
            value={outflowConstantStr}
            onChange={e => setOutflowConstantStr(e.target.value)}
            style={{ width: '100%' }}
            placeholder="ex: 150"
          />
        </div>
      </section>

      {/* Graphe + bornes */}
      <section style={{ marginTop: 24 }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 8 }}>
          <b>Graphe du stock</b>
          <span style={{ color: '#555' }}>
            Axe Y : {stockUnit} — Axe X : {timeUnitLabel[timeUnit]} (0 → {horizon})
          </span>
        </div>

        <div style={{ display: 'flex', gap: 16, alignItems: 'center', margin: '8px 0 12px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            Y min
            <input
              type="text"
              inputMode="decimal"
              value={yMinStr}
              onChange={e => setYMinStr(e.target.value)}
              style={{ width: 120 }}
              placeholder="ex: -500"
            />
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            Y max
            <input
              type="text"
              inputMode="decimal"
              value={yMaxStr}
              onChange={e => setYMaxStr(e.target.value)}
              style={{ width: 120 }}
              placeholder="ex: 3000"
            />
          </label>
        </div>

        <Chart />
      </section>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
        <button onClick={() => savePhase1(false)}>Enregistrer (rester en Phase 1)</button>
        <button onClick={() => { savePhase1(true); router.push('/visions'); }}>
          Valider la phase 1
        </button>
        <button onClick={() => router.push('/visions')}>← Revenir aux visions</button>
        <Link href="/">Accueil</Link>
      </div>
    </main>
  );
}

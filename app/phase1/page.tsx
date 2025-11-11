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

  // --- 2) État du formulaire (avec valeurs par défaut raisonnables) ---
  const [stockName, setStockName] = useState('Stock');
  const [stockUnit, setStockUnit] = useState('€');
  const [timeUnit, setTimeUnit] = useState<'year' | 'month' | 'week' | 'day'>('month');
  const [horizon, setHorizon] = useState(12);
  const [initialStock, setInitialStock] = useState(1000);
  const [inflowName, setInflowName] = useState('Recettes');
  const [inflowConstant, setInflowConstant] = useState(200);
  const [outflowName, setOutflowName] = useState('Dépenses');
  const [outflowConstant, setOutflowConstant] = useState(150);
  const [yMin, setYMin] = useState(0);
  const [yMax, setYMax] = useState(3000);

  // Charger d’éventuelles valeurs déjà saisies
  useEffect(() => {
    if (!vision?.phase1) return;
    const p1 = vision.phase1;
    setStockName(p1.stockName);
    setStockUnit(p1.stockUnit);
    setTimeUnit(p1.timeUnit);
    setHorizon(p1.horizon);
    setInitialStock(p1.initialStock);
    setInflowName(p1.inflowName);
    setInflowConstant(p1.inflowConstant);
    setOutflowName(p1.outflowName);
    setOutflowConstant(p1.outflowConstant);
    setYMin(p1.yMin);
    setYMax(p1.yMax);
  }, [vision?.phase1]);

  // --- 3) Simulation simple (stock(t+1) = stock(t) + (inflow - outflow)) ---
  const series = useMemo(() => {
    const n = Math.max(1, Math.min(500, Math.floor(horizon))); // borne de sécurité
    const s: number[] = new Array(n + 1);
    s[0] = Number(initialStock) || 0;
    const delta = (Number(inflowConstant) || 0) - (Number(outflowConstant) || 0);
    for (let t = 0; t < n; t++) s[t + 1] = s[t] + delta;
    return s;
  }, [horizon, initialStock, inflowConstant, outflowConstant]);

  const ticks = useMemo(() => {
    const n = Math.min(series.length - 1, 24);
    const labels: string[] = [];
    for (let t = 0; t <= n; t++) {
      labels.push(String(t));
    }
    return labels;
  }, [series.length]);

  // --- 4) SVG Chart minimaliste ---
  const Chart = () => {
    const W = 640;
    const H = 280;
    const PAD = 40;

    const n = series.length - 1;
    const xFor = (t: number) => {
      if (n === 0) return PAD;
      return PAD + (t / n) * (W - 2 * PAD);
    };

    const yMinSafe = Math.min(yMin, yMax - 1); // éviter yMin >= yMax
    const yMaxSafe = Math.max(yMax, yMin + 1);

    const yFor = (val: number) => {
      const a = (val - yMinSafe) / (yMaxSafe - yMinSafe);
      const y = H - PAD - a * (H - 2 * PAD);
      return Math.max(PAD, Math.min(H - PAD, y));
    };

    // Trajectoire
    let d = '';
    series.forEach((val, t) => {
      const x = xFor(t);
      const y = yFor(val);
      d += t === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
    });

    // Axes
    return (
      <svg width={W} height={H} style={{ border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff' }}>
        {/* Axes */}
        <line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} stroke="#aaa" />
        <line x1={PAD} y1={PAD} x2={PAD} y2={H - PAD} stroke="#aaa" />

        {/* Graduation Y (min / max) */}
        <text x={4} y={yFor(yMaxSafe)} fontSize="10" fill="#555">{yMaxSafe.toFixed(0)} {stockUnit}</text>
        <text x={4} y={yFor(yMinSafe)} fontSize="10" fill="#555">{yMinSafe.toFixed(0)} {stockUnit}</text>

        {/* Graduation X (quelques ticks) */}
        {ticks.map((lab, i) => {
          const t = i * Math.max(1, Math.floor((series.length - 1) / Math.max(1, ticks.length - 1)));
          const x = xFor(t);
          return (
            <g key={i}>
              <line x1={x} y1={H - PAD} x2={x} y2={H - PAD + 4} stroke="#aaa" />
              <text x={x} y={H - PAD + 14} fontSize="10" fill="#555" textAnchor="middle">{lab}</text>
            </g>
          );
        })}

        {/* courbe */}
        <path d={d} fill="none" stroke="#2563eb" strokeWidth={2} />
      </svg>
    );
  };

  // --- 5) Sauvegarde Phase 1 + validation ---
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
        horizon: Math.max(1, Math.min(500, Math.floor(horizon))),
        initialStock: Number(initialStock) || 0,
        inflowName: inflowName.trim() || 'Recettes',
        inflowConstant: Number(inflowConstant) || 0,
        outflowName: outflowName.trim() || 'Dépenses',
        outflowConstant: Number(outflowConstant) || 0,
        yMin: Number(yMin),
        yMax: Number(yMax),
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
            type="number"
            min={1}
            max={500}
            value={horizon}
            onChange={e => setHorizon(Number(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>

        <div>
          <label>Valeur initiale du stock</label>
          <input
            type="number"
            value={initialStock}
            onChange={e => setInitialStock(Number(e.target.value))}
            style={{ width: '100%' }}
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
            type="number"
            value={inflowConstant}
            onChange={e => setInflowConstant(Number(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>

        <div>
          <label>Nom du flux de sortie</label>
          <input value={outflowName} onChange={e => setOutflowName(e.target.value)} style={{ width: '100%' }} />
        </div>
        <div>
          <label>Constante de sortie ({stockUnit}/{timeUnitLabel[timeUnit]})</label>
          <input
            type="number"
            value={outflowConstant}
            onChange={e => setOutflowConstant(Number(e.target.value))}
            style={{ width: '100%' }}
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
            <input type="number" value={yMin} onChange={e => setYMin(Number(e.target.value))} style={{ width: 120 }} />
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            Y max
            <input type="number" value={yMax} onChange={e => setYMax(Number(e.target.value))} style={{ width: 120 }} />
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

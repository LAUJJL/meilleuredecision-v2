// app/phase1/Phase1Client.tsx
"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Num = number;

function toNum(v: string | number): Num {
  const n = typeof v === "number" ? v : Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

function computeSeries(
  S0: Num, // stock initial
  inflow: Num, // entrée / pas
  outflow: Num, // sortie / pas
  horizon: number // nb de pas
): number[] {
  const arr: number[] = [];
  let S = S0;
  for (let t = 0; t <= horizon; t++) {
    arr.push(S);
    S = S + inflow - outflow;
  }
  return arr;
}

function LineChart({
  series,
  yMin,
  yMax,
  width = 820,
  height = 280,
}: {
  series: number[];
  yMin: number;
  yMax: number;
  width?: number;
  height?: number;
}) {
  // garde-fous
  const _yMin = Math.min(yMin, yMax - 1);
  const _yMax = Math.max(yMax, yMin + 1);

  const points = useMemo(() => {
    if (!series.length) return "";
    const n = series.length - 1;
    const pad = 30; // padding pour axes
    const W = width - pad * 2;
    const H = height - pad * 2;
    const x = (i: number) => pad + (i / n) * W;
    const y = (v: number) =>
      pad + (1 - (v - _yMin) / (_yMax - _yMin)) * H;

    return series.map((v, i) => `${x(i)},${y(v)}`).join(" ");
  }, [series, yMin, yMax, width, height]);

  return (
    <svg width={width} height={height} style={{ border: "1px solid #ddd" }}>
      {/* Axes simples */}
      <line x1={30} y1={10} x2={30} y2={height - 20} stroke="#888" />
      <line x1={30} y1={height - 20} x2={width - 10} y2={height - 20} stroke="#888" />
      {/* Graduations Y min/max */}
      <text x={4} y={height - 22} fontSize={12} fill="#555">
        {yMin}
      </text>
      <text x={4} y={14} fontSize={12} fill="#555">
        {yMax}
      </text>
      {/* Série */}
      {points && (
        <polyline fill="none" stroke="black" strokeWidth={2} points={points} />
      )}
    </svg>
  );
}

export default function Phase1Client() {
  const router = useRouter();

  // Champs minimaux (zones de saisie libres, non persistées)
  const [stockName, setStockName] = useState("Stock");
  const [unitStock, setUnitStock] = useState("€");
  const [unitTime, setUnitTime] = useState("mois");
  const [horizon, setHorizon] = useState<number>(12);

  const [S0, setS0] = useState<number>(1000);
  const [inName, setInName] = useState("Recettes");
  const [outName, setOutName] = useState("Dépenses");
  const [inConst, setInConst] = useState<number>(200);
  const [outConst, setOutConst] = useState<number>(150);

  const [yMin, setYMin] = useState<number>(0);
  const [yMax, setYMax] = useState<number>(3000);

  // Série calculée localement — rien n’est conservé si on quitte.
  const series = useMemo(
    () => computeSeries(S0, inConst, outConst, Math.max(1, horizon)),
    [S0, inConst, outConst, horizon]
  );

  return (
    <div>
      <nav style={{ marginBottom: 16, fontSize: 14 }}>
        <a href="/visions">← Revenir aux visions</a>
        <span style={{ margin: "0 8px" }}>•</span>
        <a href="/">Accueil</a>
      </nav>

      <h1 style={{ margin: "8px 0 16px" }}>Phase 1</h1>
      <p style={{ marginTop: 0 }}>
        Point de départ minimal : <strong>un stock</strong> et deux flux constants (
        <em>entrées/sorties</em>). Ajustez les paramètres, observez le graphe, puis
        passez à la phase 2.
      </p>

      <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <div>
          <h3>Stock</h3>
          <div style={{ display: "grid", gridTemplateColumns: "180px 1fr", rowGap: 10, columnGap: 12 }}>
            <label>Nom du stock</label>
            <input value={stockName} onChange={(e) => setStockName(e.target.value)} />

            <label>Unité du stock</label>
            <input value={unitStock} onChange={(e) => setUnitStock(e.target.value)} />

            <label>Unité de temps</label>
            <input value={unitTime} onChange={(e) => setUnitTime(e.target.value)} />

            <label>Horizon (nombre de {unitTime})</label>
            <input
              type="number"
              min={1}
              value={horizon}
              onChange={(e) => setHorizon(toNum(e.target.value))}
            />

            <label>Valeur initiale du stock</label>
            <input
              type="number"
              value={S0}
              onChange={(e) => setS0(toNum(e.target.value))}
            />
          </div>

          <h3 style={{ marginTop: 24 }}>Flux constants</h3>
          <div style={{ display: "grid", gridTemplateColumns: "180px 1fr", rowGap: 10, columnGap: 12 }}>
            <label>Nom du flux d’entrée</label>
            <input value={inName} onChange={(e) => setInName(e.target.value)} />

            <label>Constante d’entrée ({unitStock}/{unitTime})</label>
            <input
              type="number"
              value={inConst}
              onChange={(e) => setInConst(toNum(e.target.value))}
            />

            <label>Nom du flux de sortie</label>
            <input value={outName} onChange={(e) => setOutName(e.target.value)} />

            <label>Constante de sortie ({unitStock}/{unitTime})</label>
            <input
              type="number"
              value={outConst}
              onChange={(e) => setOutConst(toNum(e.target.value))}
            />
          </div>
        </div>

        <div>
          <h3>Graphe du stock</h3>
          <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", rowGap: 10, columnGap: 12 }}>
            <label>Y min</label>
            <input
              type="number"
              value={yMin}
              onChange={(e) => setYMin(toNum(e.target.value))}
            />
            <label>Y max</label>
            <input
              type="number"
              value={yMax}
              onChange={(e) => setYMax(toNum(e.target.value))}
            />
          </div>

          <div style={{ marginTop: 12 }}>
            <LineChart series={series} yMin={yMin} yMax={yMax} />
          </div>
        </div>
      </section>

      <div style={{ marginTop: 24, display: "flex", gap: 12 }}>
        <button
          onClick={() => router.push("/phase2")}
          style={{
            padding: "10px 14px",
            borderRadius: 6,
            border: "1px solid #bbb",
            background: "black",
            color: "white",
            cursor: "pointer",
          }}
          title="Valider la phase 1 et ouvrir la phase 2"
        >
          Passer à la phase 2
        </button>

        <a href="/visions" style={{ alignSelf: "center" }}>
          ← Revenir aux visions
        </a>
        <a href="/" style={{ alignSelf: "center", marginLeft: 8 }}>
          Accueil
        </a>
      </div>
    </div>
  );
}

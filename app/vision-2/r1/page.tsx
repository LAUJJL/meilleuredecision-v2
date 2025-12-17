"use client";

import { useMemo, useState } from "react";

function toInt(v: string, fallback: number) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

type Row = {
  t: number;
  debut: number;
  encaissements: number;
  decaissements: number;
  fin: number;
};

function buildTable(s0: number, enc: number, dec: number, horizon: number): Row[] {
  const h = Math.max(1, Math.min(120, horizon));
  const rows: Row[] = [];
  let debut = s0;

  for (let t = 1; t <= h; t++) {
    const fin = debut + enc - dec;
    rows.push({ t, debut, encaissements: enc, decaissements: dec, fin });
    debut = fin;
  }
  return rows;
}

export default function Vision2R1Page() {
  const [stockName, setStockName] = useState("Trésorerie");
  const [unit, setUnit] = useState("euros");

  const [horizon, setHorizon] = useState(12);
  const [s0, setS0] = useState(3000);

  // Valeurs libres / démonstratives : pas d’interprétation ici.
  const [encaissements, setEncaissements] = useState(0);
  const [decaissements, setDecaissements] = useState(0);

  const rows = useMemo(
    () => buildTable(s0, encaissements, decaissements, horizon),
    [s0, encaissements, decaissements, horizon]
  );

  const nextHref =
    `/vision-2/r2?` +
    `stockName=${encodeURIComponent(stockName)}` +
    `&unit=${encodeURIComponent(unit)}` +
    `&h=${horizon}` +
    `&s0=${s0}` +
    `&enc=${encaissements}` +
    `&dec=${decaissements}`;

  return (
    <main style={{ maxWidth: 980, margin: "48px auto", padding: 16 }}>
     
      <h1 style={{ fontSize: 30, marginBottom: 8 }}>Vision 2 — R1</h1>

      <p style={{ marginTop: 0, fontSize: 16, lineHeight: 1.6 }}>
        R1 pose une structure universelle : un stock, des encaissements, des décaissements, un horizon.
        À ce stade, les valeurs sont libres et démonstratives. Aucun objectif n’est introduit.
        <br />
        <strong>Convention :</strong> le stock affiché est le <strong>stock de début de période</strong>.
      </p>

      <section style={{ border: "1px solid #e5e5e5", borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <strong>Équation de base :</strong>{" "}
        <span>
          {stockName}_fin(t) = {stockName}_début(t) + Encaissements(t) − Décaissements(t)
        </span>
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 18 }}>
        <label>
          <div>Nom du stock</div>
          <input
            value={stockName}
            onChange={(e) => setStockName(e.target.value)}
            style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #ccc" }}
          />
        </label>

        <label>
          <div>Unité</div>
          <input
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #ccc" }}
          />
        </label>

        <label>
          <div>Horizon (nombre de périodes)</div>
          <input
            value={horizon}
            onChange={(e) => setHorizon(toInt(e.target.value, 12))}
            style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #ccc" }}
          />
        </label>

        <label>
          <div>Stock initial</div>
          <input
            value={s0}
            onChange={(e) => setS0(toInt(e.target.value, 3000))}
            style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #ccc" }}
          />
        </label>

        <label>
          <div>Encaissements (par période)</div>
          <input
            value={encaissements}
            onChange={(e) => setEncaissements(toInt(e.target.value, 0))}
            style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #ccc" }}
          />
        </label>

        <label>
          <div>Décaissements (par période)</div>
          <input
            value={decaissements}
            onChange={(e) => setDecaissements(toInt(e.target.value, 0))}
            style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #ccc" }}
          />
        </label>
      </section>

      <h2 style={{ fontSize: 18, marginBottom: 8 }}>Tableau</h2>
      <div style={{ overflowX: "auto", border: "1px solid #eee", borderRadius: 12 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 820 }}>
          <thead>
            <tr>
              {["Période", `${stockName} début`, "Encaissements", "Décaissements", `${stockName} fin`].map((h) => (
                <th key={h} style={{ textAlign: "left", padding: 10, borderBottom: "1px solid #eee" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {rows.map((r) => (
              <tr key={r.t}>
                <td style={{ padding: 10, borderBottom: "1px solid #f2f2f2" }}>{r.t}</td>
                <td style={{ padding: 10, borderBottom: "1px solid #f2f2f2" }}>
                  {r.debut} {unit}
                </td>
                <td style={{ padding: 10, borderBottom: "1px solid #f2f2f2" }}>{r.encaissements}</td>
                <td style={{ padding: 10, borderBottom: "1px solid #f2f2f2" }}>{r.decaissements}</td>
                <td style={{ padding: 10, borderBottom: "1px solid #f2f2f2" }}>
                  {r.fin} {unit}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: "flex", gap: 14, alignItems: "center", marginTop: 18 }}>
        <a
          href={nextHref}
          style={{ display: "inline-block", padding: "10px 14px", border: "1px solid #ccc", borderRadius: 10, textDecoration: "none" }}
        >
          Continuer (R2)
        </a>

        <a href="/vision-2" style={{ textDecoration: "none" }}>
          Retour
        </a>
      </div>
    </main>
  );
}

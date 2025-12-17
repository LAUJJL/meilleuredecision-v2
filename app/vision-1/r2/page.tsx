"use client";
<h1>Vision 2 — R2</h1>
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

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
  ecartObj: number; // objectif - stock_debut (comme décidé)
};

function buildTable(s0: number, enc: number, dec: number, h: number, objectif: number): Row[] {
  const horizon = Math.max(1, Math.min(120, h));
  const rows: Row[] = [];
  let debut = s0;

  for (let t = 1; t <= horizon; t++) {
    const ecartObj = objectif - debut; // déf : objectif - stock début
    const fin = debut + enc - dec;
    rows.push({ t, debut, encaissements: enc, decaissements: dec, fin, ecartObj });
    debut = fin;
  }
  return rows;
}

export default function Vision1R2Page() {
  const sp = useSearchParams();

  const stockName = sp.get("stockName") ?? "Trésorerie";
  const unit = sp.get("unit") ?? "euros";

  const h0 = toInt(sp.get("h") ?? "12", 12);
  const s00 = toInt(sp.get("s0") ?? "3000", 3000);

  // En R2 (Vision 1) : objectif + verdict, mais encaissements/décaissements restent au niveau "constantes" (pas salaire/dépenses perso).
  const [horizon, setHorizon] = useState(h0);
  const [s0, setS0] = useState(s00);

  // Valeurs d’hypothèse à ce stade (peuvent être libres/démonstratives)
  const [encaissements, setEncaissements] = useState(0);
  const [decaissements, setDecaissements] = useState(0);

  const [objectif, setObjectif] = useState(10000);

  const rows = useMemo(
    () => buildTable(s0, encaissements, decaissements, horizon, objectif),
    [s0, encaissements, decaissements, horizon, objectif]
  );

  const stockFinal = rows.length ? rows[rows.length - 1].fin : s0;
  const atteint = stockFinal >= objectif;

  const nextHref =
    `/vision-1/r3?` +
    `stockName=${encodeURIComponent(stockName)}` +
    `&unit=${encodeURIComponent(unit)}` +
    `&h=${horizon}` +
    `&s0=${s0}` +
    `&enc=${encaissements}` +
    `&dec=${decaissements}` +
    `&objectif=${objectif}`;

  return (
    <main style={{ maxWidth: 980, margin: "48px auto", padding: 16 }}>
      <h1 style={{ fontSize: 30, marginBottom: 8 }}>Vision 1 — R2</h1>
      <p style={{ marginTop: 0, fontSize: 16, lineHeight: 1.6 }}>
        R2 introduit l’objectif et permet un verdict <em>avec les hypothèses courantes</em> (encaissements/décaissements constants).
        La signification détaillée des encaissements et décaissements sera explicitée au raffinement suivant.
      </p>

      <section style={{ border: "1px solid #e5e5e5", borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <div>
          <strong>Équation :</strong>{" "}
          {stockName}_fin(t) = {stockName}_début(t) + Encaissements(t) − Décaissements(t)
        </div>
        <div style={{ marginTop: 8 }}>
          <strong>Écart objectif :</strong> écart(t) = Objectif − {stockName}_début(t)
        </div>
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 18 }}>
        <label>
          <div>Horizon (périodes)</div>
          <input
            value={horizon}
            onChange={(e) => setHorizon(toInt(e.target.value, h0))}
            style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #ccc" }}
          />
        </label>

        <label>
          <div>Stock initial</div>
          <input
            value={s0}
            onChange={(e) => setS0(toInt(e.target.value, s00))}
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

        <label>
          <div>Objectif minimal ({unit})</div>
          <input
            value={objectif}
            onChange={(e) => setObjectif(toInt(e.target.value, 10000))}
            style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #ccc" }}
          />
        </label>
      </section>

      <h2 style={{ fontSize: 18, marginBottom: 8 }}>Tableau</h2>
      <div style={{ overflowX: "auto", border: "1px solid #eee", borderRadius: 12 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 860 }}>
          <thead>
            <tr>
              {[
                "Période",
                `${stockName} début`,
                "Encaissements",
                "Décaissements",
                `${stockName} fin`,
                "Écart (Objectif − début)",
              ].map((h) => (
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
                <td style={{ padding: 10, borderBottom: "1px solid #f2f2f2" }}>
                  {r.ecartObj} {unit}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section style={{ marginTop: 16, padding: 16, borderRadius: 12, border: "1px solid #e5e5e5" }}>
        <div>
          <strong>{stockName} final :</strong> {stockFinal} {unit}
        </div>
        <div style={{ marginTop: 6 }}>
          <strong>Objectif :</strong> {objectif} {unit}
        </div>
        <div style={{ marginTop: 10 }}>
          <strong>Verdict (avec ces hypothèses) :</strong> {atteint ? "objectif atteint" : "objectif non atteint"}
        </div>
      </section>

      <div style={{ display: "flex", gap: 14, alignItems: "center", marginTop: 18 }}>
        <a
          href={nextHref}
          style={{
            display: "inline-block",
            padding: "10px 14px",
            border: "1px solid #ccc",
            borderRadius: 10,
            textDecoration: "none",
          }}
        >
          Continuer (R3)
        </a>
        <a href="/vision-2/r1" style={{ textDecoration: "none" }}>
          Retour (R1)
        </a>
      </div>
    </main>
  );
}

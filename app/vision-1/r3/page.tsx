"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

function toInt(v: string | null, fallback: number) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

type Row = {
  t: number;
  debut: number;
  salaire: number;
  encaissements: number;
  depPerso: number;
  decaissements: number;
  fin: number;
  ecartObj: number; // objectif - stock_debut
};

function buildTable(
  s0: number,
  salaire: number,
  depPerso: number,
  h: number,
  objectif: number
): Row[] {
  const horizon = Math.max(1, Math.min(120, h));
  const rows: Row[] = [];
  let debut = s0;

  for (let t = 1; t <= horizon; t++) {
    const encaissements = salaire;
    const decaissements = depPerso;
    const ecartObj = objectif - debut;
    const fin = debut + encaissements - decaissements;

    rows.push({ t, debut, salaire, encaissements, depPerso, decaissements, fin, ecartObj });
    debut = fin;
  }
  return rows;
}

export default function Vision1R3Page() {
  const sp = useSearchParams();

  const stockName = sp.get("stockName") ?? "Trésorerie";
  const unit = sp.get("unit") ?? "euros";

  const h = toInt(sp.get("h"), 12);
  const s0 = toInt(sp.get("s0"), 3000);

  // Valeurs issues de R2 (hypothèses globales) — on les utilise comme valeurs initiales,
  // puis on explicite leur signification en les décomposant (Vision 1 : salaire / dépenses perso).
  const enc0 = toInt(sp.get("enc"), 0);
  const dec0 = toInt(sp.get("dec"), 0);
  const objectif = toInt(sp.get("objectif"), 10000);

  // R3 : première fois où l’on NOMME le contenu des encaissements/décaissements
  const [salaire, setSalaire] = useState(enc0);     // Encaissements = Salaire (Vision 1)
  const [depPerso, setDepPerso] = useState(dec0);   // Décaissements = Dépenses personnelles (Vision 1)

  const rows = useMemo(() => buildTable(s0, salaire, depPerso, h, objectif), [s0, salaire, depPerso, h, objectif]);
  const stockFinal = rows.length ? rows[rows.length - 1].fin : s0;
  const atteint = stockFinal >= objectif;

  return (
    <main style={{ maxWidth: 980, margin: "48px auto", padding: 16 }}>
      <h1 style={{ fontSize: 30, marginBottom: 8 }}>Vision 1 — R3</h1>
      <p style={{ marginTop: 0, fontSize: 16, lineHeight: 1.6 }}>
        R3 explicite les équations et interprète les encaissements/décaissements dans cette vision.
      </p>

      <section style={{ border: "1px solid #e5e5e5", borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <div style={{ marginBottom: 8 }}><strong>Décomposition :</strong></div>
        <div>Encaissements(t) = Salaire(t)</div>
        <div>Décaissements(t) = Dépenses_personnelles(t)</div>

        <div style={{ marginTop: 12 }}><strong>Équation :</strong></div>
        <div>
          {stockName}_fin(t) = {stockName}_début(t) + Encaissements(t) − Décaissements(t)
        </div>

        <div style={{ marginTop: 12 }}><strong>Écart objectif :</strong></div>
        <div>écart(t) = Objectif − {stockName}_début(t)</div>
      </section>

      <section style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 18 }}>
        <label>
          <div>Salaire (par période)</div>
          <input
            value={salaire}
            onChange={(e) => setSalaire(Number.isFinite(Number(e.target.value)) ? Math.trunc(Number(e.target.value)) : salaire)}
            style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #ccc" }}
          />
        </label>

        <label>
          <div>Dépenses personnelles (par période)</div>
          <input
            value={depPerso}
            onChange={(e) => setDepPerso(Number.isFinite(Number(e.target.value)) ? Math.trunc(Number(e.target.value)) : depPerso)}
            style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #ccc" }}
          />
        </label>
      </section>

      <h2 style={{ fontSize: 18, marginBottom: 8 }}>Tableau</h2>
      <div style={{ overflowX: "auto", border: "1px solid #eee", borderRadius: 12 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 980 }}>
          <thead>
            <tr>
              {[
                "Période",
                `${stockName} début`,
                "Salaire",
                "Encaissements",
                "Dépenses personnelles",
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
                <td style={{ padding: 10, borderBottom: "1px solid #f2f2f2" }}>{r.salaire}</td>
                <td style={{ padding: 10, borderBottom: "1px solid #f2f2f2" }}>{r.encaissements}</td>
                <td style={{ padding: 10, borderBottom: "1px solid #f2f2f2" }}>{r.depPerso}</td>
                <td style={{ padding: 10, borderBottom: "1px solid #f2f2b2" }}>{r.decaissements}</td>
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
          <strong>Verdict :</strong> {atteint ? "objectif atteint" : "objectif non atteint"}
        </div>
      </section>

      <div style={{ display: "flex", gap: 14, alignItems: "center", marginTop: 18 }}>
        <a
          href="/vision-2"
          style={{ display: "inline-block", padding: "10px 14px", border: "1px solid #ccc", borderRadius: 10, textDecoration: "none" }}
        >
          Continuer (Vision 2)
        </a>

        <a href="/vision-1/r2" style={{ textDecoration: "none" }}>
          Retour (R2)
        </a>
      </div>
    </main>
  );
}

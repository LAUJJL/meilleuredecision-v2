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
  revenuAct: number;
  depPerso: number;
  depAct: number;
  encaissements: number;
  decaissements: number;
  fin: number;
  ecartObj: number; // Objectif - début
};

function buildTable(
  s0: number,
  salaire: number,
  revenuAct: number,
  depPerso: number,
  depAct: number,
  h: number,
  objectif: number
): Row[] {
  const horizon = Math.max(1, Math.min(120, h));
  const rows: Row[] = [];
  let debut = s0;

  for (let t = 1; t <= horizon; t++) {
    const encaissements = salaire + revenuAct;
    const decaissements = depPerso + depAct;
    const ecartObj = objectif - debut;
    const fin = debut + encaissements - decaissements;

    rows.push({
      t,
      debut,
      salaire,
      revenuAct,
      depPerso,
      depAct,
      encaissements,
      decaissements,
      fin,
      ecartObj,
    });

    debut = fin;
  }

  return rows;
}

export default function Vision2R3Page() {
  const sp = useSearchParams();

  const stockName = sp.get("stockName") ?? "Trésorerie";
  const unit = sp.get("unit") ?? "euros";

  const h = toInt(sp.get("h"), 12);
  const s0 = toInt(sp.get("s0"), 3000);

  // Valeurs venant de R2 (hypothèses globales) : utilisées comme point de départ.
  const enc0 = toInt(sp.get("enc"), 0);
  const dec0 = toInt(sp.get("dec"), 0);

  const objectif = toInt(sp.get("objectif"), 10000);

  // R3 : décomposition explicite (Vision 2)
  // Encaissements = Salaire + Revenu d’activité
  // Décaissements = Dépenses personnelles + Dépenses d’activité
  const [salaire, setSalaire] = useState(3000);
  const [revenuAct, setRevenuAct] = useState(Math.max(0, enc0 - 3000)); // petite astuce si enc0 est déjà renseigné
  const [depPerso, setDepPerso] = useState(2500);
  const [depAct, setDepAct] = useState(Math.max(0, dec0 - 2500)); // idem

  const rows = useMemo(
    () => buildTable(s0, salaire, revenuAct, depPerso, depAct, h, objectif),
    [s0, salaire, revenuAct, depPerso, depAct, h, objectif]
  );

  const stockFinal = rows.length ? rows[rows.length - 1].fin : s0;
  const atteint = stockFinal >= objectif;

  return (
    <main style={{ maxWidth: 1100, margin: "48px auto", padding: 16 }}>
      

      <h1 style={{ fontSize: 30, marginBottom: 8 }}>Vision 2 — R3</h1>

      <p style={{ marginTop: 0, fontSize: 16, lineHeight: 1.6 }}>
        R3 explicite la décomposition des encaissements et décaissements en intégrant la micro-activité.
        <br />
        <strong>Convention :</strong> le stock affiché est le <strong>stock de début de période</strong>.
      </p>

      <section style={{ border: "1px solid #e5e5e5", borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <div style={{ marginBottom: 8 }}><strong>Décomposition :</strong></div>
        <div>Encaissements(t) = Salaire(t) + Revenu_activité(t)</div>
        <div>Décaissements(t) = Dépenses_personnelles(t) + Dépenses_activité(t)</div>

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
            onChange={(e) => setSalaire(toInt(e.target.value, salaire))}
            style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #ccc" }}
          />
        </label>

        <label>
          <div>Revenu d’activité (par période)</div>
          <input
            value={revenuAct}
            onChange={(e) => setRevenuAct(toInt(e.target.value, revenuAct))}
            style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #ccc" }}
          />
        </label>

        <label>
          <div>Dépenses personnelles (par période)</div>
          <input
            value={depPerso}
            onChange={(e) => setDepPerso(toInt(e.target.value, depPerso))}
            style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #ccc" }}
          />
        </label>

        <label>
          <div>Dépenses d’activité (par période)</div>
          <input
            value={depAct}
            onChange={(e) => setDepAct(toInt(e.target.value, depAct))}
            style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #ccc" }}
          />
        </label>
      </section>

      <h2 style={{ fontSize: 18, marginBottom: 8 }}>Tableau</h2>
      <div style={{ overflowX: "auto", border: "1px solid #eee", borderRadius: 12 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 1060 }}>
          <thead>
            <tr>
              {[
                "Période",
                `${stockName} début`,
                "Salaire",
                "Revenu activité",
                "Encaissements",
                "Dépenses perso",
                "Dépenses activité",
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
                <td style={{ padding: 10, borderBottom: "1px solid #f2f2f2" }}>{r.revenuAct}</td>
                <td style={{ padding: 10, borderBottom: "1px solid #f2f2f2" }}>{r.encaissements}</td>
                <td style={{ padding: 10, borderBottom: "1px solid #f2f2f2" }}>{r.depPerso}</td>
                <td style={{ padding: 10, borderBottom: "1px solid #f2f2f2" }}>{r.depAct}</td>
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
          <strong>Verdict :</strong> {atteint ? "objectif atteint" : "objectif non atteint"}
        </div>
      </section>

      <div style={{ display: "flex", gap: 14, alignItems: "center", marginTop: 18 }}>
        <a
          href="/parcours?mode=preset"
          style={{ display: "inline-block", padding: "10px 14px", border: "1px solid #ccc", borderRadius: 10, textDecoration: "none" }}
        >
          Continuer (Vision 3)
        </a>

        <a href="/vision-2/r2" style={{ textDecoration: "none" }}>
          Retour (R2)
        </a>
      </div>
    </main>
  );
}

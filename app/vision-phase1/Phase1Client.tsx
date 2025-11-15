"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Phase1Qual = {
  stockName: string;
  initialStockName: string;
  stockUnit: string;
  timeUnit: string;
  inflowName: string;
  outflowName: string;
};

type Phase1Quant = {
  horizon: string; // stocké en string pour l’input
  initialStockValue: string;
  inflowValue: string;
  outflowValue: string;
};

type Phase1Data = {
  qual: Phase1Qual;
  quant: Phase1Quant;
};

function storageKey(visionId: string) {
  return `md_phase1_v1_${visionId}`;
}

export default function Phase1Client() {
  const router = useRouter();

  // Contexte : problème + vision
  const [problemName, setProblemName] = useState("");
  const [problemShort, setProblemShort] = useState("");
  const [visionId, setVisionId] = useState("");
  const [visionName, setVisionName] = useState("");
  const [visionShort, setVisionShort] = useState("");

  // Phase 1A (qualitative)
  const [qual, setQual] = useState<Phase1Qual>({
    stockName: "",
    initialStockName: "",
    stockUnit: "",
    timeUnit: "",
    inflowName: "",
    outflowName: "",
  });

  // Phase 1B (quantitative simple)
  const [quant, setQuant] = useState<Phase1Quant>({
    horizon: "",
    initialStockValue: "",
    inflowValue: "",
    outflowValue: "",
  });

  const [activeTab, setActiveTab] = useState<"qual" | "quant">("qual");

  // Charger contexte + données de phase 1
  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);

    const pName = params.get("problemName") ?? "";
    const pShort = params.get("problemShort") ?? "";
    const vId = params.get("visionId") ?? "";
    const vName = params.get("visionName") ?? "";
    const vShort = params.get("visionShort") ?? "";

    setProblemName(pName);
    setProblemShort(pShort);
    setVisionId(vId);
    setVisionName(vName);
    setVisionShort(vShort);

    if (!vId) return;

    try {
      const raw = window.localStorage.getItem(storageKey(vId));
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<Phase1Data>;
      if (parsed.qual) {
        setQual((prev) => ({ ...prev, ...parsed.qual }));
      }
      if (parsed.quant) {
        setQuant((prev) => ({ ...prev, ...parsed.quant }));
      }
    } catch (e) {
      console.error("Erreur de lecture des données de phase 1 :", e);
    }
  }, []);

  // Sauvegarde automatique
  useEffect(() => {
    if (!visionId || typeof window === "undefined") return;

    const payload: Phase1Data = {
      qual,
      quant,
    };

    try {
      window.localStorage.setItem(storageKey(visionId), JSON.stringify(payload));
    } catch (e) {
      console.error("Erreur d’enregistrement de la phase 1 :", e);
    }
  }, [visionId, qual, quant]);

  function goBackToVision() {
    const params = new URLSearchParams({
      problemName,
      problemShort,
      visionId,
      visionName,
      visionShort,
    });
    router.push(`/vision?${params.toString()}`);
  }

  // Calcul de la série du stock (tableau)
  const stockSeries = useMemo(() => {
    const horizonNum = parseInt(quant.horizon, 10);
    const initial = parseFloat(quant.initialStockValue);
    const inflow = parseFloat(quant.inflowValue);
    const outflow = parseFloat(quant.outflowValue);

    if (
      !Number.isFinite(horizonNum) ||
      horizonNum <= 0 ||
      !Number.isFinite(initial) ||
      !Number.isFinite(inflow) ||
      !Number.isFinite(outflow)
    ) {
      return null;
    }

    const series: { t: number; value: number }[] = [];
    let current = initial;
    series.push({ t: 0, value: current });

    for (let i = 1; i <= horizonNum; i++) {
      current = current + inflow - outflow;
      series.push({ t: i, value: current });
    }

    return series;
  }, [quant.horizon, quant.initialStockValue, quant.inflowValue, quant.outflowValue]);

  return (
    <main style={{ maxWidth: 900, margin: "32px auto", padding: "0 16px" }}>
      <button
        onClick={goBackToVision}
        style={{
          marginBottom: 16,
          padding: "6px 12px",
          borderRadius: 4,
          border: "1px solid #9ca3af",
          backgroundColor: "white",
          cursor: "pointer",
        }}
      >
        ← Revenir à la définition initiale de cette vision
      </button>

      <h1>Phase 1 – Premier raffinement de la vision</h1>

      {/* Contexte : problème + vision */}
      <section style={{ marginTop: 16, marginBottom: 24 }}>
        <h2>Contexte</h2>

        <p>
          <strong>Problème :</strong> {problemName || "(problème inconnu)"}
        </p>
        {problemShort && (
          <p>
            <strong>Définition courte du problème :</strong> {problemShort}
          </p>
        )}

        <p style={{ marginTop: 12 }}>
          <strong>Vision :</strong> {visionName || "(vision inconnue)"}
        </p>
        {visionShort && (
          <p>
            <strong>Définition courte de la vision :</strong> {visionShort}
          </p>
        )}
      </section>

      {/* Sélecteur 1A / 1B */}
      <section style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => setActiveTab("qual")}
            style={{
              padding: "8px 16px",
              borderRadius: 6,
              border:
                activeTab === "qual" ? "2px solid #2563eb" : "1px solid #d1d5db",
              backgroundColor: activeTab === "qual" ? "#eff6ff" : "white",
              cursor: "pointer",
              fontWeight: activeTab === "qual" ? 600 : 400,
            }}
          >
            Partie qualitative (1A)
          </button>
          <button
            onClick={() => setActiveTab("quant")}
            style={{
              padding: "8px 16px",
              border:
                activeTab === "quant" ? "2px solid #2563eb" : "1px solid #d1d5db",
              borderRadius: 6,
              backgroundColor: activeTab === "quant" ? "#eff6ff" : "white",
              cursor: "pointer",
              fontWeight: activeTab === "quant" ? 600 : 400,
            }}
          >
            Partie quantitative simple (1B)
          </button>
        </div>
      </section>

      {activeTab === "qual" ? (
        // Phase 1A – Qualitative
        <section
          style={{
            border: "1px solid #ddd",
            borderRadius: 8,
            padding: 24,
            marginBottom: 32,
          }}
        >
          <h2>Phase 1A – Structure qualitative du stock et des flux</h2>

          <p style={{ fontSize: 14, color: "#4b5563", marginTop: 8 }}>
            Vous choisissez ici comment représenter votre système : stock, unité,
            temps, flux d’entrée et de sortie. Tout cela reste modifiable tant
            que vous ne passez pas aux phases suivantes.
          </p>

          <div style={{ marginTop: 16 }}>
            <label
              htmlFor="stock-name"
              style={{ display: "block", fontWeight: 600, marginBottom: 4 }}
            >
              Nom du stock
            </label>
            <input
              id="stock-name"
              type="text"
              value={qual.stockName}
              onChange={(e) =>
                setQual((prev) => ({ ...prev, stockName: e.target.value }))
              }
              placeholder="Ex : Trésorerie disponible"
              style={{
                width: "100%",
                padding: 8,
                borderRadius: 4,
                border: "1px solid #ccc",
              }}
            />
          </div>

          <div style={{ marginTop: 12 }}>
            <label
              htmlFor="initial-stock-name"
              style={{ display: "block", fontWeight: 600, marginBottom: 4 }}
            >
              Nom du stock de départ
            </label>
            <input
              id="initial-stock-name"
              type="text"
              value={qual.initialStockName}
              onChange={(e) =>
                setQual((prev) => ({
                  ...prev,
                  initialStockName: e.target.value,
                }))
              }
              placeholder="Ex : Trésorerie au lancement du plan"
              style={{
                width: "100%",
                padding: 8,
                borderRadius: 4,
                border: "1px solid #ccc",
              }}
            />
          </div>

          <div style={{ marginTop: 12 }}>
            <label
              htmlFor="stock-unit"
              style={{ display: "block", fontWeight: 600, marginBottom: 4 }}
            >
              Unité du stock
            </label>
            <input
              id="stock-unit"
              type="text"
              value={qual.stockUnit}
              onChange={(e) =>
                setQual((prev) => ({ ...prev, stockUnit: e.target.value }))
              }
              placeholder="Ex : euros, personnes, points..."
              style={{
                width: "100%",
                padding: 8,
                borderRadius: 4,
                border: "1px solid #ccc",
              }}
            />
          </div>

          <div style={{ marginTop: 12 }}>
            <label
              htmlFor="time-unit"
              style={{ display: "block", fontWeight: 600, marginBottom: 4 }}
            >
              Unité de temps
            </label>
            <input
              id="time-unit"
              type="text"
              value={qual.timeUnit}
              onChange={(e) =>
                setQual((prev) => ({ ...prev, timeUnit: e.target.value }))
              }
              placeholder="Ex : mois, années..."
              style={{
                width: "100%",
                padding: 8,
                borderRadius: 4,
                border: "1px solid #ccc",
              }}
            />
          </div>

          <div style={{ marginTop: 12 }}>
            <label
              htmlFor="inflow-name"
              style={{ display: "block", fontWeight: 600, marginBottom: 4 }}
            >
              Nom du flux d’entrée
            </label>
            <input
              id="inflow-name"
              type="text"
              value={qual.inflowName}
              onChange={(e) =>
                setQual((prev) => ({ ...prev, inflowName: e.target.value }))
              }
              placeholder="Ex : Encaissements mensuels"
              style={{
                width: "100%",
                padding: 8,
                borderRadius: 4,
                border: "1px solid #ccc",
              }}
            />
          </div>

          <div style={{ marginTop: 12 }}>
            <label
              htmlFor="outflow-name"
              style={{ display: "block", fontWeight: 600, marginBottom: 4 }}
            >
              Nom du flux de sortie
            </label>
            <input
              id="outflow-name"
              type="text"
              value={qual.outflowName}
              onChange={(e) =>
                setQual((prev) => ({ ...prev, outflowName: e.target.value }))
              }
              placeholder="Ex : Décaissements mensuels"
              style={{
                width: "100%",
                padding: 8,
                borderRadius: 4,
                border: "1px solid #ccc",
              }}
            />
          </div>
        </section>
      ) : (
        // Phase 1B – Quantitative simple
        <section
          style={{
            border: "1px solid #ddd",
            borderRadius: 8,
            padding: 24,
            marginBottom: 32,
          }}
        >
          <h2>Phase 1B – Paramètres quantitatifs simples</h2>

          <p style={{ fontSize: 14, color: "#4b5563", marginTop: 8 }}>
            Vous choisissez des valeurs simples (flux constants) pour expérimenter
            le comportement du stock au cours du temps. L’objectif est de
            comprendre le rôle du stock et des flux, pas de décrire toute la
            réalité.
          </p>

          <div style={{ marginTop: 16 }}>
            <label
              htmlFor="horizon"
              style={{ display: "block", fontWeight: 600, marginBottom: 4 }}
            >
              Horizon (nombre de pas de temps)
            </label>
            <input
              id="horizon"
              type="number"
              min={1}
              step={1}
              value={quant.horizon}
              onChange={(e) =>
                setQuant((prev) => ({ ...prev, horizon: e.target.value }))
              }
              placeholder="Ex : 24"
              style={{
                width: "100%",
                padding: 8,
                borderRadius: 4,
                border: "1px solid #ccc",
              }}
            />
          </div>

          <div style={{ marginTop: 12 }}>
            <label
              htmlFor="initial-stock-value"
              style={{ display: "block", fontWeight: 600, marginBottom: 4 }}
            >
              Valeur initiale du stock
              {qual.stockUnit ? ` (en ${qual.stockUnit})` : ""}
            </label>
            <input
              id="initial-stock-value"
              type="number"
              value={quant.initialStockValue}
              onChange={(e) =>
                setQuant((prev) => ({
                  ...prev,
                  initialStockValue: e.target.value,
                }))
              }
              placeholder="Ex : 50000"
              style={{
                width: "100%",
                padding: 8,
                borderRadius: 4,
                border: "1px solid #ccc",
              }}
            />
          </div>

          <div style={{ marginTop: 12 }}>
            <label
              htmlFor="inflow-value"
              style={{ display: "block", fontWeight: 600, marginBottom: 4 }}
            >
              Flux d’entrée constant par pas de temps
              {qual.stockUnit && qual.timeUnit
                ? ` (en ${qual.stockUnit} par ${qual.timeUnit})`
                : ""}
            </label>
            <input
              id="inflow-value"
              type="number"
              value={quant.inflowValue}
              onChange={(e) =>
                setQuant((prev) => ({ ...prev, inflowValue: e.target.value }))
              }
              placeholder="Ex : 10000"
              style={{
                width: "100%",
                padding: 8,
                borderRadius: 4,
                border: "1px solid #ccc",
              }}
            />
          </div>

          <div style={{ marginTop: 12 }}>
            <label
              htmlFor="outflow-value"
              style={{ display: "block", fontWeight: 600, marginBottom: 4 }}
            >
              Flux de sortie constant par pas de temps
              {qual.stockUnit && qual.timeUnit
                ? ` (en ${qual.stockUnit} par ${qual.timeUnit})`
                : ""}
            </label>
            <input
              id="outflow-value"
              type="number"
              value={quant.outflowValue}
              onChange={(e) =>
                setQuant((prev) => ({ ...prev, outflowValue: e.target.value }))
              }
              placeholder="Ex : 8000"
              style={{
                width: "100%",
                padding: 8,
                borderRadius: 4,
                border: "1px solid #ccc",
              }}
            />
          </div>

          <div style={{ marginTop: 24 }}>
            <h3>Évolution du stock (tableau)</h3>

            {!stockSeries ? (
              <p style={{ marginTop: 8, fontSize: 14, color: "#6b7280" }}>
                Saisissez un horizon, une valeur initiale du stock, un flux
                d’entrée et un flux de sortie pour voir l’évolution du stock.
              </p>
            ) : (
              <div style={{ marginTop: 12, overflowX: "auto" }}>
                <table
                  style={{
                    borderCollapse: "collapse",
                    width: "100%",
                    minWidth: 320,
                  }}
                >
                  <thead>
                    <tr>
                      <th
                        style={{
                          border: "1px solid #e5e7eb",
                          padding: "4px 8px",
                          textAlign: "left",
                        }}
                      >
                        Pas de temps
                        {qual.timeUnit ? ` (${qual.timeUnit})` : ""}
                      </th>
                      <th
                        style={{
                          border: "1px solid #e5e7eb",
                          padding: "4px 8px",
                          textAlign: "left",
                        }}
                      >
                        Valeur du stock
                        {qual.stockUnit ? ` (${qual.stockUnit})` : ""}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {stockSeries.map((point) => (
                      <tr key={point.t}>
                        <td
                          style={{
                            border: "1px solid #e5e7eb",
                            padding: "4px 8px",
                          }}
                        >
                          {point.t}
                        </td>
                        <td
                          style={{
                            border: "1px solid #e5e7eb",
                            padding: "4px 8px",
                          }}
                        >
                          {point.value.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      )}
    </main>
  );
}

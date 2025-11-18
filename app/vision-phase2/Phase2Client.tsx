"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type ExplorationData = {
  timeUnit: string;
  horizon: string;
  initialStock: string;
  inflow: string;
  outflow: string;
};

type StockRow = {
  t: number;
  stock: number;
  inflow: number;
  outflow: number;
  delta: number;
};

export default function Phase2Client() {
  const router = useRouter();

  // Contexte problème + vision (transmis dans l'URL)
  const [problemName, setProblemName] = useState("");
  const [problemShort, setProblemShort] = useState("");
  const [visionId, setVisionId] = useState("");
  const [visionName, setVisionName] = useState("");
  const [visionShort, setVisionShort] = useState("");

  // Données d'exploration du raffinement 2
  const [data, setData] = useState<ExplorationData>({
    timeUnit: "",
    horizon: "",
    initialStock: "",
    inflow: "",
    outflow: "",
  });

  // Clé de stockage local pour ce raffinement
  function storageKey(vId: string) {
    return `md_phase2_exploration_${vId}`;
  }

  // Charger contexte + données d'exploration
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
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<ExplorationData>;
        setData((prev) => ({ ...prev, ...parsed }));
      }
    } catch (e) {
      console.error("Erreur de chargement des données de la phase 2 :", e);
    }
  }, []);

  // Sauvegarde automatique pour le confort du visiteur
  useEffect(() => {
    if (!visionId || typeof window === "undefined") return;
    try {
      window.localStorage.setItem(storageKey(visionId), JSON.stringify(data));
    } catch (e) {
      console.error("Erreur d’enregistrement des données de la phase 2 :", e);
    }
  }, [visionId, data]);

  function goBackToPhase1() {
    const params = new URLSearchParams({
      problemName,
      problemShort,
      visionId,
      visionName,
      visionShort,
    });
    router.push(`/vision-phase1?${params.toString()}`);
  }

  // Calcul du tableau d'évolution
  const rows: StockRow[] | null = useMemo(() => {
    const horizon = parseInt(data.horizon, 10);
    const initial = parseFloat(data.initialStock);
    const inflow = parseFloat(data.inflow);
    const outflow = parseFloat(data.outflow);

    if (
      !Number.isFinite(horizon) ||
      horizon <= 0 ||
      !Number.isFinite(initial) ||
      !Number.isFinite(inflow) ||
      !Number.isFinite(outflow)
    ) {
      return null;
    }

    const result: StockRow[] = [];
    let current = initial;

    result.push({
      t: 0,
      stock: current,
      inflow: inflow,
      outflow: outflow,
      delta: inflow - outflow,
    });

    for (let t = 1; t <= horizon; t++) {
      current = current + inflow - outflow;
      result.push({
        t,
        stock: current,
        inflow: inflow,
        outflow: outflow,
        delta: inflow - outflow,
      });
    }

    return result;
  }, [data.horizon, data.initialStock, data.inflow, data.outflow]);

  const canShowTable =
    !!data.timeUnit.trim() &&
    !!data.horizon.trim() &&
    !!data.initialStock.trim() &&
    !!data.inflow.trim() &&
    !!data.outflow.trim() &&
    rows !== null;

  return (
    <main style={{ maxWidth: 900, margin: "32px auto", padding: "0 16px" }}>
      <button
        onClick={goBackToPhase1}
        style={{
          marginBottom: 16,
          padding: "6px 12px",
          borderRadius: 4,
          border: "1px solid #9ca3af",
          backgroundColor: "white",
          cursor: "pointer",
        }}
      >
        ← Revenir au premier raffinement
      </button>

      <h1>Raffinement 2 – Choisir l’unité de temps et l’horizon</h1>

      <p
        style={{
          padding: "8px 12px",
          borderRadius: 6,
          backgroundColor: "#eff6ff",
          border: "1px solid #bfdbfe",
          marginTop: 12,
          marginBottom: 16,
          fontSize: 14,
        }}
      >
        Ce raffinement sert à explorer différentes unités de temps et horizons.
        Les valeurs que vous entrez ici (stock de départ et flux) servent
        uniquement à tester des scénarios. Elles ne seront pas conservées comme
        définitives pour les raffinements suivants.
      </p>

      {/* Contexte */}
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

        <p style={{ marginTop: 8 }}>
          <strong>Vision :</strong> {visionName || "(vision inconnue)"}
        </p>
        {visionShort && (
          <p>
            <strong>Définition courte de la vision :</strong> {visionShort}
          </p>
        )}
      </section>

      {/* Formulaire d'exploration */}
      <section
        style={{
          border: "1px solid #ddd",
          borderRadius: 8,
          padding: 24,
          marginBottom: 32,
        }}
      >
        <h2>Paramètres d’exploration</h2>

        <p style={{ fontSize: 14, color: "#4b5563", marginTop: 8 }}>
          Choisissez une unité de temps, un horizon (nombre de périodes) et des
          valeurs provisoires pour le stock de départ et les flux constants.
          Vous pourrez modifier ces valeurs autant de fois que vous le
          souhaitez pour voir comment le stock évolue.
        </p>

        {/* Unité de temps */}
        <div style={{ marginTop: 16 }}>
          <label
            htmlFor="timeUnit"
            style={{ display: "block", fontWeight: 600, marginBottom: 4 }}
          >
            Unité de temps
          </label>
          <input
            id="timeUnit"
            type="text"
            value={data.timeUnit}
            onChange={(e) =>
              setData((prev) => ({ ...prev, timeUnit: e.target.value }))
            }
            placeholder="Ex : mois, années…"
            style={{
              width: "100%",
              padding: 8,
              borderRadius: 4,
              border: "1px solid #ccc",
            }}
          />
        </div>

        {/* Horizon */}
        <div style={{ marginTop: 12 }}>
          <label
            htmlFor="horizon"
            style={{ display: "block", fontWeight: 600, marginBottom: 4 }}
          >
            Horizon (nombre de périodes)
          </label>
          <input
            id="horizon"
            type="number"
            value={data.horizon}
            onChange={(e) =>
              setData((prev) => ({ ...prev, horizon: e.target.value }))
            }
            placeholder="Ex : 12"
            style={{
              width: "100%",
              padding: 8,
              borderRadius: 4,
              border: "1px solid #ccc",
            }}
          />
        </div>

        {/* Stock initial */}
        <div style={{ marginTop: 12 }}>
          <label
            htmlFor="initialStock"
            style={{ display: "block", fontWeight: 600, marginBottom: 4 }}
          >
            Valeur provisoire du stock de départ
          </label>
          <input
            id="initialStock"
            type="number"
            value={data.initialStock}
            onChange={(e) =>
              setData((prev) => ({ ...prev, initialStock: e.target.value }))
            }
            placeholder="Ex : 3000"
            style={{
              width: "100%",
              padding: 8,
              borderRadius: 4,
              border: "1px solid #ccc",
            }}
          />
        </div>

        {/* Flux d'entrée */}
        <div style={{ marginTop: 12 }}>
          <label
            htmlFor="inflow"
            style={{ display: "block", fontWeight: 600, marginBottom: 4 }}
          >
            Flux d’entrée constant par période (provisoire)
          </label>
          <input
            id="inflow"
            type="number"
            value={data.inflow}
            onChange={(e) =>
              setData((prev) => ({ ...prev, inflow: e.target.value }))
            }
            placeholder="Ex : 3000"
            style={{
              width: "100%",
              padding: 8,
              borderRadius: 4,
              border: "1px solid #ccc",
            }}
          />
        </div>

        {/* Flux de sortie */}
        <div style={{ marginTop: 12 }}>
          <label
            htmlFor="outflow"
            style={{ display: "block", fontWeight: 600, marginBottom: 4 }}
          >
            Flux de sortie constant par période (provisoire)
          </label>
          <input
            id="outflow"
            type="number"
            value={data.outflow}
            onChange={(e) =>
              setData((prev) => ({ ...prev, outflow: e.target.value }))
            }
            placeholder="Ex : 2500"
            style={{
              width: "100%",
              padding: 8,
              borderRadius: 4,
              border: "1px solid #ccc",
            }}
          />
        </div>
      </section>

      {/* Tableau d'évolution */}
      <section style={{ marginBottom: 32 }}>
        <h2>Tableau d’évolution du stock</h2>

        {!canShowTable ? (
          <p
            style={{
              marginTop: 8,
              fontSize: 14,
              color: "#6b7280",
            }}
          >
            Pour voir le tableau, indiquez l’unité de temps, l’horizon, la
            valeur provisoire du stock de départ et les flux d’entrée et de
            sortie.
          </p>
        ) : (
          <>
            <p
              style={{
                marginTop: 8,
                fontSize: 14,
                color: "#4b5563",
              }}
            >
              Le tableau ci-dessous montre l’évolution du stock au fil des{" "}
              {data.horizon} {data.timeUnit || "périodes"} avec les valeurs
              provisoires que vous avez choisies. Vous pouvez modifier ces
              valeurs pour tester d’autres scénarios.
            </p>

            <div style={{ marginTop: 12, overflowX: "auto" }}>
              <table
                style={{
                  borderCollapse: "collapse",
                  width: "100%",
                  minWidth: 480,
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
                      Période
                    </th>
                    <th
                      style={{
                        border: "1px solid #e5e7eb",
                        padding: "4px 8px",
                        textAlign: "left",
                      }}
                    >
                      Stock
                    </th>
                    <th
                      style={{
                        border: "1px solid #e5e7eb",
                        padding: "4px 8px",
                        textAlign: "left",
                      }}
                    >
                      Flux d’entrée
                    </th>
                    <th
                      style={{
                        border: "1px solid #e5e7eb",
                        padding: "4px 8px",
                        textAlign: "left",
                      }}
                    >
                      Flux de sortie
                    </th>
                    <th
                      style={{
                        border: "1px solid #e5e7eb",
                        padding: "4px 8px",
                        textAlign: "left",
                      }}
                    >
                      Variation nette (entrée - sortie)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows!.map((row) => (
                    <tr key={row.t}>
                      <td
                        style={{
                          border: "1px solid #e5e7eb",
                          padding: "4px 8px",
                        }}
                      >
                        {row.t}
                      </td>
                      <td
                        style={{
                          border: "1px solid #e5e7eb",
                          padding: "4px 8px",
                        }}
                      >
                        {row.stock.toFixed(2)}
                      </td>
                      <td
                        style={{
                          border: "1px solid #e5e7eb",
                          padding: "4px 8px",
                        }}
                      >
                        {row.inflow.toFixed(2)}
                      </td>
                      <td
                        style={{
                          border: "1px solid #e5e7eb",
                          padding: "4px 8px",
                        }}
                      >
                        {row.outflow.toFixed(2)}
                      </td>
                      <td
                        style={{
                          border: "1px solid #e5e7eb",
                          padding: "4px 8px",
                        }}
                      >
                        {row.delta.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </main>
  );
}

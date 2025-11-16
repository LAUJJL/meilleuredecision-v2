// app/vision-phase2/Phase2Client.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ModelSnapshot,
  snapshotStorageKey,
  saveSnapshotToLocalStorage,
} from "@/lib/pivot";

type Part1Data = {
  refinementText: string;
};

type Part2Data = {
  objectiveValue: string;
  targetPeriod: string;
};

type StockPoint = { t: number; value: number; margin?: number };

export default function Phase2Client() {
  const router = useRouter();

  // Contexte problème + vision
  const [problemName, setProblemName] = useState("");
  const [problemShort, setProblemShort] = useState("");
  const [visionId, setVisionId] = useState("");
  const [visionName, setVisionName] = useState("");
  const [visionShort, setVisionShort] = useState("");

  // Partie 1 : texte du raffinement
  const [part1, setPart1] = useState<Part1Data>({
    refinementText: "",
  });

  // Partie 2 : objectif & période
  const [part2, setPart2] = useState<Part2Data>({
    objectiveValue: "",
    targetPeriod: "",
  });

  const [activePart, setActivePart] = useState<"part1" | "part2">("part1");

  // Snapshot du raffinement 1 (modèle de base)
  const [baseSnapshot, setBaseSnapshot] = useState<ModelSnapshot | null>(null);

  // Résultats calculés pour la Partie 2
  const [results, setResults] = useState<{
    series: StockPoint[];
    objective: number;
    targetPeriod: number;
    achieved: boolean;
  } | null>(null);

  // Clés de stockage local pour ce raffinement
  function part1StorageKey(visionId: string) {
    return `md_ref2_part1_${visionId}`;
  }
  function part2StorageKey(visionId: string) {
    return `md_ref2_part2_${visionId}`;
  }

  // Charger contexte + données (comme en Phase 1 : via window.location.search)
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
      // Partie 1
      const raw1 = window.localStorage.getItem(part1StorageKey(vId));
      if (raw1) {
        const parsed1 = JSON.parse(raw1) as Partial<Part1Data>;
        if (parsed1.refinementText) {
          setPart1((prev) => ({ ...prev, ...parsed1 }));
        }
      }

      // Partie 2
      const raw2 = window.localStorage.getItem(part2StorageKey(vId));
      if (raw2) {
        const parsed2 = JSON.parse(raw2) as Partial<Part2Data>;
        setPart2((prev) => ({ ...prev, ...parsed2 }));
      }

      // Snapshot pivot du raffinement 1
      const keyBase = snapshotStorageKey(vId, 1);
      const rawBase = window.localStorage.getItem(keyBase);
      if (rawBase) {
        const parsedBase = JSON.parse(rawBase) as ModelSnapshot;
        setBaseSnapshot(parsedBase);
      }
    } catch (e) {
      console.error("Erreur de chargement des données du raffinement 2 :", e);
    }
  }, []);

  // Sauvegarde auto Part 1
  useEffect(() => {
    if (typeof window === "undefined" || !visionId) return;
    try {
      window.localStorage.setItem(
        part1StorageKey(visionId),
        JSON.stringify(part1)
      );
    } catch (e) {
      console.error(
        "Erreur d’enregistrement de la Partie 1 du raffinement 2 :",
        e
      );
    }
  }, [visionId, part1]);

  // Sauvegarde auto Part 2
  useEffect(() => {
    if (typeof window === "undefined" || !visionId) return;
    try {
      window.localStorage.setItem(
        part2StorageKey(visionId),
        JSON.stringify(part2)
      );
    } catch (e) {
      console.error(
        "Erreur d’enregistrement de la Partie 2 du raffinement 2 :",
        e
      );
    }
  }, [visionId, part2]);

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

  // Série de trésorerie basée sur le snapshot de base (raffinement 1)
  const stockSeries = useMemo(() => {
    if (!baseSnapshot) return null;

    const horizon = baseSnapshot.time.horizon;
    const p = baseSnapshot.parameters;

    const initial =
      p.tresorerie_initiale && typeof p.tresorerie_initiale.value === "number"
        ? p.tresorerie_initiale.value
        : NaN;

    const inflow =
      p.flux_entree_constant && typeof p.flux_entree_constant.value === "number"
        ? p.flux_entree_constant.value
        : NaN;

    const outflow =
      p.flux_sortie_constant &&
      typeof p.flux_sortie_constant.value === "number"
        ? p.flux_sortie_constant.value
        : NaN;

    if (
      !Number.isFinite(initial) ||
      !Number.isFinite(inflow) ||
      !Number.isFinite(outflow)
    ) {
      return null;
    }

    const series: StockPoint[] = [];
    let current = initial;
    series.push({ t: 0, value: current });

    for (let t = 1; t <= horizon; t++) {
      current = current + inflow - outflow;
      series.push({ t, value: current });
    }

    return series;
  }, [baseSnapshot]);

  // Conditions pour accéder à la Partie 2
  const canGoToPart2 = !!part1.refinementText.trim() && !!stockSeries;

  function computeResults() {
    if (!stockSeries) {
      alert(
        "Le modèle de base (premier raffinement) est introuvable ou incomplet. Revenez au premier raffinement."
      );
      return;
    }

    const obj = parseFloat(part2.objectiveValue);
    const period = parseInt(part2.targetPeriod, 10);

    if (!Number.isFinite(obj) || !Number.isFinite(period) || period < 0) {
      alert(
        "Merci de saisir un objectif (nombre) et un numéro de période valide (0, 1, 2, ...)."
      );
      return;
    }

    const horizon = stockSeries[stockSeries.length - 1]?.t ?? 0;
    if (period > horizon) {
      alert(
        `La période choisie (${period}) dépasse l’horizon du modèle (${horizon}).`
      );
      return;
    }

    const seriesWithMargin: StockPoint[] = stockSeries.map((pt) => ({
      ...pt,
      margin: pt.value - obj,
    }));

    const valueAtPeriod = seriesWithMargin.find(
      (pt) => pt.t === period
    )?.value;
    const achieved =
      typeof valueAtPeriod === "number" ? valueAtPeriod >= obj : false;

    setResults({
      series: seriesWithMargin,
      objective: obj,
      targetPeriod: period,
      achieved,
    });
  }

  function saveRefinement2Snapshot() {
    if (!baseSnapshot || !results) {
      alert(
        "Impossible d’enregistrer le raffinement : calculez d’abord les résultats."
      );
      return;
    }

    const obj = results.objective;
    const period = results.targetPeriod;

    const snapshot2: ModelSnapshot = {
      ...baseSnapshot,
      meta: {
        ...baseSnapshot.meta,
        refinementIndex: 2,
        parentRefinementIndex: 1,
        validatedAt: new Date().toISOString(),
      },
      parameters: {
        ...baseSnapshot.parameters,
        objectif_tresorerie: {
          type: "number",
          value: obj,
          unit: baseSnapshot.parameters.tresorerie_initiale?.unit,
          description: "Objectif minimal de trésorerie à atteindre.",
        },
        periode_objectif: {
          type: "number",
          value: period,
          unit: baseSnapshot.time.timeUnit,
          description:
            "Période à laquelle l’objectif doit être atteint (0 = début).",
        },
      },
      auxiliaries: {
        ...baseSnapshot.auxiliaries,
        marge_tresorerie: {
          unit: baseSnapshot.parameters.tresorerie_initiale?.unit,
          description:
            "Marge de trésorerie par rapport à l’objectif (tresorerie[t] - objectif).",
          equation: "tresorerie[t] - objectif_tresorerie",
        },
      },
      criteria: [
        ...baseSnapshot.criteria,
        {
          name: "objectif_tresorerie_atteint_a_la_periode",
          description:
            "La trésorerie à la période cible est supérieure ou égale à l’objectif.",
          equation: "tresorerie[periode_objectif] >= objectif_tresorerie",
        },
      ],
    };

    saveSnapshotToLocalStorage(snapshot2);
    alert(
      "Raffinement 2 enregistré : le modèle pivot (avec objectif de trésorerie) a été sauvegardé."
    );
  }

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

      <h1>Raffinement 2 – Partie {activePart === "part1" ? "1" : "2"}</h1>

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

      {/* Onglets */}
      <section style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => setActivePart("part1")}
            style={{
              padding: "8px 16px",
              borderRadius: 6,
              border:
                activePart === "part1"
                  ? "2px solid #2563eb"
                  : "1px solid #d1d5db",
              backgroundColor: activePart === "part1" ? "#eff6ff" : "white",
              cursor: "pointer",
              fontWeight: activePart === "part1" ? 600 : 400,
            }}
          >
            Partie 1 – Formulation
          </button>

          <button
            onClick={() => {
              if (!canGoToPart2) return;
              setActivePart("part2");
            }}
            disabled={!canGoToPart2}
            style={{
              padding: "8px 16px",
              borderRadius: 6,
              border:
                activePart === "part2"
                  ? "2px solid #2563eb"
                  : "1px solid #d1d5db",
              backgroundColor: activePart === "part2" ? "#eff6ff" : "white",
              cursor: canGoToPart2 ? "pointer" : "not-allowed",
              fontWeight: activePart === "part2" ? 600 : 400,
              opacity: canGoToPart2 ? 1 : 0.5,
            }}
          >
            Partie 2 – Objectif et résultats
          </button>
        </div>
        {!canGoToPart2 && (
          <p
            style={{
              marginTop: 8,
              fontSize: 13,
              color: "#6b7280",
            }}
          >
            Pour accéder à la Partie 2, saisissez un texte de raffinement et
            assurez-vous que le premier raffinement (stock et flux) est bien
            défini.
          </p>
        )}
      </section>

      {activePart === "part1" ? (
        // -------- PARTIE 1 : TEXTE LIBRE --------
        <section
          style={{
            border: "1px solid #ddd",
            borderRadius: 8,
            padding: 24,
            marginBottom: 32,
          }}
        >
          <h2>Partie 1 – Formulation qualitative du raffinement</h2>

          <p style={{ fontSize: 14, color: "#4b5563", marginTop: 8 }}>
            Exprimez ici, en langage courant, le raffinement que vous souhaitez
            apporter à cette vision. Par exemple :{" "}
            <em>
              &laquo; Je veux voir si ma trésorerie atteint 10&nbsp;000&nbsp;€
              au bout de 12 mois. &raquo;
            </em>
          </p>

          <div style={{ marginTop: 16 }}>
            <label
              htmlFor="refinement-text"
              style={{ display: "block", fontWeight: 600, marginBottom: 4 }}
            >
              Votre raffinement (texte libre)
            </label>
            <textarea
              id="refinement-text"
              value={part1.refinementText}
              onChange={(e) =>
                setPart1((prev) => ({
                  ...prev,
                  refinementText: e.target.value,
                }))
              }
              rows={6}
              style={{
                width: "100%",
                padding: 8,
                borderRadius: 4,
                border: "1px solid #ccc",
                resize: "vertical",
              }}
            />
          </div>
        </section>
      ) : (
        // -------- PARTIE 2 : OBJECTIF + RESULTATS --------
        <section
          style={{
            border: "1px solid #ddd",
            borderRadius: 8,
            padding: 24,
            marginBottom: 32,
          }}
        >
          <h2>Partie 2 – Objectif de trésorerie et résultats</h2>

          {!stockSeries ? (
            <p style={{ marginTop: 8, color: "#b91c1c" }}>
              Le modèle de base du premier raffinement est introuvable ou
              incomplet. Revenez au premier raffinement pour le compléter.
            </p>
          ) : (
            <>
              <p style={{ fontSize: 14, color: "#4b5563", marginTop: 8 }}>
                À partir du stock et des flux définis au premier raffinement,
                vous pouvez maintenant fixer un objectif de trésorerie et une
                période à laquelle vous souhaitez qu’il soit atteint. Le site
                calcule alors l’évolution de la trésorerie et indique si
                l’objectif est atteint ou non.
              </p>

              <div style={{ marginTop: 16 }}>
                <label
                  htmlFor="objective-value"
                  style={{
                    display: "block",
                    fontWeight: 600,
                    marginBottom: 4,
                  }}
                >
                  Objectif de trésorerie à atteindre
                </label>
                <input
                  id="objective-value"
                  type="number"
                  value={part2.objectiveValue}
                  onChange={(e) =>
                    setPart2((prev) => ({
                      ...prev,
                      objectiveValue: e.target.value,
                    }))
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
                  htmlFor="target-period"
                  style={{
                    display: "block",
                    fontWeight: 600,
                    marginBottom: 4,
                  }}
                >
                  Période à laquelle l’objectif doit être atteint
                  {baseSnapshot?.time.timeUnit
                    ? ` (en numéro de ${baseSnapshot.time.timeUnit} : 0, 1, 2, ...)`
                    : " (0, 1, 2, ...)"}
                </label>
                <input
                  id="target-period"
                  type="number"
                  value={part2.targetPeriod}
                  onChange={(e) =>
                    setPart2((prev) => ({
                      ...prev,
                      targetPeriod: e.target.value,
                    }))
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

              <div style={{ marginTop: 20 }}>
                <button
                  onClick={computeResults}
                  style={{
                    padding: "8px 20px",
                    borderRadius: 6,
                    border: "none",
                    backgroundColor: "#2563eb",
                    color: "white",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  Calculer les résultats
                </button>
              </div>

              {results && (
                <div style={{ marginTop: 24 }}>
                  <h3>Résultat synthétique</h3>
                  <p style={{ marginTop: 8 }}>
                    À la période <strong>{results.targetPeriod}</strong>, la
                    trésorerie vaut{" "}
                    <strong>
                      {
                        results.series.find(
                          (p) => p.t === results.targetPeriod
                        )?.value.toFixed(2)
                      }
                    </strong>
                    {baseSnapshot?.parameters.tresorerie_initiale?.unit
                      ? ` ${baseSnapshot.parameters.tresorerie_initiale.unit}`
                      : ""}{" "}
                    pour un objectif de{" "}
                    <strong>{results.objective.toFixed(2)}</strong>.
                  </p>
                  <p
                    style={{
                      marginTop: 4,
                      color: results.achieved ? "#15803d" : "#b91c1c",
                      fontWeight: 600,
                    }}
                  >
                    {results.achieved
                      ? "✔ L’objectif est atteint ou dépassé à la période choisie."
                      : "✖ L’objectif n’est pas atteint à la période choisie."}
                  </p>

                  <div style={{ marginTop: 20 }}>
                    <h3>Tableau détaillé (trésorerie et marge)</h3>
                    <div style={{ marginTop: 8, overflowX: "auto" }}>
                      <table
                        style={{
                          borderCollapse: "collapse",
                          width: "100%",
                          minWidth: 360,
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
                              Trésorerie
                            </th>
                            <th
                              style={{
                                border: "1px solid #e5e7eb",
                                padding: "4px 8px",
                                textAlign: "left",
                              }}
                            >
                              Marge (trésorerie - objectif)
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {results.series.map((pt) => (
                            <tr key={pt.t}>
                              <td
                                style={{
                                  border: "1px solid #e5e7eb",
                                  padding: "4px 8px",
                                }}
                              >
                                {pt.t}
                              </td>
                              <td
                                style={{
                                  border: "1px solid #e5e7eb",
                                  padding: "4px 8px",
                                }}
                              >
                                {pt.value.toFixed(2)}
                              </td>
                              <td
                                style={{
                                  border: "1px solid #e5e7eb",
                                  padding: "4px 8px",
                                  color:
                                    (pt.margin ?? 0) >= 0
                                      ? "#15803d"
                                      : "#b91c1c",
                                }}
                              >
                                {(pt.margin ?? 0).toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div style={{ marginTop: 24 }}>
                    <button
                      onClick={saveRefinement2Snapshot}
                      style={{
                        padding: "10px 24px",
                        borderRadius: 6,
                        border: "none",
                        backgroundColor: "#16a34a",
                        color: "white",
                        cursor: "pointer",
                        fontWeight: 600,
                      }}
                    >
                      Valider ce raffinement et enregistrer le modèle
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      )}
    </main>
  );
}

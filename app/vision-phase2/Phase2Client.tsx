// app/vision-phase2/Phase2Client.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ModelSnapshot,
  snapshotStorageKey,
  saveSnapshotToLocalStorage,
} from "@/lib/pivot";

type TrialData = {
  timeUnit: string;
  horizon: string;
  initialStock: string;
  inflow: string;
  outflow: string;
};

type StockRow = {
  period: number;
  start: number;
  inflow: number;
  outflow: number;
  delta: number;
  end: number;
};

export default function Phase2Client() {
  const router = useRouter();

  // Contexte problème + vision
  const [problemName, setProblemName] = useState("");
  const [problemShort, setProblemShort] = useState("");
  const [visionId, setVisionId] = useState("");
  const [visionName, setVisionName] = useState("");
  const [visionShort, setVisionShort] = useState("");

  // Données d'essai pour explorer (unités, horizon, valeurs)
  const [trial, setTrial] = useState<TrialData>({
    timeUnit: "",
    horizon: "",
    initialStock: "",
    inflow: "",
    outflow: "",
  });

  // Snapshot pivot du raffinement 1 (base) et indicateur de verrouillage
  const [baseSnapshot, setBaseSnapshot] = useState<ModelSnapshot | null>(null);
  const [isLocked, setIsLocked] = useState(false);

  // ---- localStorage helpers ----
  function trialStorageKey(visionId: string) {
    return `md_phase2_trial_${visionId}`;
  }
  function lockKey(visionId: string) {
    // même clé que celle utilisée par le raffinement 3
    return `md_refinement2_locked_${visionId}`;
  }

  // Chargement du contexte, de l'état d'essai et du snapshot de Phase 1
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
      // Verrouillage éventuel du raffinement 2
      const lockedRaw = window.localStorage.getItem(lockKey(vId));
      if (lockedRaw === "true") {
        setIsLocked(true);
      }

      // État d’essai déjà saisi pour ce raffinement
      const rawTrial = window.localStorage.getItem(trialStorageKey(vId));
      if (rawTrial) {
        const parsed = JSON.parse(rawTrial) as Partial<TrialData>;
        setTrial((prev) => ({ ...prev, ...parsed }));
      }

      // Snapshot pivot du raffinement 1 (base)
      const keyBase = snapshotStorageKey(vId, 1);
      const rawBase = window.localStorage.getItem(keyBase);
      if (rawBase) {
        const parsedBase = JSON.parse(rawBase) as ModelSnapshot;
        setBaseSnapshot(parsedBase);

        // Si aucune unité / horizon n’a été saisi, proposer les valeurs de base
        setTrial((prev) => ({
          ...prev,
          timeUnit: prev.timeUnit || parsedBase.time.timeUnit || "",
          horizon:
            prev.horizon ||
            (Number.isFinite(parsedBase.time.horizon)
              ? String(parsedBase.time.horizon)
              : ""),
        }));
      }
    } catch (e) {
      console.error("Erreur de chargement du raffinement 2 :", e);
    }
  }, []);

  // Sauvegarde automatique des données d'essai
  useEffect(() => {
    if (typeof window === "undefined" || !visionId || isLocked) return;
    try {
      window.localStorage.setItem(
        trialStorageKey(visionId),
        JSON.stringify(trial)
      );
    } catch (e) {
      console.error("Erreur d’enregistrement des données du raffinement 2 :", e);
    }
  }, [visionId, trial, isLocked]);

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

  // Tableau d'évolution du stock (pour exploration uniquement)
  const stockTable = useMemo<StockRow[] | null>(() => {
    const horizon = parseInt(trial.horizon, 10);
    const initial = parseFloat(trial.initialStock);
    const inflow = parseFloat(trial.inflow);
    const outflow = parseFloat(trial.outflow);

    if (
      !Number.isFinite(horizon) ||
      horizon <= 0 ||
      !Number.isFinite(initial) ||
      !Number.isFinite(inflow) ||
      !Number.isFinite(outflow)
    ) {
      return null;
    }

    const rows: StockRow[] = [];
    let currentStart = initial;

    for (let period = 1; period <= horizon; period++) {
      const delta = inflow - outflow;
      const end = currentStart + delta;

      rows.push({
        period,
        start: currentStart,
        inflow,
        outflow,
        delta,
        end,
      });

      currentStart = end;
    }

    return rows;
  }, [trial.horizon, trial.initialStock, trial.inflow, trial.outflow]);

  const canValidate =
    !!trial.timeUnit.trim() &&
    !!trial.horizon.trim() &&
    baseSnapshot !== null &&
    !isLocked;

  // Validation : on fige l’unité de temps et l’horizon dans le pivot (raffinement 2)
  function handleValidateAndGoNext() {
    if (!visionId) {
      alert("Vision introuvable. Revenez à la liste des visions.");
      return;
    }
    if (!baseSnapshot) {
      alert(
        "Le modèle du raffinement 1 est introuvable ou incomplet. Revenez au premier raffinement."
      );
      return;
    }

    const horizonInt = parseInt(trial.horizon, 10);
    const timeUnit = trial.timeUnit.trim();

    if (!Number.isFinite(horizonInt) || horizonInt <= 0) {
      alert("L’horizon doit être un entier strictement positif.");
      return;
    }
    if (!timeUnit) {
      alert("Merci de saisir une unité de temps (par exemple : mois).");
      return;
    }

    try {
      const snapshot2: ModelSnapshot = {
        ...baseSnapshot,
        meta: {
          ...baseSnapshot.meta,
          refinementIndex: 2,
          parentRefinementIndex: 1,
          validatedAt: new Date().toISOString(),
        },
        time: {
          ...baseSnapshot.time,
          timeUnit,
          horizon: horizonInt,
        },
        // Les paramètres numériques (valeurs des flux et du stock de départ)
        // restent ceux définis à l’étape 1. Ici on ne fige que le cadre temps.
      };

      saveSnapshotToLocalStorage(snapshot2);

      if (typeof window !== "undefined") {
        window.localStorage.setItem(lockKey(visionId), "true");
      }
      setIsLocked(true);

      const params = new URLSearchParams({
        problemName,
        problemShort,
        visionId,
        visionName,
        visionShort,
      });

      router.push(`/vision-phase3?${params.toString()}`);
    } catch (e) {
      console.error(
        "Erreur lors de la création du snapshot du raffinement 2 :",
        e
      );
      alert(
        "Une erreur est survenue lors de la validation de ce raffinement. Réessayez plus tard."
      );
    }
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

      <h1>Raffinement 2 – Unité de temps et horizon</h1>

      {isLocked && (
        <p
          style={{
            padding: "8px 12px",
            borderRadius: 6,
            backgroundColor: "#fef3c7",
            border: "1px solid #facc15",
            marginTop: 12,
            marginBottom: 16,
            fontSize: 14,
          }}
        >
          Ce raffinement a été validé. L’unité de temps et l’horizon sont
          désormais figés pour cette vision.
        </p>
      )}

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

      {/* Explication du rôle du raffinement 2 */}
      <section
        style={{
          border: "1px solid #e5e7eb",
          borderRadius: 8,
          padding: 24,
          marginBottom: 32,
        }}
      >
        <h2>But de ce raffinement</h2>
        <p style={{ marginTop: 8, fontSize: 14, color: "#4b5563" }}>
          Dans ce deuxième raffinement, vous choisissez{" "}
          <strong>l’unité de temps</strong> et <strong>l’horizon</strong> qui
          serviront de cadre pour tous les raffinements suivants. Vous pouvez
          tester différentes valeurs de stock de départ et de flux pour voir
          comment le stock évolue, mais ces valeurs ne seront pas conservées
          comme définitives : seule la combinaison{" "}
          <strong>unité de temps + horizon</strong> sera figée si vous passez au
          raffinement 3.
        </p>
      </section>

      {/* Formulaire et tableau d'exploration */}
      <section
        style={{
          border: "1px solid #ddd",
          borderRadius: 8,
          padding: 24,
          marginBottom: 32,
        }}
      >
        <h2>Choisir l’unité de temps, l’horizon et tester des valeurs</h2>

        {!baseSnapshot && (
          <p style={{ marginTop: 8, color: "#b91c1c" }}>
            Le modèle de base (raffinement 1) est introuvable ou incomplet.
            Revenez au premier raffinement pour le compléter.
          </p>
        )}

        <div style={{ marginTop: 16 }}>
          <label
            htmlFor="time-unit"
            style={{ display: "block", fontWeight: 600, marginBottom: 4 }}
          >
            Unité de temps (sera figée à partir du raffinement 3)
          </label>
          <input
            id="time-unit"
            type="text"
            value={trial.timeUnit}
            onChange={(e) =>
              setTrial((prev) => ({ ...prev, timeUnit: e.target.value }))
            }
            placeholder="Ex : mois"
            disabled={isLocked}
            style={{
              width: "100%",
              padding: 8,
              borderRadius: 4,
              border: "1px solid #ccc",
              backgroundColor: isLocked ? "#f9fafb" : "white",
            }}
          />
        </div>

        <div style={{ marginTop: 12 }}>
          <label
            htmlFor="horizon"
            style={{ display: "block", fontWeight: 600, marginBottom: 4 }}
          >
            Horizon (nombre de périodes, sera figé à partir du raffinement 3)
          </label>
          <input
            id="horizon"
            type="number"
            value={trial.horizon}
            onChange={(e) =>
              setTrial((prev) => ({ ...prev, horizon: e.target.value }))
            }
            placeholder="Ex : 12"
            disabled={isLocked}
            style={{
              width: "100%",
              padding: 8,
              borderRadius: 4,
              border: "1px solid #ccc",
              backgroundColor: isLocked ? "#f9fafb" : "white",
            }}
          />
        </div>

        <div style={{ marginTop: 20 }}>
          <h3>Valeurs d’essai pour explorer le stock</h3>
          <p style={{ fontSize: 13, color: "#6b7280", marginTop: 4 }}>
            Ces valeurs servent uniquement à explorer. Elles ne seront pas
            conservées comme définitives dans le pivot.
          </p>

          <div style={{ marginTop: 12 }}>
            <label
              htmlFor="initial-stock"
              style={{ display: "block", fontWeight: 600, marginBottom: 4 }}
            >
              Stock de départ (valeur d’essai)
            </label>
            <input
              id="initial-stock"
              type="number"
              value={trial.initialStock}
              onChange={(e) =>
                setTrial((prev) => ({
                  ...prev,
                  initialStock: e.target.value,
                }))
              }
              placeholder="Ex : 3000"
              disabled={isLocked}
              style={{
                width: "100%",
                padding: 8,
                borderRadius: 4,
                border: "1px solid #ccc",
                backgroundColor: isLocked ? "#f9fafb" : "white",
              }}
            />
          </div>

          <div style={{ marginTop: 12 }}>
            <label
              htmlFor="inflow"
              style={{ display: "block", fontWeight: 600, marginBottom: 4 }}
            >
              Flux d’entrée constant (valeur d’essai)
            </label>
            <input
              id="inflow"
              type="number"
              value={trial.inflow}
              onChange={(e) =>
                setTrial((prev) => ({ ...prev, inflow: e.target.value }))
              }
              placeholder="Ex : 3000"
              disabled={isLocked}
              style={{
                width: "100%",
                padding: 8,
                borderRadius: 4,
                border: "1px solid #ccc",
                backgroundColor: isLocked ? "#f9fafb" : "white",
              }}
            />
          </div>

          <div style={{ marginTop: 12 }}>
            <label
              htmlFor="outflow"
              style={{ display: "block", fontWeight: 600, marginBottom: 4 }}
            >
              Flux de sortie constant (valeur d’essai)
            </label>
            <input
              id="outflow"
              type="number"
              value={trial.outflow}
              onChange={(e) =>
                setTrial((prev) => ({ ...prev, outflow: e.target.value }))
              }
              placeholder="Ex : 2500"
              disabled={isLocked}
              style={{
                width: "100%",
                padding: 8,
                borderRadius: 4,
                border: "1px solid #ccc",
                backgroundColor: isLocked ? "#f9fafb" : "white",
              }}
            />
          </div>
        </div>

        {/* Tableau exploratoire */}
        <div style={{ marginTop: 20 }}>
          <h3>Évolution du stock sur l’horizon choisi</h3>
          {!stockTable ? (
            <p style={{ marginTop: 8, fontSize: 14, color: "#6b7280" }}>
              Pour voir le tableau, saisissez une unité de temps, un horizon et
              des valeurs pour le stock de départ et les flux.
            </p>
          ) : (
            <div style={{ marginTop: 8, overflowX: "auto" }}>
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
                      Stock début de période
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
                      Variation nette
                    </th>
                    <th
                      style={{
                        border: "1px solid #e5e7eb",
                        padding: "4px 8px",
                        textAlign: "left",
                      }}
                    >
                      Stock fin de période
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {stockTable.map((row) => (
                    <tr key={row.period}>
                      <td
                        style={{
                          border: "1px solid #e5e7eb",
                          padding: "4px 8px",
                        }}
                      >
                        {row.period}
                      </td>
                      <td
                        style={{
                          border: "1px solid #e5e7eb",
                          padding: "4px 8px",
                        }}
                      >
                        {row.start.toFixed(2)}
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
                      <td
                        style={{
                          border: "1px solid #e5e7eb",
                          padding: "4px 8px",
                        }}
                      >
                        {row.end.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* Bouton de validation */}
      <section style={{ marginBottom: 40 }}>
        <button
          onClick={handleValidateAndGoNext}
          disabled={!canValidate}
          style={{
            padding: "10px 24px",
            borderRadius: 6,
            border: "none",
            backgroundColor: canValidate ? "#2563eb" : "#9ca3af",
            color: "white",
            cursor: canValidate ? "pointer" : "not-allowed",
            fontWeight: 600,
          }}
        >
          Valider l’unité de temps et l’horizon et passer au raffinement 3
        </button>
        {!canValidate && !isLocked && (
          <p
            style={{
              marginTop: 8,
              fontSize: 13,
              color: "#6b7280",
            }}
          >
            Pour valider, saisissez une unité de temps, un horizon et assurez-vous
            que le raffinement 1 a bien été validé.
          </p>
        )}
      </section>
    </main>
  );
}

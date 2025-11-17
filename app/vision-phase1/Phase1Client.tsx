// app/vision-phase1/Phase1Client.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  buildPhase1Snapshot,
  saveSnapshotToLocalStorage,
} from "@/lib/pivot";

type QualitativeData = {
  stockName: string;
  stockUnit: string;
  timeUnit: string;
  horizon: string;
};

type QuantitativeData = {
  initialStock: string;
  inflow: string;
  outflow: string;
};

type StockPoint = { t: number; value: number };

export default function Phase1Client() {
  const router = useRouter();

  // Contexte problème + vision
  const [problemName, setProblemName] = useState("");
  const [problemShort, setProblemShort] = useState("");
  const [visionId, setVisionId] = useState("");
  const [visionName, setVisionName] = useState("");
  const [visionShort, setVisionShort] = useState("");

  // Partie qualitative (Phase 1A)
  const [qual, setQual] = useState<QualitativeData>({
    stockName: "",
    stockUnit: "",
    timeUnit: "",
    horizon: "",
  });

  // Partie quantitative (Phase 1B)
  const [quant, setQuant] = useState<QuantitativeData>({
    initialStock: "",
    inflow: "",
    outflow: "",
  });

  const [activePart, setActivePart] = useState<"qual" | "quant">("qual");

  // Raffinement verrouillé ?
  const [isLocked, setIsLocked] = useState(false);

  // Helpers localStorage
  function qualStorageKey(visionId: string) {
    return `md_phase1_qual_${visionId}`;
  }
  function quantStorageKey(visionId: string) {
    return `md_phase1_quant_${visionId}`;
  }
  function lockKey(visionId: string) {
    return `md_refinement1_locked_${visionId}`;
  }

  // Charger contexte + données + état de verrouillage
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
      // Verrouillage
      const lockedRaw = window.localStorage.getItem(lockKey(vId));
      if (lockedRaw === "true") {
        setIsLocked(true);
      }

      // Partie qualitative
      const rawQual = window.localStorage.getItem(qualStorageKey(vId));
      if (rawQual) {
        const parsed = JSON.parse(rawQual) as Partial<QualitativeData>;
        setQual((prev) => ({ ...prev, ...parsed }));
      }

      // Partie quantitative
      const rawQuant = window.localStorage.getItem(quantStorageKey(vId));
      if (rawQuant) {
        const parsed = JSON.parse(rawQuant) as Partial<QuantitativeData>;
        setQuant((prev) => ({ ...prev, ...parsed }));
      }
    } catch (e) {
      console.error("Erreur de chargement des données de la phase 1 :", e);
    }
  }, []);

  // Sauvegarde auto (qualitative)
  useEffect(() => {
    if (typeof window === "undefined" || !visionId) return;
    try {
      window.localStorage.setItem(
        qualStorageKey(visionId),
        JSON.stringify(qual)
      );
    } catch (e) {
      console.error("Erreur d’enregistrement de la partie qualitative :", e);
    }
  }, [visionId, qual]);

  // Sauvegarde auto (quantitative)
  useEffect(() => {
    if (typeof window === "undefined" || !visionId) return;
    try {
      window.localStorage.setItem(
        quantStorageKey(visionId),
        JSON.stringify(quant)
      );
    } catch (e) {
      console.error("Erreur d’enregistrement de la partie quantitative :", e);
    }
  }, [visionId, quant]);

  // Série de trésorerie pour le tableau (Partie 1B)
  const stockSeries = useMemo(() => {
    const horizon = parseInt(qual.horizon, 10);
    const initial = parseFloat(quant.initialStock);
    const inflow = parseFloat(quant.inflow);
    const outflow = parseFloat(quant.outflow);

    if (
      !Number.isFinite(horizon) ||
      horizon <= 0 ||
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
  }, [qual.horizon, quant.initialStock, quant.inflow, quant.outflow]);

  const canGoToQuant =
    !!qual.stockName.trim() &&
    !!qual.stockUnit.trim() &&
    !!qual.timeUnit.trim() &&
    !!qual.horizon.trim();

  const canValidate =
    !!qual.stockName.trim() &&
    !!qual.stockUnit.trim() &&
    !!qual.timeUnit.trim() &&
    !!qual.horizon.trim() &&
    !!quant.initialStock.trim() &&
    !!quant.inflow.trim() &&
    !!quant.outflow.trim() &&
    stockSeries !== null &&
    !!visionId &&
    !!problemName;

  function goBackToVisions() {
    const params = new URLSearchParams({
      problemName,
      problemShort,
    });
    // Retour à la liste des visions pour ce problème
    router.push(`/visions?${params.toString()}`);
  }

  // Petit utilitaire pour produire un "id" de problème à partir du nom
  function slugifyId(input: string): string {
    return input
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .substring(0, 40) || "problem";
  }

  function handleValidateAndGoNext() {
    if (!visionId) {
      alert("Vision introuvable. Revenez à la liste des visions.");
      return;
    }

    // Si déjà verrouillé, on ne revalide pas : on va directement au raffinement 2
    if (isLocked) {
      const params = new URLSearchParams({
        problemName,
        problemShort,
        visionId,
        visionName,
        visionShort,
      });
      router.push(`/vision-phase2?${params.toString()}`);
      return;
    }

    if (!canValidate) {
      alert(
        "Merci de compléter les informations qualitatives et quantitatives avant de valider ce raffinement."
      );
      return;
    }

    const horizon = parseInt(qual.horizon, 10);
    const initial = parseFloat(quant.initialStock);
    const inflow = parseFloat(quant.inflow);
    const outflow = parseFloat(quant.outflow);

    if (!Number.isFinite(horizon) || horizon <= 0) {
      alert("L’horizon doit être un entier strictement positif.");
      return;
    }
    if (
      !Number.isFinite(initial) ||
      !Number.isFinite(inflow) ||
      !Number.isFinite(outflow)
    ) {
      alert("Merci de saisir des valeurs numériques valides.");
      return;
    }

    try {
      const snapshot = buildPhase1Snapshot({
        problemId: slugifyId(problemName),
        visionId,
        refinementIndex: 1,
        timeUnit: qual.timeUnit || "période",
        horizon,
        stockUnit: qual.stockUnit || "unités",
        initialStockValue: initial,
        inflowValue: inflow,
        outflowValue: outflow,
      });

      saveSnapshotToLocalStorage(snapshot);

      // On fige ce raffinement
      if (typeof window !== "undefined") {
        window.localStorage.setItem(lockKey(visionId), "true");
      }
      setIsLocked(true);

      // Puis on passe au raffinement 2
      const params = new URLSearchParams({
        problemName,
        problemShort,
        visionId,
        visionName,
        visionShort,
      });
      router.push(`/vision-phase2?${params.toString()}`);
    } catch (e) {
      console.error("Erreur lors de la construction du snapshot de phase 1 :", e);
      alert(
        "Une erreur est survenue lors de la validation du raffinement. Réessayez ou revenez plus tard."
      );
    }
  }

  return (
    <main style={{ maxWidth: 900, margin: "32px auto", padding: "0 16px" }}>
      <button
        onClick={goBackToVisions}
        style={{
          marginBottom: 16,
          padding: "6px 12px",
          borderRadius: 4,
          border: "1px solid #9ca3af",
          backgroundColor: "white",
          cursor: "pointer",
        }}
      >
        ← Revenir à la liste des visions de ce problème
      </button>

      <h1>Premier raffinement de la vision</h1>

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
          Ce raffinement a été validé. Les données sont désormais figées. Pour
          explorer un autre scénario, créez une nouvelle vision.
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

      {/* Onglets Qual/Quant */}
      <section style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => setActivePart("qual")}
            style={{
              padding: "8px 16px",
              borderRadius: 6,
              border:
                activePart === "qual"
                  ? "2px solid #2563eb"
                  : "1px solid #d1d5db",
              backgroundColor: activePart === "qual" ? "#eff6ff" : "white",
              cursor: "pointer",
              fontWeight: activePart === "qual" ? 600 : 400,
            }}
          >
            Partie 1A – Cadre qualitatif
          </button>
          <button
            onClick={() => {
              if (!canGoToQuant) return;
              setActivePart("quant");
            }}
            disabled={!canGoToQuant}
            style={{
              padding: "8px 16px",
              borderRadius: 6,
              border:
                activePart === "quant"
                  ? "2px solid #2563eb"
                  : "1px solid #d1d5db",
              backgroundColor: activePart === "quant" ? "#eff6ff" : "white",
              cursor: canGoToQuant ? "pointer" : "not-allowed",
              fontWeight: activePart === "quant" ? 600 : 400,
              opacity: canGoToQuant ? 1 : 0.5,
            }}
          >
            Partie 1B – Données quantitatives
          </button>
        </div>
        {!canGoToQuant && (
          <p
            style={{
              marginTop: 8,
              fontSize: 13,
              color: "#6b7280",
            }}
          >
            Pour accéder à la partie quantitative, complétez d’abord le cadre
            qualitatif : nom du stock, unités et horizon.
          </p>
        )}
      </section>

      {activePart === "qual" ? (
        // ------ PARTIE 1A : QUALITATIVE ------
        <section
          style={{
            border: "1px solid #ddd",
            borderRadius: 8,
            padding: 24,
            marginBottom: 32,
          }}
        >
          <h2>Partie 1A – Définir le stock principal</h2>

          <p style={{ fontSize: 14, color: "#4b5563", marginTop: 8 }}>
            Ici, vous définissez le stock qui représente l’état du système (par
            exemple la trésorerie), l’unité de ce stock (par exemple euros), et
            l’unité de temps (par exemple mois), ainsi que l’horizon d’étude.
          </p>

          <div style={{ marginTop: 16 }}>
            <label
              htmlFor="stock-name"
              style={{ display: "block", fontWeight: 600, marginBottom: 4 }}
            >
              Nom du stock principal
            </label>
            <input
              id="stock-name"
              type="text"
              value={qual.stockName}
              onChange={(e) =>
                setQual((prev) => ({ ...prev, stockName: e.target.value }))
              }
              placeholder="Ex : Trésorerie"
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
              placeholder="Ex : euros"
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
              Horizon (nombre de périodes)
            </label>
            <input
              id="horizon"
              type="number"
              value={qual.horizon}
              onChange={(e) =>
                setQual((prev) => ({ ...prev, horizon: e.target.value }))
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
        </section>
      ) : (
        // ------ PARTIE 1B : QUANTITATIVE ------
        <section
          style={{
            border: "1px solid #ddd",
            borderRadius: 8,
            padding: 24,
            marginBottom: 32,
          }}
        >
          <h2>Partie 1B – Données quantitatives du stock et des flux</h2>

          <p style={{ fontSize: 14, color: "#4b5563", marginTop: 8 }}>
            Ici, vous indiquez la valeur de départ du stock et les flux
            constants d’entrée et de sortie pour chaque période. Le site calcule
            ensuite l’évolution du stock dans le temps (tableau).
          </p>

          <div style={{ marginTop: 16 }}>
            <label
              htmlFor="initial-stock"
              style={{ display: "block", fontWeight: 600, marginBottom: 4 }}
            >
              Valeur initiale du stock
              {qual.stockUnit ? ` (en ${qual.stockUnit})` : ""}
            </label>
            <input
              id="initial-stock"
              type="number"
              value={quant.initialStock}
              onChange={(e) =>
                setQuant((prev) => ({
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
              Flux d’entrée constant par période
              {qual.stockUnit ? ` (en ${qual.stockUnit})` : ""}
            </label>
            <input
              id="inflow"
              type="number"
              value={quant.inflow}
              onChange={(e) =>
                setQuant((prev) => ({ ...prev, inflow: e.target.value }))
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
              Flux de sortie constant par période
              {qual.stockUnit ? ` (en ${qual.stockUnit})` : ""}
            </label>
            <input
              id="outflow"
              type="number"
              value={quant.outflow}
              onChange={(e) =>
                setQuant((prev) => ({ ...prev, outflow: e.target.value }))
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

          {/* Tableau d'évolution */}
          <div style={{ marginTop: 20 }}>
            <h3>Évolution du stock (tableau)</h3>
            {!stockSeries ? (
              <p style={{ marginTop: 8, fontSize: 14, color: "#6b7280" }}>
                Renseignez l’horizon, la valeur initiale et les flux pour voir
                le tableau d’évolution du stock.
              </p>
            ) : (
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
                        {qual.stockName || "Stock"}
                        {qual.stockUnit ? ` (${qual.stockUnit})` : ""}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {stockSeries.map((pt) => (
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Bouton de validation + passage à la suite */}
      <section style={{ marginTop: 16, marginBottom: 32 }}>
        <button
          onClick={handleValidateAndGoNext}
          style={{
            padding: "10px 24px",
            borderRadius: 6,
            border: "none",
            backgroundColor: canValidate ? "#2563eb" : "#9ca3af",
            color: "white",
            cursor: canValidate ? "pointer" : "not-allowed",
            fontWeight: 600,
          }}
          disabled={!canValidate && !isLocked}
        >
          {isLocked
            ? "Aller au raffinement suivant"
            : "Valider ce raffinement et passer au suivant"}
        </button>
        {!canValidate && !isLocked && (
          <p
            style={{
              marginTop: 8,
              fontSize: 13,
              color: "#6b7280",
            }}
          >
            Pour valider, complétez les informations et assurez-vous que le
            tableau d’évolution du stock est calculé.
          </p>
        )}
      </section>
    </main>
  );
}

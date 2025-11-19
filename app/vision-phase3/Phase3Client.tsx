// app/vision-phase3/Phase3Client.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ModelSnapshot,
  snapshotStorageKey,
  saveSnapshotToLocalStorage,
} from "@/lib/pivot";

type ConstantKind = "fixed" | "parameter" | "transitory";

type ConstantForm = {
  value: string;
  kind: ConstantKind | "";
};

type StockRow = {
  period: number;
  start: number;
  end: number;
};

export default function Phase3Client() {
  const router = useRouter();

  // -------- Contexte problème / vision --------
  const [problemName, setProblemName] = useState("");
  const [problemShort, setProblemShort] = useState("");
  const [visionId, setVisionId] = useState("");
  const [visionName, setVisionName] = useState("");
  const [visionShort, setVisionShort] = useState("");

  // Snapshot de base (raffinement 2 idéalement, sinon 1)
  const [baseSnapshot, setBaseSnapshot] = useState<ModelSnapshot | null>(null);

  // Champs du formulaire pour les constantes
  const [initialStock, setInitialStock] = useState<ConstantForm>({
    value: "",
    kind: "",
  });
  const [inflow, setInflow] = useState<ConstantForm>({
    value: "",
    kind: "",
  });
  const [outflow, setOutflow] = useState<ConstantForm>({
    value: "",
    kind: "",
  });

  // Verrouillage du raffinement 3
  const [isLocked, setIsLocked] = useState(false);

  // --- Clés de stockage local pour ce raffinement ---
  function valuesStorageKey(visionId: string) {
    return `md_ref3_values_${visionId}`;
  }
  function lockKey(visionId: string) {
    return `md_refinement3_locked_${visionId}`;
  }

  // -------- Chargement du contexte + snapshot de base + valeurs sauvegardées --------
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
      // Verrouillage déjà posé ?
      const lockedRaw = window.localStorage.getItem(lockKey(vId));
      if (lockedRaw === "true") {
        setIsLocked(true);
      }

      // Snapshot de base : on essaie d'abord le raffinement 2, sinon le 1
      const keyRef2 = snapshotStorageKey(vId, 2);
      const keyRef1 = snapshotStorageKey(vId, 1);

      let snapshot: ModelSnapshot | null = null;
      const raw2 = window.localStorage.getItem(keyRef2);
      if (raw2) {
        snapshot = JSON.parse(raw2) as ModelSnapshot;
      } else {
        const raw1 = window.localStorage.getItem(keyRef1);
        if (raw1) {
          snapshot = JSON.parse(raw1) as ModelSnapshot;
        }
      }

      if (snapshot) {
        setBaseSnapshot(snapshot);
      }

      // Valeurs et genres éventuellement déjà saisis au raffinement 3
      const rawValues = window.localStorage.getItem(valuesStorageKey(vId));
      if (rawValues) {
        const parsed = JSON.parse(rawValues) as {
          initialStock?: ConstantForm;
          inflow?: ConstantForm;
          outflow?: ConstantForm;
        };

        if (parsed.initialStock) setInitialStock(parsed.initialStock);
        if (parsed.inflow) setInflow(parsed.inflow);
        if (parsed.outflow) setOutflow(parsed.outflow);
      } else if (snapshot) {
        // Sinon, pré-remplir à partir du snapshot de base si possible
        const p = snapshot.parameters;

        const initValue =
          p.tresorerie_initiale &&
          typeof p.tresorerie_initiale.value === "number"
            ? String(p.tresorerie_initiale.value)
            : "";

        const inflowValue =
          p.flux_entree_constant &&
          typeof p.flux_entree_constant.value === "number"
            ? String(p.flux_entree_constant.value)
            : "";

        const outflowValue =
          p.flux_sortie_constant &&
          typeof p.flux_sortie_constant.value === "number"
            ? String(p.flux_sortie_constant.value)
            : "";

        setInitialStock((prev) => ({
          ...prev,
          value: initValue,
        }));
        setInflow((prev) => ({
          ...prev,
          value: inflowValue,
        }));
        setOutflow((prev) => ({
          ...prev,
          value: outflowValue,
        }));
      }
    } catch (e) {
      console.error("Erreur lors du chargement du raffinement 3 :", e);
    }
  }, []);

  // -------- Sauvegarde automatique des valeurs / genres --------
  useEffect(() => {
    if (typeof window === "undefined" || !visionId || isLocked) return;

    try {
      const payload = {
        initialStock,
        inflow,
        outflow,
      };
      window.localStorage.setItem(
        valuesStorageKey(visionId),
        JSON.stringify(payload)
      );
    } catch (e) {
      console.error(
        "Erreur d’enregistrement des valeurs du raffinement 3 :",
        e
      );
    }
  }, [visionId, initialStock, inflow, outflow, isLocked]);

  // -------- Navigation vers le raffinement 2 (retour en arrière) --------
  function goBackToPhase2() {
    const params = new URLSearchParams({
      problemName,
      problemShort,
      visionId,
      visionName,
      visionShort,
    });
    router.push(`/vision-phase2?${params.toString()}`);
  }

  // -------- Tableau de simulation du stock --------
  const stockTable: StockRow[] | null = useMemo(() => {
    if (!baseSnapshot) return null;

    const horizon = baseSnapshot.time.horizon;
    if (!Number.isFinite(horizon) || horizon <= 0) return null;

    const init = parseFloat(initialStock.value);
    const inVal = parseFloat(inflow.value);
    const outVal = parseFloat(outflow.value);

    if (
      !Number.isFinite(init) ||
      !Number.isFinite(inVal) ||
      !Number.isFinite(outVal)
    ) {
      return null;
    }

    const rows: StockRow[] = [];
    let current = init;

    // Période 1 : part de current (début) puis ajoute (in - out) pour la fin
    for (let t = 1; t <= horizon; t++) {
      const start = current;
      const end = current + inVal - outVal;
      rows.push({ period: t, start, end });
      current = end;
    }

    return rows;
  }, [baseSnapshot, initialStock.value, inflow.value, outflow.value]);

  const canValidate =
    !!visionId &&
    !!baseSnapshot &&
    initialStock.value.trim() !== "" &&
    inflow.value.trim() !== "" &&
    outflow.value.trim() !== "" &&
    initialStock.kind &&
    inflow.kind &&
    outflow.kind &&
    stockTable !== null;

  // -------- Validation du raffinement 3 --------
  function handleValidateRefinement3() {
    if (!visionId || !baseSnapshot) {
      alert(
        "Impossible de valider ce raffinement : vision ou modèle de base introuvable."
      );
      return;
    }

    if (!canValidate) {
      alert(
        "Pour valider, complétez les valeurs et le genre de chaque constante, puis assurez-vous que le tableau est calculé."
      );
      return;
    }

    const init = parseFloat(initialStock.value);
    const inVal = parseFloat(inflow.value);
    const outVal = parseFloat(outflow.value);

    if (
      !Number.isFinite(init) ||
      !Number.isFinite(inVal) ||
      !Number.isFinite(outVal)
    ) {
      alert("Merci de saisir des valeurs numériques valides.");
      return;
    }

    // On construit un nouveau snapshot pivot pour le raffinement 3
    const prev = baseSnapshot;
    const paramsPrev = prev.parameters || {};

    const snapshot3: ModelSnapshot = {
      ...prev,
      meta: {
        ...prev.meta,
        refinementIndex: 3,
        parentRefinementIndex: prev.meta?.refinementIndex ?? 2,
        validatedAt: new Date().toISOString(),
      },
      parameters: {
        ...paramsPrev,
        tresorerie_initiale: {
          ...(paramsPrev as any).tresorerie_initiale,
          type: "number",
          value: init,
          unit: (paramsPrev as any).tresorerie_initiale?.unit,
          description:
            (paramsPrev as any).tresorerie_initiale?.description ??
            "Valeur initiale du stock principal.",
          role: initialStock.kind, // fixe / paramètre / transitoire
        },
        flux_entree_constant: {
          ...(paramsPrev as any).flux_entree_constant,
          type: "number",
          value: inVal,
          unit: (paramsPrev as any).flux_entree_constant?.unit,
          description:
            (paramsPrev as any).flux_entree_constant?.description ??
            "Flux d’entrée constant par période.",
          role: inflow.kind,
        },
        flux_sortie_constant: {
          ...(paramsPrev as any).flux_sortie_constant,
          type: "number",
          value: outVal,
          unit: (paramsPrev as any).flux_sortie_constant?.unit,
          description:
            (paramsPrev as any).flux_sortie_constant?.description ??
            "Flux de sortie constant par période.",
          role: outflow.kind,
        },
      },
    };

    saveSnapshotToLocalStorage(snapshot3);

    if (typeof window !== "undefined") {
      window.localStorage.setItem(lockKey(visionId), "true");
    }
    setIsLocked(true);

    alert(
      "Raffinement 3 enregistré : les valeurs et le genre des constantes sont désormais figés pour cette vision. Le raffinement suivant (ajout d’objectifs ou d’autres éléments) reste à implémenter."
    );
  }

  // -------- Rendu --------
  return (
    <main style={{ maxWidth: 900, margin: "32px auto", padding: "0 16px" }}>
      <button
        onClick={goBackToPhase2}
        style={{
          marginBottom: 16,
          padding: "6px 12px",
          borderRadius: 4,
          border: "1px solid #9ca3af",
          backgroundColor: "white",
          cursor: "pointer",
        }}
      >
        ← Revenir au raffinement 2
      </button>

      <h1>Raffinement 3 – Constantes et genres</h1>

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
          Ce raffinement a été validé. Les constantes et leurs genres sont
          désormais figés. Pour explorer un autre scénario, créez une nouvelle
          vision.
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

        {baseSnapshot && (
          <p style={{ marginTop: 8, fontSize: 14, color: "#4b5563" }}>
            Horizon figé : <strong>{baseSnapshot.time.horizon}</strong>{" "}
            {baseSnapshot.time.timeUnit ?? "périodes"}.
          </p>
        )}
      </section>

      {/* Explication générale */}
      <section
        style={{
          border: "1px solid #ddd",
          borderRadius: 8,
          padding: 24,
          marginBottom: 32,
        }}
      >
        <h2>But de ce raffinement</h2>
        <p style={{ marginTop: 8, fontSize: 14, color: "#4b5563" }}>
          Dans ce troisième raffinement, vous donnez des valeurs aux constantes
          de base (stock initial et flux constants) et vous indiquez leur{" "}
          <strong>genre</strong> :
        </p>
        <ul style={{ marginTop: 8, fontSize: 14, color: "#4b5563" }}>
          <li>
            <strong>Constante fixe :</strong> valeur considérée comme définitive
            pour tous les raffinements suivants.
          </li>
          <li>
            <strong>Paramètre :</strong> valeur qui pourra varier dans des tests
            ultérieurs (sensibilités, scénarios).
          </li>
          <li>
            <strong>Constante provisoire / précaire :</strong> valeur utilisée
            pour l’instant, mais qui pourra être remplacée par une structure
            plus détaillée (auxiliaires, flux détaillés…) dans un raffinement
            ultérieur.
          </li>
        </ul>
        <p style={{ marginTop: 8, fontSize: 14, color: "#4b5563" }}>
          Les valeurs servent à calculer un tableau d’évolution du stock sur
          l’horizon figé au raffinement 2.
        </p>
      </section>

      {/* Formulaire des constantes */}
      <section
        style={{
          border: "1px solid #ddd",
          borderRadius: 8,
          padding: 24,
          marginBottom: 32,
        }}
      >
        <h2>Valeurs et genre des constantes</h2>

        {!baseSnapshot ? (
          <p style={{ marginTop: 8, color: "#b91c1c" }}>
            Le modèle de base (raffinement 2) est introuvable ou incomplet.
            Revenez au raffinement 2 pour le compléter.
          </p>
        ) : (
          <>
            {/* Stock initial */}
            <div style={{ marginTop: 16 }}>
              <label
                htmlFor="initial-stock-value"
                style={{
                  display: "block",
                  fontWeight: 600,
                  marginBottom: 4,
                }}
              >
                Valeur initiale du stock
                {baseSnapshot.parameters.tresorerie_initiale?.unit
                  ? ` (en ${baseSnapshot.parameters.tresorerie_initiale.unit})`
                  : ""}
              </label>
              <input
                id="initial-stock-value"
                type="number"
                value={initialStock.value}
                onChange={(e) =>
                  setInitialStock((prev) => ({
                    ...prev,
                    value: e.target.value,
                  }))
                }
                disabled={isLocked}
                style={{
                  width: "100%",
                  padding: 8,
                  borderRadius: 4,
                  border: "1px solid #ccc",
                  backgroundColor: isLocked ? "#f9fafb" : "white",
                }}
              />

              <label
                htmlFor="initial-stock-kind"
                style={{
                  display: "block",
                  fontWeight: 600,
                  marginBottom: 4,
                  marginTop: 8,
                }}
              >
                Genre de cette constante
              </label>
              <select
                id="initial-stock-kind"
                value={initialStock.kind}
                onChange={(e) =>
                  setInitialStock((prev) => ({
                    ...prev,
                    kind: e.target.value as ConstantKind,
                  }))
                }
                disabled={isLocked}
                style={{
                  width: "100%",
                  padding: 8,
                  borderRadius: 4,
                  border: "1px solid #ccc",
                  backgroundColor: isLocked ? "#f9fafb" : "white",
                }}
              >
                <option value="">(choisir)</option>
                <option value="fixed">Constante fixe</option>
                <option value="parameter">Paramètre</option>
                <option value="transitory">
                  Constante provisoire / précaire
                </option>
              </select>
            </div>

            {/* Flux d’entrée */}
            <div style={{ marginTop: 16 }}>
              <label
                htmlFor="inflow-value"
                style={{
                  display: "block",
                  fontWeight: 600,
                  marginBottom: 4,
                }}
              >
                Flux d’entrée constant par période
                {baseSnapshot.parameters.flux_entree_constant?.unit
                  ? ` (en ${baseSnapshot.parameters.flux_entree_constant.unit})`
                  : ""}
              </label>
              <input
                id="inflow-value"
                type="number"
                value={inflow.value}
                onChange={(e) =>
                  setInflow((prev) => ({
                    ...prev,
                    value: e.target.value,
                  }))
                }
                disabled={isLocked}
                style={{
                  width: "100%",
                  padding: 8,
                  borderRadius: 4,
                  border: "1px solid #ccc",
                  backgroundColor: isLocked ? "#f9fafb" : "white",
                }}
              />

              <label
                htmlFor="inflow-kind"
                style={{
                  display: "block",
                  fontWeight: 600,
                  marginBottom: 4,
                  marginTop: 8,
                }}
              >
                Genre de cette constante
              </label>
              <select
                id="inflow-kind"
                value={inflow.kind}
                onChange={(e) =>
                  setInflow((prev) => ({
                    ...prev,
                    kind: e.target.value as ConstantKind,
                  }))
                }
                disabled={isLocked}
                style={{
                  width: "100%",
                  padding: 8,
                  borderRadius: 4,
                  border: "1px solid #ccc",
                  backgroundColor: isLocked ? "#f9fafb" : "white",
                }}
              >
                <option value="">(choisir)</option>
                <option value="fixed">Constante fixe</option>
                <option value="parameter">Paramètre</option>
                <option value="transitory">
                  Constante provisoire / précaire
                </option>
              </select>
            </div>

            {/* Flux de sortie */}
            <div style={{ marginTop: 16 }}>
              <label
                htmlFor="outflow-value"
                style={{
                  display: "block",
                  fontWeight: 600,
                  marginBottom: 4,
                }}
              >
                Flux de sortie constant par période
                {baseSnapshot.parameters.flux_sortie_constant?.unit
                  ? ` (en ${baseSnapshot.parameters.flux_sortie_constant.unit})`
                  : ""}
              </label>
              <input
                id="outflow-value"
                type="number"
                value={outflow.value}
                onChange={(e) =>
                  setOutflow((prev) => ({
                    ...prev,
                    value: e.target.value,
                  }))
                }
                disabled={isLocked}
                style={{
                  width: "100%",
                  padding: 8,
                  borderRadius: 4,
                  border: "1px solid #ccc",
                  backgroundColor: isLocked ? "#f9fafb" : "white",
                }}
              />

              <label
                htmlFor="outflow-kind"
                style={{
                  display: "block",
                  fontWeight: 600,
                  marginBottom: 4,
                  marginTop: 8,
                }}
              >
                Genre de cette constante
              </label>
              <select
                id="outflow-kind"
                value={outflow.kind}
                onChange={(e) =>
                  setOutflow((prev) => ({
                    ...prev,
                    kind: e.target.value as ConstantKind,
                  }))
                }
                disabled={isLocked}
                style={{
                  width: "100%",
                  padding: 8,
                  borderRadius: 4,
                  border: "1px solid #ccc",
                  backgroundColor: isLocked ? "#f9fafb" : "white",
                }}
              >
                <option value="">(choisir)</option>
                <option value="fixed">Constante fixe</option>
                <option value="parameter">Paramètre</option>
                <option value="transitory">
                  Constante provisoire / précaire
                </option>
              </select>
            </div>
          </>
        )}
      </section>

      {/* Tableau d'évolution du stock */}
      <section
        style={{
          border: "1px solid #ddd",
          borderRadius: 8,
          padding: 24,
          marginBottom: 32,
        }}
      >
        <h2>Évolution du stock sur l’horizon</h2>
        {!stockTable ? (
          <p style={{ marginTop: 8, fontSize: 14, color: "#6b7280" }}>
            Pour afficher le tableau, saisissez des valeurs numériques pour le
            stock initial et les flux. Le calcul utilise l’horizon figé au
            raffinement 2.
          </p>
        ) : (
          <div style={{ marginTop: 12, overflowX: "auto" }}>
            <table
              style={{
                borderCollapse: "collapse",
                width: "100%",
                minWidth: 420,
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
                    Stock en début de période
                  </th>
                  <th
                    style={{
                      border: "1px solid #e5e7eb",
                      padding: "4px 8px",
                      textAlign: "left",
                    }}
                  >
                    Stock en fin de période
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
                      {row.end.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Validation du raffinement */}
      <section style={{ marginBottom: 40 }}>
        <button
          onClick={handleValidateRefinement3}
          disabled={!canValidate || isLocked}
          style={{
            padding: "10px 24px",
            borderRadius: 6,
            border: "none",
            backgroundColor:
              !canValidate || isLocked ? "#9ca3af" : "#2563eb",
            color: "white",
            cursor: !canValidate || isLocked ? "not-allowed" : "pointer",
            fontWeight: 600,
          }}
        >
          {isLocked
            ? "Raffinement 3 déjà validé"
            : "Valider ce raffinement (préparer le suivant)"}
        </button>
        {!isLocked && !canValidate && (
          <p
            style={{
              marginTop: 8,
              fontSize: 13,
              color: "#6b7280",
            }}
          >
            Pour valider, complétez les valeurs, choisissez un genre pour chaque
            constante et assurez-vous que le tableau d’évolution du stock est
            calculé.
          </p>
        )}
      </section>
    </main>
  );
}

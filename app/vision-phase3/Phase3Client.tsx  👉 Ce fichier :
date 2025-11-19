// app/vision-phase3/Phase3Client.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type NamesData = {
  stockName: string;
  stockUnit: string;
  inflowName: string;
  outflowName: string;
  initialStockName: string;
};

type Phase2Data = {
  timeUnit: string;
  horizon: string;
};

type ConstantKind = "fixed" | "parameter" | "provisional";

type ConstantInput = {
  value: string;
  kind: ConstantKind | "";
};

type StockRow = {
  period: number;       // 1, 2, 3, ...
  stockStart: number;   // début de période
  stockEnd: number;     // fin de période
  inflow: number;
  outflow: number;
  delta: number;        // inflow - outflow
};

export default function Phase3Client() {
  const router = useRouter();

  // Contexte problème + vision
  const [problemName, setProblemName] = useState("");
  const [problemShort, setProblemShort] = useState("");
  const [visionId, setVisionId] = useState("");
  const [visionName, setVisionName] = useState("");
  const [visionShort, setVisionShort] = useState("");

  // Noms figés (raffinement 1)
  const [names, setNames] = useState<NamesData | null>(null);

  // Données figées du raffinement 2 (horizon + unité de temps)
  const [phase2, setPhase2] = useState<Phase2Data | null>(null);

  // Données du raffinement 3
  const [initialStock, setInitialStock] = useState<ConstantInput>({
    value: "",
    kind: "",
  });
  const [inflow, setInflow] = useState<ConstantInput>({
    value: "",
    kind: "",
  });
  const [outflow, setOutflow] = useState<ConstantInput>({
    value: "",
    kind: "",
  });

  const [isLocked, setIsLocked] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Clés de stockage
  function namesStorageKey(vId: string) {
    return `md_phase1_names_${vId}`;
  }
  function phase2StorageKey(vId: string) {
    return `md_phase2_exploration_${vId}`;
  }
  function phase3StorageKey(vId: string) {
    return `md_phase3_constants_${vId}`;
  }
  function lockKey(vId: string) {
    return `md_refinement3_locked_${vId}`;
  }

  // Charger contexte + données sauvegardées
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

    if (!vId) {
      setLoaded(true);
      return;
    }

    try {
      // Verrouillage
      const lockedRaw = window.localStorage.getItem(lockKey(vId));
      if (lockedRaw === "true") {
        setIsLocked(true);
      }

      // Noms (raffinement 1)
      const rawNames = window.localStorage.getItem(namesStorageKey(vId));
      if (rawNames) {
        const parsed = JSON.parse(rawNames) as NamesData;
        setNames(parsed);
      }

      // Données du raffinement 2
      const rawPhase2 = window.localStorage.getItem(phase2StorageKey(vId));
      if (rawPhase2) {
        const parsed = JSON.parse(rawPhase2) as Partial<Phase2Data & {
          initialStock?: string;
          inflow?: string;
          outflow?: string;
        }>;
        setPhase2({
          timeUnit: parsed.timeUnit ?? "",
          horizon: parsed.horizon ?? "",
        });

        // On peut pré-remplir les valeurs du raffinement 3 avec les dernières valeurs explorées
        if (!isLocked) {
          if (parsed.initialStock) {
            setInitialStock((prev) => ({ ...prev, value: parsed.initialStock! }));
          }
          if (parsed.inflow) {
            setInflow((prev) => ({ ...prev, value: parsed.inflow! }));
          }
          if (parsed.outflow) {
            setOutflow((prev) => ({ ...prev, value: parsed.outflow! }));
          }
        }
      }

      // Données déjà figées du raffinement 3 (si on revient après validation)
      const rawPhase3 = window.localStorage.getItem(phase3StorageKey(vId));
      if (rawPhase3) {
        const parsed = JSON.parse(rawPhase3) as {
          initialStock: ConstantInput;
          inflow: ConstantInput;
          outflow: ConstantInput;
        };
        setInitialStock(parsed.initialStock);
        setInflow(parsed.inflow);
        setOutflow(parsed.outflow);
      }
    } catch (e) {
      console.error("Erreur de chargement des données du raffinement 3 :", e);
    } finally {
      setLoaded(true);
    }
  }, []);

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

  // Calcul du tableau d'évolution
  const rows: StockRow[] | null = useMemo(() => {
    if (!phase2) return null;

    const horizon = parseInt(phase2.horizon, 10);
    const initial = parseFloat(initialStock.value);
    const inflowVal = parseFloat(inflow.value);
    const outflowVal = parseFloat(outflow.value);

    if (
      !Number.isFinite(horizon) ||
      horizon <= 0 ||
      !Number.isFinite(initial) ||
      !Number.isFinite(inflowVal) ||
      !Number.isFinite(outflowVal)
    ) {
      return null;
    }

    const result: StockRow[] = [];
    let current = initial; // stock au début de la période 1

    for (let period = 1; period <= horizon; period++) {
      const stockStart = current;
      const delta = inflowVal - outflowVal;
      const stockEnd = stockStart + delta;

      result.push({
        period,
        stockStart,
        stockEnd,
        inflow: inflowVal,
        outflow: outflowVal,
        delta,
      });

      current = stockEnd;
    }

    return result;
  }, [phase2, initialStock.value, inflow.value, outflow.value]);

  const canValidate =
    phase2 !== null &&
    !!initialStock.value.trim() &&
    !!inflow.value.trim() &&
    !!outflow.value.trim() &&
    rows !== null;

  function renderKindLabel(kind: ConstantKind | ""): string {
    if (kind === "fixed") return "Constante fixe";
    if (kind === "parameter") return "Paramètre (peut varier plus tard)";
    if (kind === "provisional") return "Constante provisoire";
    return "(non précisé : sera considéré comme provisoire)";
  }

  function handleKindChange(
    setter: (fn: (prev: ConstantInput) => ConstantInput),
    value: ConstantKind
  ) {
    setter((prev) => ({ ...prev, kind: value }));
  }

  function handleValidate() {
    if (!visionId) {
      alert("Vision introuvable. Revenez à la liste des visions.");
      return;
    }

    if (!phase2) {
      alert(
        "Les informations du raffinement 2 (horizon, unité de temps) sont introuvables. Revenez d’abord au raffinement 2."
      );
      return;
    }

    if (!canValidate) {
      alert(
        "Merci de saisir des valeurs numériques valides pour le stock de départ et les flux, afin de calculer le tableau d’évolution."
      );
      return;
    }

    const horizon = parseInt(phase2.horizon, 10);
    const initialVal = parseFloat(initialStock.value);
    const inflowVal = parseFloat(inflow.value);
    const outflowVal = parseFloat(outflow.value);

    if (
      !Number.isFinite(horizon) ||
      horizon <= 0 ||
      !Number.isFinite(initialVal) ||
      !Number.isFinite(inflowVal) ||
      !Number.isFinite(outflowVal)
    ) {
      alert(
        "Certaines valeurs ne sont pas valides. Vérifiez les nombres saisis."
      );
      return;
    }

    // Si aucun genre n'est précisé, on considère la constante comme provisoire
    const effectiveInitial: ConstantInput = {
      value: initialStock.value,
      kind: initialStock.kind || "provisional",
    };
    const effectiveInflow: ConstantInput = {
      value: inflow.value,
      kind: inflow.kind || "provisional",
    };
    const effectiveOutflow: ConstantInput = {
      value: outflow.value,
      kind: outflow.kind || "provisional",
    };

    const payload = {
      timeUnit: phase2.timeUnit,
      horizon: phase2.horizon,
      initialStock: effectiveInitial,
      inflow: effectiveInflow,
      outflow: effectiveOutflow,
      validatedAt: new Date().toISOString(),
    };

    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          phase3StorageKey(visionId),
          JSON.stringify(payload)
        );
        window.localStorage.setItem(lockKey(visionId), "true");
      }
      setIsLocked(true);
      alert(
        "Raffinement 3 validé. Les constantes marquées comme fixes sont désormais figées pour cette vision. Les prochains raffinements pourront introduire un objectif minimal et une structure plus détaillée."
      );
    } catch (e) {
      console.error("Erreur lors de l’enregistrement du raffinement 3 :", e);
      alert(
        "Une erreur est survenue lors de la validation. Vos données peuvent ne pas avoir été sauvegardées."
      );
    }
  }

  if (!loaded) {
    return (
      <main style={{ padding: 20 }}>
        <p>Chargement…</p>
      </main>
    );
  }

  if (!visionId) {
    return (
      <main style={{ padding: 20 }}>
        <p>
          Vision introuvable. Revenez à la liste des visions et relancez le
          raffinement 3.
        </p>
      </main>
    );
  }

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
        ← Revenir au raffinement 2 (exploration)
      </button>

      <h1>Raffinement 3 – Premières valeurs officielles</h1>

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
          Ce raffinement a été validé. Les constantes marquées comme fixes sont
          désormais figées. Vous pouvez consulter les valeurs, mais plus les
          modifier. Les raffinement suivants introduiront un objectif minimal et
          d’éventuelles extensions du modèle.
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

        {phase2 && (
          <p style={{ marginTop: 8, fontSize: 14, color: "#4b5563" }}>
            <strong>Cadre temporel (défini au raffinement 2) :</strong>{" "}
            horizon = {phase2.horizon}{" "}
            {phase2.timeUnit || "périodes"}.
          </p>
        )}
      </section>

      {/* Constantes du modèle */}
      <section
        style={{
          border: "1px solid #ddd",
          borderRadius: 8,
          padding: 24,
          marginBottom: 32,
        }}
      >
        <h2>Constantes de base pour cette vision</h2>

        <p style={{ fontSize: 14, color: "#4b5563", marginTop: 8 }}>
          Vous définissez ici la première version chiffrée de cette vision :
          stock de départ et flux constants. Pour chaque constante, vous pouvez
          indiquer si, dans votre esprit, elle est :
          <br />
          – <strong>fixe</strong> (ne changera plus),<br />
          – <strong>paramètre</strong> (servira à tester plusieurs valeurs),<br />
          – <strong>provisoire</strong> (sera peut-être détaillée ou
          transformée plus tard).
          <br />
          Si vous ne précisez rien, la constante sera considérée comme
          provisoire.
        </p>

        {/* Stock de départ */}
        <div style={{ marginTop: 16 }}>
          <h3>
            {names?.initialStockName || "Stock de départ"}{" "}
            {names?.stockUnit ? `(${names.stockUnit})` : ""}
          </h3>

          <div style={{ marginTop: 8 }}>
            <label
              htmlFor="initialStockValue"
              style={{ display: "block", fontWeight: 600, marginBottom: 4 }}
            >
              Valeur du stock de départ
            </label>
            <input
              id="initialStockValue"
              type="number"
              value={initialStock.value}
              onChange={(e) =>
                setInitialStock((prev) => ({ ...prev, value: e.target.value }))
              }
              disabled={isLocked}
              placeholder="Ex : 3000"
              style={{
                width: "100%",
                padding: 8,
                borderRadius: 4,
                border: "1px solid #ccc",
                backgroundColor: isLocked ? "#f9fafb" : "white",
              }}
            />
          </div>

          <div style={{ marginTop: 8 }}>
            <span style={{ fontWeight: 600, marginRight: 8 }}>Genre :</span>
            <label style={{ marginRight: 12 }}>
              <input
                type="radio"
                name="initial-kind"
                disabled={isLocked}
                checked={initialStock.kind === "fixed"}
                onChange={() =>
                  handleKindChange(setInitialStock, "fixed")
                }
              />{" "}
              Constante fixe
            </label>
            <label style={{ marginRight: 12 }}>
              <input
                type="radio"
                name="initial-kind"
                disabled={isLocked}
                checked={initialStock.kind === "parameter"}
                onChange={() =>
                  handleKindChange(setInitialStock, "parameter")
                }
              />{" "}
              Paramètre
            </label>
            <label>
              <input
                type="radio"
                name="initial-kind"
                disabled={isLocked}
                checked={initialStock.kind === "provisional"}
                onChange={() =>
                  handleKindChange(setInitialStock, "provisional")
                }
              />{" "}
              Constante provisoire
            </label>
            <p style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
              {renderKindLabel(initialStock.kind)}
            </p>
          </div>
        </div>

        {/* Flux d’entrée */}
        <div style={{ marginTop: 20 }}>
          <h3>
            {names?.inflowName || "Flux d’entrée"}{" "}
            {names?.stockUnit ? `(${names.stockUnit} par ${phase2?.timeUnit || "période"})` : ""}
          </h3>

          <div style={{ marginTop: 8 }}>
            <label
              htmlFor="inflowValue"
              style={{ display: "block", fontWeight: 600, marginBottom: 4 }}
            >
              Valeur du flux d’entrée
            </label>
            <input
              id="inflowValue"
              type="number"
              value={inflow.value}
              onChange={(e) =>
                setInflow((prev) => ({ ...prev, value: e.target.value }))
              }
              disabled={isLocked}
              placeholder="Ex : 3000"
              style={{
                width: "100%",
                padding: 8,
                borderRadius: 4,
                border: "1px solid #ccc",
                backgroundColor: isLocked ? "#f9fafb" : "white",
              }}
            />
          </div>

          <div style={{ marginTop: 8 }}>
            <span style={{ fontWeight: 600, marginRight: 8 }}>Genre :</span>
            <label style={{ marginRight: 12 }}>
              <input
                type="radio"
                name="inflow-kind"
                disabled={isLocked}
                checked={inflow.kind === "fixed"}
                onChange={() => handleKindChange(setInflow, "fixed")}
              />{" "}
              Constante fixe
            </label>
            <label style={{ marginRight: 12 }}>
              <input
                type="radio"
                name="inflow-kind"
                disabled={isLocked}
                checked={inflow.kind === "parameter"}
                onChange={() => handleKindChange(setInflow, "parameter")}
              />{" "}
              Paramètre
            </label>
            <label>
              <input
                type="radio"
                name="inflow-kind"
                disabled={isLocked}
                checked={inflow.kind === "provisional"}
                onChange={() =>
                  handleKindChange(setInflow, "provisional")
                }
              />{" "}
              Constante provisoire
            </label>
            <p style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
              {renderKindLabel(inflow.kind)}
            </p>
          </div>
        </div>

        {/* Flux de sortie */}
        <div style={{ marginTop: 20 }}>
          <h3>
            {names?.outflowName || "Flux de sortie"}{" "}
            {names?.stockUnit ? `(${names.stockUnit} par ${phase2?.timeUnit || "période"})` : ""}
          </h3>

          <div style={{ marginTop: 8 }}>
            <label
              htmlFor="outflowValue"
              style={{ display: "block", fontWeight: 600, marginBottom: 4 }}
            >
              Valeur du flux de sortie
            </label>
            <input
              id="outflowValue"
              type="number"
              value={outflow.value}
              onChange={(e) =>
                setOutflow((prev) => ({ ...prev, value: e.target.value }))
              }
              disabled={isLocked}
              placeholder="Ex : 2500"
              style={{
                width: "100%",
                padding: 8,
                borderRadius: 4,
                border: "1px solid #ccc",
                backgroundColor: isLocked ? "#f9fafb" : "white",
              }}
            />
          </div>

          <div style={{ marginTop: 8 }}>
            <span style={{ fontWeight: 600, marginRight: 8 }}>Genre :</span>
            <label style={{ marginRight: 12 }}>
              <input
                type="radio"
                name="outflow-kind"
                disabled={isLocked}
                checked={outflow.kind === "fixed"}
                onChange={() =>
                  handleKindChange(setOutflow, "fixed")
                }
              />{" "}
              Constante fixe
            </label>
            <label style={{ marginRight: 12 }}>
              <input
                type="radio"
                name="outflow-kind"
                disabled={isLocked}
                checked={outflow.kind === "parameter"}
                onChange={() =>
                  handleKindChange(setOutflow, "parameter")
                }
              />{" "}
              Paramètre
            </label>
            <label>
              <input
                type="radio"
                name="outflow-kind"
                disabled={isLocked}
                checked={outflow.kind === "provisional"}
                onChange={() =>
                  handleKindChange(setOutflow, "provisional")
                }
              />{" "}
              Constante provisoire
            </label>
            <p style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
              {renderKindLabel(outflow.kind)}
            </p>
          </div>
        </div>
      </section>

      {/* Tableau d'évolution */}
      <section style={{ marginBottom: 32 }}>
        <h2>Tableau d’évolution du stock</h2>

        {!rows || !phase2 ? (
          <p
            style={{
              marginTop: 8,
              fontSize: 14,
              color: "#6b7280",
            }}
          >
            Pour voir le tableau, vérifiez que l’horizon et l’unité de temps ont
            été définis au raffinement 2, et saisissez des valeurs numériques
            pour le stock de départ et les flux.
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
              Le tableau ci-dessous montre, pour chaque période numérotée de 1 à{" "}
              {phase2.horizon}, le stock au début et à la fin de la période,
              ainsi que les flux et la variation nette, selon les valeurs que
              vous avez saisies.
            </p>

            <div style={{ marginTop: 12, overflowX: "auto" }}>
              <table
                style={{
                  borderCollapse: "collapse",
                  width: "100%",
                  minWidth: 560,
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
                      Variation nette (entrée - sortie)
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
                  {rows.map((row) => (
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
                        {row.stockStart.toFixed(2)}
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
                        {row.stockEnd.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      {/* Validation */}
      <section style={{ marginBottom: 40 }}>
        <button
          onClick={handleValidate}
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
          Valider ce raffinement (les constantes fixes seront figées)
        </button>
        {!canValidate && !isLocked && (
          <p
            style={{
              marginTop: 8,
              fontSize: 13,
              color: "#6b7280",
            }}
          >
            Pour valider, assurez-vous que l’horizon est défini au raffinement 2
            et que les valeurs numériques du stock de départ et des flux
            permettent de calculer le tableau.
          </p>
        )}
      </section>
    </main>
  );
}

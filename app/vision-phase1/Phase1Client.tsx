"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type NamesData = {
  stockName: string;
  stockUnit: string;
  inflowName: string;
  outflowName: string;
  initialStockName: string;
};

export default function Phase1Client() {
  const router = useRouter();

  // Contexte problème + vision
  const [problemName, setProblemName] = useState("");
  const [problemShort, setProblemShort] = useState("");
  const [visionId, setVisionId] = useState("");
  const [visionName, setVisionName] = useState("");
  const [visionShort, setVisionShort] = useState("");

  // Données du raffinement 1 (uniquement qualitatif)
  const [names, setNames] = useState<NamesData>({
    stockName: "",
    stockUnit: "",
    inflowName: "",
    outflowName: "",
    initialStockName: "",
  });

  // Verrouillage
  const [isLocked, setIsLocked] = useState(false);

  // --- Helpers stockage ---
  function namesStorageKey(vId: string) {
    return `md_phase1_names_${vId}`;
  }
  function lockKey(vId: string) {
    return `md_refinement1_locked_${vId}`;
  }

  // --- Charger le contexte ---
  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);

    setProblemName(params.get("problemName") ?? "");
    setProblemShort(params.get("problemShort") ?? "");
    setVisionId(params.get("visionId") ?? "");
    setVisionName(params.get("visionName") ?? "");
    setVisionShort(params.get("visionShort") ?? "");
  }, []);

  // --- CORRECTION : Recharger les noms figés même après validation ---
  useEffect(() => {
    if (typeof window === "undefined" || !visionId) return;

    try {
      const locked = window.localStorage.getItem(lockKey(visionId)) === "true";
      setIsLocked(locked);

      const raw = window.localStorage.getItem(namesStorageKey(visionId));
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<NamesData>;
        setNames((prev) => ({ ...prev, ...parsed }));
      }
    } catch (e) {
      console.error("Erreur chargement Phase1 :", e);
    }

  }, [visionId, isLocked]);

  // Auto-générer le nom du stock de départ
  const initialStockAutoName =
    names.stockName.trim() === ""
      ? ""
      : `${names.stockName.trim()} de départ`;

  // Sauvegarde auto uniquement si non verrouillé
  useEffect(() => {
    if (typeof window === "undefined" || !visionId || isLocked) return;

    try {
      const dataToSave = {
        ...names,
        initialStockName: initialStockAutoName,
      };
      window.localStorage.setItem(
        namesStorageKey(visionId),
        JSON.stringify(dataToSave)
      );
    } catch (e) {
      console.error("Erreur sauvegarde Phase1 :", e);
    }
  }, [visionId, names, initialStockAutoName, isLocked]);

  function goBackToVisions() {
    const params = new URLSearchParams({
      problemName,
      problemShort,
    });
    router.push(`/visions?${params.toString()}`);
  }

  function validatePhase1() {
    if (!visionId) return;

    if (!names.stockName.trim() || !names.stockUnit.trim()) {
      alert("Merci d’indiquer un nom de stock et une unité.");
      return;
    }
    if (!names.inflowName.trim() || !names.outflowName.trim()) {
      alert("Merci de nommer les flux associés.");
      return;
    }

    try {
      const dataToSave = {
        ...names,
        initialStockName: initialStockAutoName,
      };
      window.localStorage.setItem(
        namesStorageKey(visionId),
        JSON.stringify(dataToSave)
      );
      window.localStorage.setItem(lockKey(visionId), "true");
      setIsLocked(true);
      alert("Raffinement 1 validé : les noms sont maintenant figés.");
    } catch (e) {
      console.error("Erreur validation Phase1 :", e);
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
        ← Revenir à la liste des visions
      </button>

      <h1>Premier raffinement de la vision – Noms du système</h1>

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
          Ce raffinement a été validé. Les noms sont désormais figés.
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
          <strong>Vision :</strong> {visionName}
        </p>
        {visionShort && (
          <p>
            <strong>Définition courte de la vision :</strong> {visionShort}
          </p>
        )}
      </section>

      {/* --- Raffinement 1 : Nommage du système --- */}
      <section
        style={{
          border: "1px solid #ddd",
          borderRadius: 8,
          padding: 24,
          marginBottom: 32,
        }}
      >

        <h2>Raffinement 1 – Nommer le système</h2>

        <p style={{ fontSize: 14, color: "#4b5563", marginTop: 8 }}>
          Ce premier raffinement est uniquement qualitatif. Vous choisissez les
          noms du stock principal et des flux. Ces noms seront figés pour toute
          cette vision.
        </p>

        {/* Stock principal */}
        <div style={{ marginTop: 16 }}>
          <label
            htmlFor="stockName"
            style={{ display: "block", fontWeight: 600, marginBottom: 4 }}
          >
            Nom du stock principal
          </label>
          <input
            id="stockName"
            type="text"
            disabled={isLocked}
            value={names.stockName}
            onChange={(e) =>
              setNames((p) => ({ ...p, stockName: e.target.value }))
            }
            placeholder="Ex : Trésorerie"
            style={{
              width: "100%",
              padding: 8,
              borderRadius: 4,
              border: "1px solid #ccc",
              backgroundColor: isLocked ? "#f3f4f6" : "white",
            }}
          />
        </div>

        {/* Unité du stock */}
        <div style={{ marginTop: 12 }}>
          <label
            htmlFor="stockUnit"
            style={{ display: "block", fontWeight: 600, marginBottom: 4 }}
          >
            Unité du stock
          </label>
          <input
            id="stockUnit"
            type="text"
            disabled={isLocked}
            value={names.stockUnit}
            onChange={(e) =>
              setNames((p) => ({ ...p, stockUnit: e.target.value }))
            }
            placeholder="Ex : euros"
            style={{
              width: "100%",
              padding: 8,
              borderRadius: 4,
              border: "1px solid #ccc",
              backgroundColor: isLocked ? "#f3f4f6" : "white",
            }}
          />
        </div>

        {/* Nom initial du stock */}
        <div style={{ marginTop: 16 }}>
          <p
            style={{
              fontWeight: 600,
              marginBottom: 4,
            }}
          >
            Nom du stock de départ : (généré automatiquement)
          </p>
          <div
            style={{
              padding: "8px 12px",
              backgroundColor: "#f9fafb",
              borderRadius: 4,
              border: "1px solid #d1d5db",
              fontStyle: "italic",
            }}
          >
            {initialStockAutoName || "(en attente du nom du stock principal)"}
          </div>
        </div>

        {/* Flux d’entrée */}
        <div style={{ marginTop: 16 }}>
          <label
            htmlFor="inflowName"
            style={{ display: "block", fontWeight: 600, marginBottom: 4 }}
          >
            Nom du flux d’entrée
          </label>
          <input
            id="inflowName"
            type="text"
            disabled={isLocked}
            value={names.inflowName}
            onChange={(e) =>
              setNames((p) => ({ ...p, inflowName: e.target.value }))
            }
            placeholder="Ex : salaires, recettes, ventes"
            style={{
              width: "100%",
              padding: 8,
              borderRadius: 4,
              border: "1px solid #ccc",
              backgroundColor: isLocked ? "#f3f4f6" : "white",
            }}
          />
        </div>

        {/* Flux de sortie */}
        <div style={{ marginTop: 12 }}>
          <label
            htmlFor="outflowName"
            style={{ display: "block", fontWeight: 600, marginBottom: 4 }}
          >
            Nom du flux de sortie
          </label>
          <input
            id="outflowName"
            type="text"
            disabled={isLocked}
            value={names.outflowName}
            onChange={(e) =>
              setNames((p) => ({ ...p, outflowName: e.target.value }))
            }
            placeholder="Ex : dépenses, coûts fixes"
            style={{
              width: "100%",
              padding: 8,
              borderRadius: 4,
              border: "1px solid #ccc",
              backgroundColor: isLocked ? "#f3f4f6" : "white",
            }}
          />
        </div>

      </section>

      {/* --- Bouton validation --- */}
      <section style={{ marginBottom: 32 }}>
        {!isLocked ? (
          <button
            onClick={validatePhase1}
            style={{
              padding: "10px 24px",
              borderRadius: 6,
              border: "none",
              backgroundColor: "#2563eb",
              color: "white",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Valider ce raffinement
          </button>
        ) : (
          <button
            onClick={() => {
              const params = new URLSearchParams({
                problemName,
                problemShort,
                visionId,
                visionName,
                visionShort,
              });
              router.push(`/vision-phase2?${params.toString()}`);
            }}
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
            Aller au raffinement suivant
          </button>
        )}
      </section>
    </main>
  );
}

// app/vision-phase1/Phase1Client.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type NamesData = {
  stockName: string;
  stockUnit: string;
  inflowName: string;
  outflowName: string;
};

export default function Phase1Client() {
  const router = useRouter();

  // Contexte problème + vision
  const [problemName, setProblemName] = useState("");
  const [problemShort, setProblemShort] = useState("");
  const [visionId, setVisionId] = useState("");
  const [visionName, setVisionName] = useState("");
  const [visionShort, setVisionShort] = useState("");

  // Données du raffinement 1 (purement qualitatives)
  const [names, setNames] = useState<NamesData>({
    stockName: "",
    stockUnit: "",
    inflowName: "",
    outflowName: "",
  });

  // Raffinement verrouillé ?
  const [isLocked, setIsLocked] = useState(false);

  // Helpers localStorage
  function namesStorageKey(visionId: string) {
    return `md_phase1_names_${visionId}`;
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

      // Noms déjà saisis
      const rawNames = window.localStorage.getItem(namesStorageKey(vId));
      if (rawNames) {
        const parsed = JSON.parse(rawNames) as Partial<NamesData>;
        setNames((prev) => ({ ...prev, ...parsed }));
      }
    } catch (e) {
      console.error("Erreur de chargement des données du raffinement 1 :", e);
    }
  }, []);

  // Sauvegarde auto des noms
  useEffect(() => {
    if (typeof window === "undefined" || !visionId || isLocked) return;
    try {
      window.localStorage.setItem(
        namesStorageKey(visionId),
        JSON.stringify(names)
      );
    } catch (e) {
      console.error(
        "Erreur d’enregistrement des noms du raffinement 1 :",
        e
      );
    }
  }, [visionId, names, isLocked]);

  function goBackToVisions() {
    const params = new URLSearchParams({
      problemName,
      problemShort,
    });
      // Retour à la liste des visions pour ce problème
    router.push(`/visions?${params.toString()}`);
  }

  // Nom du stock de départ : dérivé automatiquement
  const initialStockDisplayName = names.stockName
    ? `${names.stockName} de départ`
    : "(sera dérivé du nom du stock principal)";

  const canValidate =
    !!names.stockName.trim() &&
    !!names.stockUnit.trim() &&
    !!names.inflowName.trim() &&
    !!names.outflowName.trim() &&
    !!visionId;

  function handleValidateAndGoNext() {
    if (!visionId) {
      alert("Vision introuvable. Revenez à la liste des visions.");
      return;
    }

    if (isLocked) {
      // Déjà validé : on va simplement au raffinement suivant
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
        "Merci de compléter tous les noms (stock, unité du stock, flux d’entrée et flux de sortie) avant de valider."
      );
      return;
    }

    try {
      // On s’assure que les noms sont bien sauvegardés
      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          namesStorageKey(visionId),
          JSON.stringify(names)
        );
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
      router.push(`/vision-phase2?${params.toString()}`);
    } catch (e) {
      console.error("Erreur lors de la validation du raffinement 1 :", e);
      alert(
        "Une erreur est survenue lors de la validation de ce raffinement. Réessayez ou revenez plus tard."
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
          Ce raffinement a été validé. Les noms sont désormais figés. Pour
          explorer une autre façon de représenter le système, créez une nouvelle
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
      </section>

      {/* Raffinement 1 : noms seulement */}
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
          Ce premier raffinement est uniquement qualitatif. Vous choisissez
          comment vous nommez le stock principal et les flux associés. Ces noms
          resteront figés pour toute cette vision et serviront de langage
          commun pour les raffinements suivants.
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
            value={names.stockName}
            onChange={(e) =>
              setNames((prev) => ({ ...prev, stockName: e.target.value }))
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
            value={names.stockUnit}
            onChange={(e) =>
              setNames((prev) => ({ ...prev, stockUnit: e.target.value }))
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

        <div
          style={{
            marginTop: 16,
            padding: 12,
            borderRadius: 6,
            backgroundColor: "#f9fafb",
            border: "1px solid #e5e7eb",
            fontSize: 14,
          }}
        >
          <strong>Nom du stock de départ :</strong>{" "}
          <span>{initialStockDisplayName}</span>
          <p style={{ marginTop: 4, color: "#6b7280" }}>
            Ce nom est dérivé automatiquement du nom du stock principal (par
            exemple : « trésorerie de départ »). Vous n’avez rien à saisir
            ici : cela évite des incohérences de vocabulaire.
          </p>
        </div>

        <div style={{ marginTop: 16 }}>
          <label
            htmlFor="inflow-name"
            style={{ display: "block", fontWeight: 600, marginBottom: 4 }}
          >
            Nom du flux d’entrée
          </label>
          <input
            id="inflow-name"
            type="text"
            value={names.inflowName}
            onChange={(e) =>
              setNames((prev) => ({ ...prev, inflowName: e.target.value }))
            }
            placeholder="Ex : Revenus nets mensuels"
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
            htmlFor="outflow-name"
            style={{ display: "block", fontWeight: 600, marginBottom: 4 }}
          >
            Nom du flux de sortie
          </label>
          <input
            id="outflow-name"
            type="text"
            value={names.outflowName}
            onChange={(e) =>
              setNames((prev) => ({ ...prev, outflowName: e.target.value }))
            }
            placeholder="Ex : Dépenses courantes"
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

        <p
          style={{
            marginTop: 16,
            fontSize: 13,
            color: "#6b7280",
          }}
        >
          Une fois ce raffinement validé, ces noms seront figés pour toute cette
          vision. Si vous souhaitez explorer une autre façon de nommer le
          système, vous pourrez créer une nouvelle vision.
        </p>
      </section>

      {/* Bouton de validation + passage à la suite */}
      <section style={{ marginTop: 16, marginBottom: 32 }}>
        <button
          onClick={handleValidateAndGoNext}
          style={{
            padding: "10px 24px",
            borderRadius: 6,
            border: "none",
            backgroundColor: canValidate || isLocked ? "#2563eb" : "#9ca3af",
            color: "white",
            cursor: canValidate || isLocked ? "pointer" : "not-allowed",
            fontWeight: 600,
          }}
          disabled={!canValidate && !isLocked}
        >
          {isLocked
            ? "Aller au raffinement suivant"
            : "Valider ces noms et passer au raffinement suivant"}
        </button>
        {!canValidate && !isLocked && (
          <p
            style={{
              marginTop: 8,
              fontSize: 13,
              color: "#6b7280",
            }}
          >
            Pour valider, complétez le nom du stock principal, son unité et les
            noms des flux d’entrée et de sortie.
          </p>
        )}
      </section>
    </main>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type RefinementPart1 = {
  userText: string;
};

type RefinementData = {
  part1: RefinementPart1;
};

function storageKey(visionId: string) {
  return `md_refinement2_v1_${visionId}`;
}

export default function Phase2Client() {
  const router = useRouter();

  const [problemName, setProblemName] = useState("");
  const [problemShort, setProblemShort] = useState("");
  const [visionId, setVisionId] = useState("");
  const [visionName, setVisionName] = useState("");
  const [visionShort, setVisionShort] = useState("");

  const [part1, setPart1] = useState<RefinementPart1>({
    userText: "",
  });

  // Charger contexte + éventuel raffinement déjà commencé
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
      const parsed = JSON.parse(raw) as Partial<RefinementData>;
      if (parsed.part1) {
        setPart1((prev) => ({ ...prev, ...parsed.part1 }));
      }
    } catch (e) {
      console.error("Erreur de lecture du raffinement 2 (partie 1) :", e);
    }
  }, []);

  // Sauvegarde automatique
  useEffect(() => {
    if (!visionId || typeof window === "undefined") return;

    const payload: RefinementData = {
      part1,
    };

    try {
      window.localStorage.setItem(storageKey(visionId), JSON.stringify(payload));
    } catch (e) {
      console.error("Erreur d’enregistrement du raffinement 2 (partie 1) :", e);
    }
  }, [visionId, part1]);

  function goBackToFirstRefinement() {
    const params = new URLSearchParams({
      problemName,
      problemShort,
      visionId,
      visionName,
      visionShort,
    });
    router.push(`/vision-phase1?${params.toString()}`);
  }

  function handleUserTextChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const value = e.target.value;
    setPart1({ userText: value });
  }

  const canGoToPart2 = !!part1.userText.trim();

  function goToPart2() {
    if (!canGoToPart2) {
      alert(
        "Pour passer à la partie 2 de ce raffinement, saisissez d’abord une formulation qualitative."
      );
      return;
    }

    alert("La partie 2 de ce raffinement (variables, équations, résultats) reste à implémenter.");
  }

  return (
    <main style={{ maxWidth: 900, margin: "32px auto", padding: "0 16px" }}>
      <button
        onClick={goBackToFirstRefinement}
        style={{
          marginBottom: 16,
          padding: "6px 12px",
          borderRadius: 4,
          border: "1px solid #9ca3af",
          backgroundColor: "white",
          cursor: "pointer",
        }}
      >
        ← Revenir au premier raffinement de cette vision
      </button>

      {/* ⬇️ Titre clarifié */}
      <h1>Raffinement 2 – Partie 1</h1>

      {/* Contexte */}
      <section style={{ marginTop: 16, marginBottom: 24 }}>
        <h2>Contexte</h2>

        <p>
          <strong>Problème :</strong> {problemName || "(problème inconnu)"}
        </p>
        {problemShort && (
          <p>
            <strong>Définition courte du problème :</strong> {problemShort}</p>
        )}

        <p style={{ marginTop: 12 }}>
          <strong>Vision :</strong> {visionName || "(vision inconnue)"}
        </p>
        {visionShort && (
          <p>
            <strong>Définition courte de la vision :</strong> {visionShort}</p>
        )}
      </section>

      {/* Partie 1 : formulation qualitative */}
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
          apporter à cette vision. Ce texte sera ensuite traduit en structure
          logique (variables, constantes) et en équations.
        </p>

        <div style={{ marginTop: 16 }}>
          <label
            htmlFor="raffinement-texte"
            style={{ display: "block", fontWeight: 600, marginBottom: 4 }}
          >
            Votre raffinement (texte libre)
          </label>
          <textarea
            id="raffinement-texte"
            value={part1.userText}
            onChange={handleUserTextChange}
            rows={6}
            placeholder="Ex : Je veux distinguer une période d’investissement avec décaissements élevés, puis une période de retour à la normale."
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

      <section style={{ marginBottom: 40 }}>
        <button
          onClick={goToPart2}
          disabled={!canGoToPart2}
          style={{
            padding: "10px 24px",
            borderRadius: 6,
            border: "none",
            backgroundColor: canGoToPart2 ? "#2563eb" : "#9ca3af",
            color: "white",
            cursor: canGoToPart2 ? "pointer" : "not-allowed",
            fontWeight: 600,
          }}
        >
          Passer à la partie 2 de ce raffinement
        </button>
        {!canGoToPart2 && (
          <p
            style={{
              marginTop: 8,
              fontSize: 13,
              color: "#6b7280",
            }}
          >
            Pour continuer, saisissez une formulation qualitative de votre
            raffinement.
          </p>
        )}
      </section>
    </main>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type RefinementPart1 = {
  userText: string;
  reformulation1: string;
  reformulation2: string;
  reformulationsGenerated: boolean;
  reformulationsAccepted: boolean;
};

type RefinementData = {
  part1: RefinementPart1;
};

function storageKey(visionId: string) {
  // Premier raffinement de cette vision. Plus tard : on pourra utiliser refinementId.
  return `md_refinement1_v1_${visionId}`;
}

export default function Phase2Client() {
  const router = useRouter();

  // Contexte : problème + vision + id de raffinement
  const [problemName, setProblemName] = useState("");
  const [problemShort, setProblemShort] = useState("");
  const [visionId, setVisionId] = useState("");
  const [visionName, setVisionName] = useState("");
  const [visionShort, setVisionShort] = useState("");
  const [refinementId, setRefinementId] = useState("1");

  const [part1, setPart1] = useState<RefinementPart1>({
    userText: "",
    reformulation1: "",
    reformulation2: "",
    reformulationsGenerated: false,
    reformulationsAccepted: false,
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
    const rId = params.get("refinementId") ?? "1";

    setProblemName(pName);
    setProblemShort(pShort);
    setVisionId(vId);
    setVisionName(vName);
    setVisionShort(vShort);
    setRefinementId(rId);

    if (!vId) return;

    try {
      const raw = window.localStorage.getItem(storageKey(vId));
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<RefinementData>;
      if (parsed.part1) {
        setPart1((prev) => ({ ...prev, ...parsed.part1 }));
      }
    } catch (e) {
      console.error("Erreur de lecture du raffinement (partie 1) :", e);
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
      console.error("Erreur d’enregistrement du raffinement (partie 1) :", e);
    }
  }, [visionId, part1]);

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

  // Quand le visiteur modifie son texte : on annule les reformulations
  function handleUserTextChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const value = e.target.value;
    setPart1({
      userText: value,
      reformulation1: "",
      reformulation2: "",
      reformulationsGenerated: false,
      reformulationsAccepted: false,
    });
  }

  // Générer deux reformulations très simples mais différentes du texte original
  function handleGenerateReformulations() {
    const trimmed = part1.userText.trim();
    if (!trimmed) return;

    const reform1 = `Si je comprends bien, vous voulez : ${trimmed}`;
    const reform2 = `Autrement dit, votre raffinement consiste à : ${trimmed}`;

    setPart1((prev) => ({
      ...prev,
      reformulation1: reform1,
      reformulation2: reform2,
      reformulationsGenerated: true,
      reformulationsAccepted: false,
    }));
  }

  const canGenerate = !!part1.userText.trim();

  const canGoToPart2 = !!(
    part1.userText.trim() &&
    part1.reformulationsGenerated &&
    part1.reformulationsAccepted
  );

  function handleToggleAccepted(e: React.ChangeEvent<HTMLInputElement>) {
    const checked = e.target.checked;
    setPart1((prev) => ({
      ...prev,
      reformulationsAccepted: checked,
    }));
  }

  function goToPart2() {
    if (!canGoToPart2) {
      alert(
        "Pour passer à la partie 2 de ce raffinement, saisissez un texte, générez les reformulations et confirmez qu’elles vous conviennent."
      );
      return;
    }

    // Pour l’instant, la partie 2 n’est pas encore implémentée.
    alert("La partie 2 de ce raffinement sera ajoutée plus tard.");
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
        ← Revenir à la phase 1 de cette vision
      </button>

      <h1>Phase 2 – Raffinement {refinementId} (partie 1)</h1>

      {/* Contexte : problème + vision */}
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

      {/* Partie 1 : texte libre + reformulations */}
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
          apporter à cette vision. Le site propose ensuite deux reformulations
          simples pour vérifier que le sens général est bien conservé.
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
            rows={5}
            placeholder="Ex : Je veux que les ventes augmentent d’abord lentement, puis plus vite, et que cela se reflète dans le chiffre d’affaires."
            style={{
              width: "100%",
              padding: 8,
              borderRadius: 4,
              border: "1px solid #ccc",
              resize: "vertical",
            }}
          />
        </div>

        <button
          onClick={handleGenerateReformulations}
          disabled={!canGenerate}
          style={{
            marginTop: 12,
            padding: "8px 20px",
            borderRadius: 4,
            border: "none",
            backgroundColor: canGenerate ? "#2563eb" : "#9ca3af",
            color: "white",
            cursor: canGenerate ? "pointer" : "not-allowed",
            fontWeight: 600,
          }}
        >
          Générer les reformulations (version minimale)
        </button>

        {part1.reformulationsGenerated && (
          <div style={{ marginTop: 24 }}>
            <h3>Reformulations</h3>
            <p
              style={{
                fontSize: 13,
                color: "#6b7280",
                marginTop: 4,
                marginBottom: 12,
              }}
            >
              Ces reformulations restent très simples : elles reprennent votre
              texte en le replaçant dans deux formulations légèrement
              différentes, pour vérifier le sens général. Plus tard, elles
              pourront être enrichies.
            </p>

            <div
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 6,
                padding: 12,
                marginBottom: 8,
                backgroundColor: "#f9fafb",
              }}
            >
              <strong>Reformulation 1 :</strong>
              <p style={{ marginTop: 4 }}>{part1.reformulation1}</p>
            </div>

            <div
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 6,
                padding: 12,
                backgroundColor: "#f9fafb",
              }}
            >
              <strong>Reformulation 2 :</strong>
              <p style={{ marginTop: 4 }}>{part1.reformulation2}</p>
            </div>

            <div style={{ marginTop: 12 }}>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 14,
                }}
              >
                <input
                  type="checkbox"
                  checked={part1.reformulationsAccepted}
                  onChange={handleToggleAccepted}
                />
                Oui, ces reformulations reflètent bien ce que je veux dire.
              </label>
            </div>
          </div>
        )}
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
            Pour continuer, saisissez un texte de raffinement, générez les
            reformulations et confirmez qu’elles vous conviennent.
          </p>
        )}
      </section>
    </main>
  );
}

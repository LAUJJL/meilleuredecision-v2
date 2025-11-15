"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type VisionDetails = {
  longDef: string;
  phase1Started?: boolean;
};

function storageKey(visionId: string) {
  return `md_visionDetails_v1_${visionId}`;
}

export default function VisionClient() {
  const router = useRouter();

  // Contexte : problème + vision
  const [problemName, setProblemName] = useState("");
  const [problemShort, setProblemShort] = useState("");
  const [visionId, setVisionId] = useState("");
  const [visionName, setVisionName] = useState("");
  const [visionShort, setVisionShort] = useState("");

  // Contenu de la définition initiale
  const [longDef, setLongDef] = useState("");
  const [phase1Started, setPhase1Started] = useState(false);

  // Lecture des paramètres d’URL + chargement éventuel dans localStorage
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
      const parsed = JSON.parse(raw) as Partial<VisionDetails>;
      if (parsed.longDef && typeof parsed.longDef === "string") {
        setLongDef(parsed.longDef);
      }
      if (typeof parsed.phase1Started === "boolean") {
        setPhase1Started(parsed.phase1Started);
      }
    } catch (e) {
      console.error("Erreur de lecture de la définition initiale :", e);
    }
  }, []);

  // Sauvegarde automatique
  useEffect(() => {
    if (!visionId || typeof window === "undefined") return;

    const payload: VisionDetails = {
      longDef,
      phase1Started,
    };

    try {
      window.localStorage.setItem(storageKey(visionId), JSON.stringify(payload));
    } catch (e) {
      console.error("Erreur d’enregistrement de la définition initiale :", e);
    }
  }, [visionId, longDef, phase1Started]);

  function goBackToVisions() {
    const params = new URLSearchParams({
      problemName,
      problemShort,
    });
    router.push(`/visions?${params.toString()}`);
  }

  function goToPhase1() {
    if (!visionId) {
      alert("Vision inconnue : impossible d’ouvrir la phase 1.");
      return;
    }

    if (!longDef.trim()) {
      alert(
        "Veuillez d’abord saisir une définition initiale de la vision avant de passer au premier raffinement (phase 1)."
      );
      return;
    }

    // On fige la définition initiale dès le premier passage en phase 1
    setPhase1Started(true);

    const params = new URLSearchParams({
      problemName,
      problemShort,
      visionId,
      visionName,
      visionShort,
    });

    router.push(`/vision-phase1?${params.toString()}`);
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
        ← Revenir aux visions de ce problème
      </button>

      <h1>Définition initiale de la vision</h1>

      {/* Contexte : problème + vision */}
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

        <p style={{ marginTop: 12 }}>
          <strong>Vision :</strong> {visionName || "(vision inconnue)"}
        </p>
        {visionShort && (
          <p>
            <strong>Définition courte de la vision :</strong> {visionShort}
          </p>
        )}
      </section>

      {/* Définition initiale (qualitative, figée après passage à la phase 1) */}
      <section
        style={{
          border: "1px solid #ddd",
          borderRadius: 8,
          padding: 24,
          marginBottom: 32,
        }}
      >
        <h2>Définition initiale (qualitative)</h2>

        <p style={{ fontSize: 14, color: "#4b5563", marginTop: 8 }}>
          Cette définition décrit qualitativement votre vision au point de
          départ. Une fois que vous aurez commencé la phase 1 (premier
          raffinement), cette définition sera figée et ne pourra plus être
          modifiée.
        </p>

        <textarea
          value={longDef}
          onChange={(e) => setLongDef(e.target.value)}
          rows={8}
          style={{
            marginTop: 12,
            width: "100%",
            padding: 8,
            borderRadius: 4,
            border: "1px solid #ccc",
            resize: "vertical",
          }}
          placeholder="Ex : Cette vision de la trésorerie suppose que..."
          disabled={phase1Started}
        />

        {phase1Started && (
          <p
            style={{
              marginTop: 8,
              fontSize: 13,
              color: "#b91c1c",
            }}
          >
            La phase 1 a déjà été commencée : la définition initiale est
            désormais figée.
          </p>
        )}
      </section>

      <section style={{ marginBottom: 40 }}>
        <button
          onClick={goToPhase1}
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
          Passer au premier raffinement (phase 1)
        </button>
      </section>
    </main>
  );
}

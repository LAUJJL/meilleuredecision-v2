// app/vision-phase3/Phase3Client.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type SearchParams = { [key: string]: string | string[] | undefined };

export default function Phase3Client() {
  const router = useRouter();

  const [problemName, setProblemName] = useState("");
  const [problemShort, setProblemShort] = useState("");
  const [visionId, setVisionId] = useState("");
  const [visionName, setVisionName] = useState("");
  const [visionShort, setVisionShort] = useState("");

  // Lecture du contexte depuis l’URL (?problemName=...&visionId=... etc.)
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

  function goBackToVisions() {
    const params = new URLSearchParams({
      problemName,
      problemShort,
    });
    router.push(`/visions?${params.toString()}`);
  }

  return (
    <main style={{ maxWidth: 900, margin: "32px auto", padding: "0 16px" }}>
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <button
          onClick={goBackToVisions}
          style={{
            padding: "6px 12px",
            borderRadius: 4,
            border: "1px solid #9ca3af",
            backgroundColor: "white",
            cursor: "pointer",
          }}
        >
          ← Revenir à la liste des visions
        </button>

        <button
          onClick={goBackToPhase2}
          style={{
            padding: "6px 12px",
            borderRadius: 4,
            border: "1px solid #9ca3af",
            backgroundColor: "white",
            cursor: "pointer",
          }}
        >
          ← Revenir au raffinement 2
        </button>
      </div>

      <h1>Raffinement 3 – en préparation</h1>

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

      {/* Contenu provisoire : on mettra les calculs ici plus tard */}
      <section
        style={{
          border: "1px solid #ddd",
          borderRadius: 8,
          padding: 24,
          marginBottom: 32,
          backgroundColor: "#f9fafb",
        }}
      >
        <h2>Contenu du raffinement 3</h2>
        <p style={{ marginTop: 8, fontSize: 14, color: "#4b5563" }}>
          Cet écran est maintenant accessible (plus d’erreur 404), mais le
          contenu détaillé du raffinement 3 (valeurs des constantes, types
          fixe/paramètre/précaire, premiers calculs, etc.) reste à construire.
        </p>
        <p style={{ marginTop: 8, fontSize: 14, color: "#4b5563" }}>
          L’idée, comme nous l’avons défini, est que ce raffinement 3 sera le
          premier à demander des valeurs numériques pour les constantes déjà
          nommées, et à les classer en constantes fixes, paramètres ou
          constantes provisoires.
        </p>
      </section>
    </main>
  );
}

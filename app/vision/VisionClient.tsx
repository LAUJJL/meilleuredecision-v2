"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Refinement = {
  id: string;
  text: string;
};

type VisionDetails = {
  longDef: string;
  refinements: Refinement[];
};

function storageKey(visionId: string) {
  return `md_visionDetails_v1_${visionId}`;
}

export default function VisionClient() {
  const router = useRouter();

  // Infos contexte problème + vision
  const [problemName, setProblemName] = useState("");
  const [problemShort, setProblemShort] = useState("");
  const [visionId, setVisionId] = useState("");
  const [visionName, setVisionName] = useState("");
  const [visionShort, setVisionShort] = useState("");

  // Contenu de la vision
  const [longDef, setLongDef] = useState("");
  const [refinements, setRefinements] = useState<Refinement[]>([]);
  const [newRefText, setNewRefText] = useState("");

  // 1) Lire les paramètres d’URL et charger les détails de la vision
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

      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        if (typeof parsed.longDef === "string") {
          setLongDef(parsed.longDef);
        }
        if (Array.isArray(parsed.refinements)) {
          setRefinements(parsed.refinements);
        }
      }
    } catch (e) {
      console.error("Erreur de lecture des détails de la vision :", e);
    }
  }, []);

  // 2) Sauvegarder dès que le contenu change
  useEffect(() => {
    if (!visionId || typeof window === "undefined") return;

    const payload: VisionDetails = {
      longDef,
      refinements,
    };

    try {
      window.localStorage.setItem(storageKey(visionId), JSON.stringify(payload));
    } catch (e) {
      console.error("Erreur d’enregistrement des détails de la vision :", e);
    }
  }, [visionId, longDef, refinements]);

  function handleAddRefinement() {
    const trimmed = newRefText.trim();
    if (!trimmed) return;

    const newRef: Refinement = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2),
      text: trimmed,
    };

    setRefinements((prev) => [...prev, newRef]);
    setNewRefText("");
  }

  function handleDeleteRefinement(id: string) {
    setRefinements((prev) => prev.filter((r) => r.id !== id));
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

      <h1>Définition longue et raffinements de la vision</h1>

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

      {/* Définition longue */}
      <section
        style={{
          border: "1px solid #ddd",
          borderRadius: 8,
          padding: 24,
          marginBottom: 32,
        }}
      >
        <h2>Définition longue de la vision</h2>

        <p style={{ fontSize: 14, color: "#4b5563", marginTop: 8 }}>
          Ici, vous pouvez décrire en détail ce que signifie cette vision,
          les hypothèses, les objectifs précis, les contraintes, etc.
        </p>

        <textarea
          value={longDef}
          onChange={(e) => setLongDef(e.target.value)}
          rows={6}
          style={{
            marginTop: 12,
            width: "100%",
            padding: 8,
            borderRadius: 4,
            border: "1px solid #ccc",
            resize: "vertical",
          }}
          placeholder="Ex : Cette vision de la trésorerie suppose que..."
        />
      </section>

      {/* Raffinements */}
      <section
        style={{
          border: "1px solid #ddd",
          borderRadius: 8,
          padding: 24,
          marginBottom: 32,
        }}
      >
        <h2>Raffinements de cette vision</h2>

        <p style={{ fontSize: 14, color: "#4b5563", marginTop: 8 }}>
          Ajoutez ici des raffinements successifs : sous-objectifs, critères,
          questions, étapes, etc.
        </p>

        <div style={{ marginTop: 16, marginBottom: 12 }}>
          <label
            htmlFor="new-refinement"
            style={{ display: "block", fontWeight: 600, marginBottom: 4 }}
          >
            Nouveau raffinement
          </label>
          <input
            id="new-refinement"
            type="text"
            value={newRefText}
            onChange={(e) => setNewRefText(e.target.value)}
            placeholder="Ex : Identifier les postes de trésorerie les plus volatils"
            style={{
              width: "100%",
              padding: 8,
              borderRadius: 4,
              border: "1px solid #ccc",
            }}
          />
        </div>

        <button
          onClick={handleAddRefinement}
          disabled={!newRefText.trim()}
          style={{
            padding: "8px 20px",
            borderRadius: 4,
            border: "none",
            backgroundColor: newRefText.trim() ? "#2563eb" : "#9ca3af",
            color: "white",
            cursor: newRefText.trim() ? "pointer" : "not-allowed",
          }}
        >
          Ajouter ce raffinement
        </button>

        <div style={{ marginTop: 24 }}>
          <h3>Raffinements existants</h3>

          {refinements.length === 0 ? (
            <p style={{ marginTop: 8 }}>Aucun raffinement pour l’instant.</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, marginTop: 12 }}>
              {refinements.map((r) => (
                <li
                  key={r.id}
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: 8,
                    padding: 12,
                    marginBottom: 8,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <span>{r.text}</span>
                  <button
                    onClick={() => handleDeleteRefinement(r.id)}
                    style={{
                      padding: "4px 10px",
                      borderRadius: 4,
                      border: "none",
                      backgroundColor: "#ef4444",
                      color: "white",
                      cursor: "pointer",
                    }}
                  >
                    Supprimer
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </main>
  );
}

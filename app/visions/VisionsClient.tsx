// app/visions/VisionsClient.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Vision = {
  id: string;
  name: string;
  shortDef: string;
};

type Problem = {
  id: string;
  name: string;
  short?: string;
  createdAt?: string;
};

const PROBLEMS_STORAGE_KEY = "md_problems_v1";

// Nouvelle clé : on indexe les visions par problemId
function visionsStorageKey(problemId: string) {
  return `md_visions_v2_${problemId}`;
}

export default function VisionsClient({
  problemId,
  initialProblemName,
  initialProblemShort,
}: {
  problemId: string;
  initialProblemName: string;
  initialProblemShort: string;
}) {
  const router = useRouter();

  // Contexte problème
  const [problemName, setProblemName] = useState(initialProblemName || "");
  const [problemShort, setProblemShort] = useState(initialProblemShort || "");

  // Visions
  const [visions, setVisions] = useState<Vision[]>([]);
  const [newName, setNewName] = useState("");
  const [newShort, setNewShort] = useState("");

  // 1) Recharger le problème à partir de son id (source unique de vérité)
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!problemId) return;

    try {
      const raw = window.localStorage.getItem(PROBLEMS_STORAGE_KEY);
      if (!raw) return;

      const list: Problem[] = JSON.parse(raw);
      const found = list.find((p) => p.id === problemId);
      if (found) {
        setProblemName(found.name);
        setProblemShort(found.short || "");
      }
    } catch (e) {
      console.error("Erreur de lecture du problème :", e);
    }
  }, [problemId]);

  // 2) Charger les visions pour ce problème
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!problemId) return;

    try {
      const raw = window.localStorage.getItem(visionsStorageKey(problemId));
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setVisions(parsed);
      }
    } catch (e) {
      console.error("Erreur de lecture des visions :", e);
    }
  }, [problemId]);

  // 3) Sauvegarder les visions dès que la liste change
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!problemId) return;

    try {
      window.localStorage.setItem(
        visionsStorageKey(problemId),
        JSON.stringify(visions)
      );
    } catch (e) {
      console.error("Erreur d’enregistrement des visions :", e);
    }
  }, [problemId, visions]);

  function handleCreateVision() {
    const trimmed = newName.trim();
    if (!trimmed || !problemId) return;

    const newVision: Vision = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2),
      name: trimmed,
      shortDef: newShort.trim(),
    };

    setVisions((prev) => [...prev, newVision]);
    setNewName("");
    setNewShort("");
  }

  function handleDeleteVision(id: string) {
    setVisions((prev) => prev.filter((v) => v.id !== id));
  }

  function goBackToProblems() {
    router.push("/");
  }

  return (
    <main style={{ maxWidth: 900, margin: "32px auto", padding: "0 16px" }}>
      <button
        onClick={goBackToProblems}
        style={{
          marginBottom: 16,
          padding: "6px 12px",
          borderRadius: 4,
          border: "1px solid #9ca3af",
          backgroundColor: "white",
          cursor: "pointer",
        }}
      >
        ← Revenir à la liste des problèmes
      </button>

      <h1>Visions du problème</h1>

      {/* Contexte du problème */}
      <section style={{ marginTop: 16, marginBottom: 24 }}>
        <h2>Problème sélectionné</h2>
        <p>
          <strong>Nom :</strong>{" "}
          {problemName || "(problème inconnu – id non trouvé)"}
        </p>
        {problemShort && (
          <p>
            <strong>Définition courte :</strong> {problemShort}
          </p>
        )}
      </section>

      {/* Création d’une nouvelle vision */}
      <section
        style={{
          border: "1px solid #ddd",
          borderRadius: 8,
          padding: 24,
          marginBottom: 32,
        }}
      >
        <h2>Créer une nouvelle vision</h2>

        <div style={{ marginTop: 16, marginBottom: 12 }}>
          <label
            htmlFor="new-vision-name"
            style={{ display: "block", fontWeight: 600, marginBottom: 4 }}
          >
            Nom de la vision
          </label>
          <input
            id="new-vision-name"
            type="text"
            placeholder="Ex : Vision pessimiste de la trésorerie"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            style={{
              width: "100%",
              padding: 8,
              borderRadius: 4,
              border: "1px solid #ccc",
            }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label
            htmlFor="new-vision-short"
            style={{ display: "block", fontWeight: 600, marginBottom: 4 }}
          >
            Définition courte de la vision
          </label>
          <textarea
            id="new-vision-short"
            placeholder="Quelques mots pour distinguer cette vision des autres."
            value={newShort}
            onChange={(e) => setNewShort(e.target.value)}
            rows={2}
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
          onClick={handleCreateVision}
          disabled={!newName.trim() || !problemId}
          style={{
            padding: "8px 20px",
            borderRadius: 4,
            border: "none",
            backgroundColor:
              newName.trim() && problemId ? "#2563eb" : "#9ca3af",
            color: "white",
            cursor:
              newName.trim() && problemId ? "pointer" : "not-allowed",
          }}
        >
          Créer cette vision
        </button>
      </section>

      {/* Liste des visions */}
      <section>
        <h2>Visions existantes pour ce problème</h2>

        {visions.length === 0 ? (
          <p style={{ marginTop: 12 }}>Aucune vision pour l’instant.</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, marginTop: 16 }}>
            {visions.map((v) => (
              <li
                key={v.id}
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: 8,
                  padding: 16,
                  marginBottom: 12,
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                <div>
                  <div style={{ fontWeight: 600 }}>{v.name}</div>
                  {v.shortDef && (
                    <div style={{ color: "#4b5563", fontSize: 14 }}>
                      {v.shortDef}
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <button
                    onClick={() =>
                      alert(
                        "Plus tard : ici on ira vers la définition longue et les raffinements de cette vision."
                      )
                    }
                    style={{
                      padding: "6px 12px",
                      borderRadius: 4,
                      border: "1px solid #2563eb",
                      backgroundColor: "white",
                      color: "#2563eb",
                      cursor: "pointer",
                    }}
                  >
                    Voir ou créer la définition longue
                  </button>

                  <button
                    onClick={() => handleDeleteVision(v.id)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: 4,
                      border: "none",
                      backgroundColor: "#ef4444",
                      color: "white",
                      cursor: "pointer",
                    }}
                  >
                    Supprimer cette vision
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

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
};

const PROBLEMS_KEYS = ["md_problems_v2", "md_problems_v1", "md_problems"];

function visionsStorageKey(problemId: string) {
  // stockage des visions par identifiant de problème
  return `md_visions_v1_${problemId}`;
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

  // Nom du problème affiché dans la page
  const [problemName, setProblemName] = useState(initialProblemName || "");
  const [problemShort, setProblemShort] = useState(initialProblemShort || "");

  const [visions, setVisions] = useState<Vision[]>([]);
  const [newName, setNewName] = useState("");
  const [newShort, setNewShort] = useState("");

  // 1) Essayer de retrouver le problème en localStorage (pour être cohérent),
  //    mais SANS afficher "problème inconnu" si on ne le trouve pas.
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!problemId) {
      // Pas d'id : on garde simplement les valeurs passées dans l'URL
      return;
    }

    try {
      let found: Problem | undefined;

      for (const key of PROBLEMS_KEYS) {
        const raw = window.localStorage.getItem(key);
        if (!raw) continue;

        const parsed = JSON.parse(raw) as Problem[] | unknown;
        if (!Array.isArray(parsed)) continue;

        const match = (parsed as Problem[]).find((p) => p.id === problemId);
        if (match) {
          found = match;
          break;
        }
      }

      if (found) {
        if (found.name && !initialProblemName) {
          setProblemName(found.name);
        }
        if (found.short && !initialProblemShort) {
          setProblemShort(found.short);
        }
      } else {
        // Si on ne trouve rien, on NE met pas de message d’erreur,
        // on garde simplement le nom fourni dans l’URL.
      }
    } catch (e) {
      console.error("Erreur lors de la lecture des problèmes :", e);
    }
  }, [problemId, initialProblemName, initialProblemShort]);

  // 2) Charger les visions pour ce problème
  useEffect(() => {
    if (typeof window === "undefined" || !problemId) return;
    try {
      const raw = window.localStorage.getItem(visionsStorageKey(problemId));
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setVisions(parsed as Vision[]);
      }
    } catch (e) {
      console.error("Erreur de lecture des visions :", e);
    }
  }, [problemId]);

  // 3) Sauvegarder dès que la liste change
  useEffect(() => {
    if (typeof window === "undefined" || !problemId) return;
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

  function goToVisionDefinition(v: Vision) {
    const params = new URLSearchParams({
      problemId: problemId || "",
      problemName: problemName || "",
      problemShort: problemShort || "",
      visionId: v.id,
      visionName: v.name,
      visionShort: v.shortDef,
    });

    router.push(`/vision?${params.toString()}`);
  }

  const displayProblemName =
    problemName && problemName.trim().length > 0
      ? problemName
      : "(problème sans nom)";

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

      {/* Contexte problème */}
      <section style={{ marginTop: 16, marginBottom: 24 }}>
        <h2>Problème sélectionné</h2>
        <p>
          <strong>Nom :</strong> {displayProblemName}
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

      {/* Liste des visions existantes */}
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
                    <div
                      style={{ color: "#4b5563", fontSize: 14 }}
                    >
                      {v.shortDef}
                    </div>
                  )}
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    marginTop: 8,
                  }}
                >
                  <button
                    onClick={() => goToVisionDefinition(v)}
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

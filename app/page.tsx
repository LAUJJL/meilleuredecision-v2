"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Problem = {
  id: string;
  name: string;
  shortDef: string;
};

const PROBLEMS_STORAGE_KEY = "md_problems_v1";

function loadProblems(): Problem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(PROBLEMS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch (e) {
    console.error("Erreur de lecture des problèmes :", e);
    return [];
  }
}

function saveProblems(list: Problem[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PROBLEMS_STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.error("Erreur d’enregistrement des problèmes :", e);
  }
}

export default function ProblemsPage() {
  const router = useRouter();

  const [problems, setProblems] = useState<Problem[]>([]);
  const [name, setName] = useState("");
  const [shortDef, setShortDef] = useState("");

  // Charger les problèmes au montage
  useEffect(() => {
    const initial = loadProblems();
    setProblems(initial);
  }, []);

  // Sauvegarder à chaque modification
  useEffect(() => {
    saveProblems(problems);
  }, [problems]);

  function handleCreateProblem() {
    const trimmedName = name.trim();
    if (!trimmedName) return;

    const newProblem: Problem = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2),
      name: trimmedName,
      shortDef: shortDef.trim(),
    };

    setProblems((prev) => [...prev, newProblem]);
    setName("");
    setShortDef("");
  }

  function handleDeleteProblem(id: string) {
    setProblems((prev) => prev.filter((p) => p.id !== id));
  }

  function goToVisions(problem: Problem) {
    const params = new URLSearchParams({
      problemName: problem.name,
      problemShort: problem.shortDef,
    });
    router.push(`/visions?${params.toString()}`);
  }

  return (
    <main style={{ maxWidth: 900, margin: "32px auto", padding: "0 16px" }}>
      <h1>Problèmes (liste)</h1>
      <p style={{ marginBottom: 24 }}>
        Cette page remplace l’ancien « Accueil » : ici, vous créez et gérez vos
        problèmes. Chaque problème pourra ensuite avoir plusieurs visions, puis
        des raffinements par phases.
      </p>

      {/* Création d’un nouveau problème */}
      <section
        style={{
          border: "1px solid #ddd",
          borderRadius: 8,
          padding: 24,
          marginBottom: 32,
        }}
      >
        <h2>Créer un nouveau problème</h2>

        <div style={{ marginTop: 16, marginBottom: 12 }}>
          <label
            htmlFor="new-problem-name"
            style={{ display: "block", fontWeight: 600, marginBottom: 4 }}
          >
            Nom du problème
          </label>
          <input
            id="new-problem-name"
            type="text"
            placeholder="Ex : Trésorerie d’une petite entreprise"
            value={name}
            onChange={(e) => setName(e.target.value)}
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
            htmlFor="new-problem-short"
            style={{ display: "block", fontWeight: 600, marginBottom: 4 }}
          >
            Définition courte (facultative)
          </label>
          <textarea
            id="new-problem-short"
            placeholder="Quelques mots pour distinguer ce problème des autres."
            value={shortDef}
            onChange={(e) => setShortDef(e.target.value)}
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
          onClick={handleCreateProblem}
          disabled={!name.trim()}
          style={{
            padding: "8px 20px",
            borderRadius: 4,
            border: "none",
            backgroundColor: name.trim() ? "#2563eb" : "#9ca3af",
            color: "white",
            cursor: name.trim() ? "pointer" : "not-allowed",
          }}
        >
          Créer ce problème
        </button>
      </section>

      {/* Liste des problèmes existants */}
      <section>
        <h2>Problèmes existants</h2>

        {problems.length === 0 ? (
          <p style={{ marginTop: 12 }}>
            Aucun problème pour l’instant. Créez-en un ci-dessus.
          </p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, marginTop: 16 }}>
            {problems.map((p) => (
              <li
                key={p.id}
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
                  <div style={{ fontWeight: 600 }}>{p.name}</div>
                  {p.shortDef && (
                    <div style={{ color: "#4b5563", fontSize: 14 }}>
                      {p.shortDef}
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <button
                    onClick={() => goToVisions(p)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: 4,
                      border: "1px solid #2563eb",
                      backgroundColor: "white",
                      color: "#2563eb",
                      cursor: "pointer",
                    }}
                  >
                    Voir, créer ou effacer les visions de ce problème
                  </button>

                  <button
                    onClick={() => handleDeleteProblem(p.id)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: 4,
                      border: "none",
                      backgroundColor: "#ef4444",
                      color: "white",
                      cursor: "pointer",
                    }}
                  >
                    Supprimer ce problème
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

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Problem = {
  id: string;
  name: string;
  short: string;
};

const STORAGE_KEYS = ["md_problems_v1", "md_problems"];

function loadProblems(): Problem[] {
  if (typeof window === "undefined") return [];
  for (const key of STORAGE_KEYS) {
    const raw = window.localStorage.getItem(key);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed as Problem[];
        }
      } catch {
        // on ignore et on essaye la clé suivante
      }
    }
  }
  return [];
}

function saveProblems(problems: Problem[]) {
  if (typeof window === "undefined") return;
  const raw = JSON.stringify(problems);
  for (const key of STORAGE_KEYS) {
    window.localStorage.setItem(key, raw);
  }
}

export default function ProblemsPage() {
  const router = useRouter();

  const [problems, setProblems] = useState<Problem[]>([]);
  const [nameInput, setNameInput] = useState("");
  const [shortInput, setShortInput] = useState("");

  // Charger la liste au montage
  useEffect(() => {
    const initial = loadProblems();
    setProblems(initial);
  }, []);

  function createProblem() {
    const trimmedName = nameInput.trim();
    const trimmedShort = shortInput.trim();

    if (!trimmedName) {
      alert("Merci de donner un nom au problème.");
      return;
    }

    const newProblem: Problem = {
      id: "pb_" + Date.now().toString(36),
      name: trimmedName,
      short: trimmedShort,
    };

    const updated = [...problems, newProblem];
    setProblems(updated);
    saveProblems(updated);

    setNameInput("");
    setShortInput("");
  }

  function openVisions(problem: Problem) {
    const params = new URLSearchParams({
      problemId: problem.id,
      problemName: problem.name,
      problemShort: problem.short ?? "",
    });

    router.push(`/visions?${params.toString()}`);
  }

  function deleteProblem(problem: Problem) {
    if (
      !confirm(
        `Supprimer le problème « ${problem.name} » et toutes ses visions ?`
      )
    ) {
      return;
    }

    const updated = problems.filter((p) => p.id !== problem.id);
    setProblems(updated);
    saveProblems(updated);

    if (typeof window !== "undefined") {
      // au minimum on efface les visions associées à ce problème
      const prefix = `md_visions_${problem.id}_`;
      for (const key of Object.keys(window.localStorage)) {
        if (key.startsWith(prefix)) {
          window.localStorage.removeItem(key);
        }
      }
    }
  }

  return (
    <main style={{ maxWidth: 900, margin: "32px auto", padding: "0 16px" }}>
      <h1>Problèmes (liste)</h1>

      <p style={{ marginTop: 8, color: "#4b5563" }}>
        Cette page remplace l’ancien « Accueil » : ici, vous créez et gérez vos
        problèmes. Chaque problème pourra ensuite avoir plusieurs visions, puis
        des raffinements par phases.
      </p>

      {/* Création d'un nouveau problème */}
      <section
        style={{
          marginTop: 24,
          padding: 16,
          borderRadius: 8,
          border: "1px solid #e5e7eb",
        }}
      >
        <h2>Créer un nouveau problème</h2>

        <div style={{ marginTop: 12 }}>
          <label
            htmlFor="problem-name"
            style={{ display: "block", fontWeight: 600, marginBottom: 4 }}
          >
            Nom du problème
          </label>
          <input
            id="problem-name"
            type="text"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder="Ex : Trésorerie d’une petite entreprise"
            style={{
              width: "100%",
              padding: 8,
              borderRadius: 4,
              border: "1px solid #d1d5db",
            }}
          />
        </div>

        <div style={{ marginTop: 12 }}>
          <label
            htmlFor="problem-short"
            style={{ display: "block", fontWeight: 600, marginBottom: 4 }}
          >
            Définition courte (facultative)
          </label>
          <input
            id="problem-short"
            type="text"
            value={shortInput}
            onChange={(e) => setShortInput(e.target.value)}
            placeholder="Quelques mots pour distinguer ce problème des autres."
            style={{
              width: "100%",
              padding: 8,
              borderRadius: 4,
              border: "1px solid #d1d5db",
            }}
          />
        </div>

        <button
          onClick={createProblem}
          style={{
            marginTop: 16,
            padding: "8px 16px",
            borderRadius: 6,
            border: "none",
            backgroundColor: "#2563eb",
            color: "white",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Créer ce problème
        </button>
      </section>

      {/* Liste des problèmes existants */}
      <section style={{ marginTop: 32 }}>
        <h2>Problèmes existants</h2>

        {problems.length === 0 ? (
          <p style={{ marginTop: 8, color: "#6b7280" }}>
            Aucun problème pour l’instant. Créez-en un ci-dessus.
          </p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, marginTop: 12 }}>
            {problems.map((pb) => (
              <li
                key={pb.id}
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: 8,
                  padding: 12,
                  marginBottom: 8,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <div style={{ fontWeight: 600 }}>{pb.name}</div>
                  {pb.short && (
                    <div style={{ fontSize: 14, color: "#6b7280" }}>
                      {pb.short}
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => openVisions(pb)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: 6,
                      border: "1px solid #2563eb",
                      backgroundColor: "white",
                      color: "#2563eb",
                      cursor: "pointer",
                      fontSize: 14,
                    }}
                  >
                    Voir, créer ou effacer les visions de ce problème
                  </button>
                  <button
                    onClick={() => deleteProblem(pb)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: 6,
                      border: "1px solid #dc2626",
                      backgroundColor: "white",
                      color: "#dc2626",
                      cursor: "pointer",
                      fontSize: 14,
                    }}
                  >
                    Supprimer
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

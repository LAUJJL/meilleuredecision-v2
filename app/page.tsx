// app/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Problem = {
  id: string;
  name: string;
  shortDef: string;
};

const PROBLEMS_STORAGE_KEY = "md_problems_v1";
const VISIONS_STORAGE_PREFIX = "md_visions_v1_";

/**
 * Nettoie toutes les données (raffinements, snapshots, etc.)
 * associées à une vision, en supprimant les clés de localStorage
 * qui contiennent son id.
 */
function cleanupVisionLocalData(visionId: string) {
  if (typeof window === "undefined") return;
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (!key) continue;
      // On ne touche qu’aux clés du site (préfixe md_)
      // et qui contiennent l’id de la vision.
      if (key.startsWith("md_") && key.includes(visionId)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => window.localStorage.removeItem(k));
  } catch (e) {
    console.error("Erreur lors du nettoyage des données de la vision :", e);
  }
}

/**
 * Charge la liste des problèmes depuis localStorage.
 */
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

/**
 * Sauvegarde la liste des problèmes dans localStorage.
 */
function saveProblems(list: Problem[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(PROBLEMS_STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.error("Erreur d’enregistrement des problèmes :", e);
  }
}

/**
 * Supprime toutes les visions d’un problème (la liste elle-même)
 * et toutes les données associées aux raffinements de ces visions.
 */
function deleteAllVisionsForProblem(problemId: string) {
  if (typeof window === "undefined") return;

  const visionsKey = `${VISIONS_STORAGE_PREFIX}${problemId}`;
  try {
    const raw = window.localStorage.getItem(visionsKey);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        // On s’attend à ce que chaque vision ait un id
        parsed.forEach((v: { id?: string }) => {
          if (v && typeof v.id === "string") {
            cleanupVisionLocalData(v.id);
          }
        });
      }
    }
    // On supprime la liste des visions du problème
    window.localStorage.removeItem(visionsKey);
  } catch (e) {
    console.error(
      "Erreur lors de la suppression des visions du problème :",
      e
    );
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

    // 1) Empêcher deux problèmes avec le même nom (insensible à la casse)
    const alreadyExists = problems.some(
      (p) => p.name.trim().toLowerCase() === trimmedName.toLowerCase()
    );
    if (alreadyExists) {
      alert(
        "Un problème portant déjà ce nom existe. Merci de choisir un nom différent."
      );
      return;
    }

    const newProblem: Problem = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2),
      name: trimmedName,
      shortDef: shortDef.trim(),
    };

    setProblems((prev) => [...prev, newProblem]);
    setName("");
    setShortDef("");
  }

  function handleDeleteProblem(problem: Problem) {
    const confirmDelete = window.confirm(
      `Supprimer le problème « ${problem.name} » et toutes ses visions ?\n` +
        "Cette action effacera aussi les raffinements associés aux visions."
    );
    if (!confirmDelete) return;

    // 1) Nettoyer les visions + raffinements de ce problème
    deleteAllVisionsForProblem(problem.id);

    // 2) Supprimer le problème dans la liste
    setProblems((prev) => prev.filter((p) => p.id !== problem.id));
  }

  function goToVisions(problem: Problem) {
    // On passe désormais aussi l’id du problème dans l’URL
    const params = new URLSearchParams({
      problemId: problem.id,
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
                    onClick={() => handleDeleteProblem(p)}
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

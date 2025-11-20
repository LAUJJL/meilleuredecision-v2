// app/projects/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type StoredProblem = {
  id: string;
  name: string;
  short?: string;
};

const STORAGE_KEY = "md_problems_v1";

function loadProblems(): StoredProblem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function saveProblems(problems: StoredProblem[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(problems));
  } catch {
    // ignore
  }
}

function makeId() {
  return Math.random().toString(36).slice(2, 12);
}

export default function ProjectsPage() {
  const router = useRouter();
  const [problems, setProblems] = useState<StoredProblem[]>([]);
  const [name, setName] = useState("");
  const [short, setShort] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    setProblems(loadProblems());
  }, []);

  function handleCreateProblem() {
    const trimmedName = name.trim();
    if (!trimmedName) {
      alert("Merci de saisir un nom de problème.");
      return;
    }

    // empêcher les doublons de nom
    const already = problems.find(
      (p) => p.name.toLowerCase() === trimmedName.toLowerCase()
    );
    if (already) {
      alert(
        "Il existe déjà un problème avec ce nom. Modifiez le nom ou ouvrez le problème existant."
      );
      return;
    }

    const newProblem: StoredProblem = {
      id: makeId(),
      name: trimmedName,
      short: short.trim() || undefined,
    };

    const updated = [...problems, newProblem];
    setProblems(updated);
    saveProblems(updated);

    // aller directement à la page des visions de ce problème
    const params = new URLSearchParams({
      problemId: newProblem.id,
      problemName: newProblem.name,
      problemShort: newProblem.short || "",
    });
    router.push(`/visions?${params.toString()}`);
  }

  function handleOpenProblem(p: StoredProblem) {
    const params = new URLSearchParams({
      problemId: p.id,
      problemName: p.name,
      problemShort: p.short || "",
    });
    router.push(`/visions?${params.toString()}`);
  }

  function handleDeleteProblem(p: StoredProblem) {
    if (
      !confirm(
        `Supprimer le problème « ${p.name} » et toutes ses visions / raffinements ?`
      )
    ) {
      return;
    }

    const remaining = problems.filter((x) => x.id !== p.id);
    setProblems(remaining);
    saveProblems(remaining);

    // on laissera les anciennes clés locales périmées,
    // mais elles ne seront plus réutilisées car l'id a disparu.
  }

  function handleResetSelection() {
    setName("");
    setShort("");
  }

  return (
    <main style={{ maxWidth: 900, margin: "32px auto", padding: "0 16px" }}>
      <h1>Problèmes (gestion)</h1>

      {/* Liste des problèmes existants */}
      <section style={{ marginTop: 24, marginBottom: 32 }}>
        <h2>Ouvrir un problème existant</h2>
        {problems.length === 0 ? (
          <p style={{ marginTop: 8 }}>Aucun problème enregistré pour l’instant.</p>
        ) : (
          <ul style={{ marginTop: 12, listStyle: "none", padding: 0 }}>
            {problems.map((p) => (
              <li
                key={p.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 0",
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                <div>
                  <strong>{p.name}</strong>
                  {p.short && <span> — {p.short}</span>}
                </div>
                <div style={{ display: "flex", gap: 12 }}>
                  <button
                    onClick={() => handleOpenProblem(p)}
                    style={{
                      padding: "4px 12px",
                      borderRadius: 4,
                      border: "1px solid #4b5563",
                      backgroundColor: "white",
                      cursor: "pointer",
                    }}
                  >
                    Ouvrir
                  </button>
                  <button
                    onClick={() => handleDeleteProblem(p)}
                    style={{
                      padding: "4px 12px",
                      borderRadius: 4,
                      border: "1px solid #b91c1c",
                      backgroundColor: "#fee2e2",
                      color: "#b91c1c",
                      cursor: "pointer",
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

      {/* Création d’un nouveau problème */}
      <section style={{ marginBottom: 32 }}>
        <h2>Créer un nouveau problème</h2>

        <div style={{ marginTop: 12 }}>
          <input
            type="text"
            placeholder="Nom du problème (80 car. max)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
            style={{
              display: "block",
              width: "100%",
              padding: 8,
              borderRadius: 4,
              border: "1px solid #d1d5db",
              marginBottom: 8,
            }}
          />
          <input
            type="text"
            placeholder="Définition courte (1 ligne, optionnel)"
            value={short}
            onChange={(e) => setShort(e.target.value)}
            maxLength={160}
            style={{
              display: "block",
              width: "100%",
              padding: 8,
              borderRadius: 4,
              border: "1px solid #d1d5db",
              marginBottom: 12,
            }}
          />
          <button
            onClick={handleCreateProblem}
            style={{
              padding: "8px 16px",
              borderRadius: 4,
              border: "none",
              backgroundColor: "#2563eb",
              color: "white",
              cursor: "pointer",
              fontWeight: 600,
              marginRight: 8,
            }}
          >
            Créer le problème (puis choisir/créer sa vision)
          </button>
          <button
            onClick={handleResetSelection}
            style={{
              padding: "8px 16px",
              borderRadius: 4,
              border: "1px solid #9ca3af",
              backgroundColor: "white",
              cursor: "pointer",
            }}
          >
            Réinitialiser la sélection
          </button>
        </div>
      </section>
    </main>
  );
}

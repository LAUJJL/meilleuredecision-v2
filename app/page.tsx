// app/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Problem = {
  id: string;
  name: string;
  shortDescription: string;
};

export default function ProblemsPage() {
  const router = useRouter();

  const [problems, setProblems] = useState<Problem[]>([]);
  const [newName, setNewName] = useState("");
  const [newShortDesc, setNewShortDesc] = useState("");

  function handleAddProblem() {
    const name = newName.trim();
    const desc = newShortDesc.trim();

    if (!name) {
      alert("Veuillez saisir un nom de problème.");
      return;
    }

    const newProblem: Problem = {
      id: crypto.randomUUID(),
      name,
      shortDescription: desc,
    };

    setProblems((prev) => [...prev, newProblem]);
    setNewName("");
    setNewShortDesc("");
  }

  function handleDeleteProblem(id: string) {
    if (!confirm("Supprimer ce problème et toutes ses visions ?")) return;
    setProblems((prev) => prev.filter((p) => p.id !== id));
  }

  function handleOpenVisions(problem: Problem) {
    // Pour l’instant, on se contente de préparer la navigation.
    // Plus tard, /visions utilisera l’ID du problème pour afficher
    // les visions correspondantes.
    router.push(`/visions?problemId=${encodeURIComponent(problem.id)}`);
  }

  return (
    <main
      style={{
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        padding: "2rem",
        maxWidth: "900px",
        margin: "0 auto",
        lineHeight: 1.5,
      }}
    >
      <h1 style={{ fontSize: "1.7rem", marginBottom: "0.25rem" }}>
        Problèmes (liste)
      </h1>

      <p style={{ marginBottom: "1.5rem" }}>
        Cette page remplace l&apos;ancien &quot;Accueil&quot; : ici, vous créez et
        gérez vos problèmes. Chaque problème pourra ensuite avoir plusieurs
        visions, puis des raffinements par phases.
      </p>

      {/* Création d'un nouveau problème */}
      <section
        style={{
          padding: "1rem",
          borderRadius: 8,
          border: "1px solid #ddd",
          marginBottom: "2rem",
        }}
      >
        <h2 style={{ fontSize: "1.2rem", marginBottom: "0.75rem" }}>
          Créer un nouveau problème
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <div>
            <label
              htmlFor="problem-name"
              style={{ display: "block", fontWeight: 500, marginBottom: 4 }}
            >
              Nom du problème
            </label>
            <input
              id="problem-name"
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Ex : Trésorerie d’une petite entreprise"
              style={{
                width: "100%",
                padding: "0.5rem 0.6rem",
                borderRadius: 6,
                border: "1px solid #ccc",
              }}
            />
          </div>

          <div>
            <label
              htmlFor="problem-shortdesc"
              style={{ display: "block", fontWeight: 500, marginBottom: 4 }}
            >
              Définition courte (facultative)
            </label>
            <textarea
              id="problem-shortdesc"
              value={newShortDesc}
              onChange={(e) => setNewShortDesc(e.target.value)}
              placeholder="Quelques mots pour distinguer ce problème des autres."
              rows={2}
              style={{
                width: "100%",
                padding: "0.5rem 0.6rem",
                borderRadius: 6,
                border: "1px solid #ccc",
                resize: "vertical",
              }}
            />
          </div>

          <button
            type="button"
            onClick={handleAddProblem}
            style={{
              alignSelf: "flex-start",
              padding: "0.5rem 1rem",
              borderRadius: 6,
              border: "1px solid #0070f3",
              background: "#0070f3",
              color: "white",
              cursor: "pointer",
            }}
          >
            Créer ce problème
          </button>
        </div>
      </section>

      {/* Liste des problèmes existants */}
      <section>
        <h2 style={{ fontSize: "1.2rem", marginBottom: "0.75rem" }}>
          Problèmes existants
        </h2>

        {problems.length === 0 ? (
          <p style={{ color: "#555" }}>Aucun problème pour le moment.</p>
        ) : (
          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: 0,
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem",
            }}
          >
            {problems.map((p) => (
              <li
                key={p.id}
                style={{
                  border: "1px solid #ddd",
                  borderRadius: 8,
                  padding: "0.75rem 0.9rem",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: "0.75rem",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>{p.name}</div>
                    {p.shortDescription && (
                      <div style={{ fontSize: "0.9rem", color: "#555" }}>
                        {p.shortDescription}
                      </div>
                    )}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.4rem",
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => handleOpenVisions(p)}
                      style={{
                        padding: "0.35rem 0.6rem",
                        borderRadius: 6,
                        border: "1px solid #666",
                        background: "white",
                        cursor: "pointer",
                        fontSize: "0.9rem",
                        textAlign: "left",
                      }}
                    >
                      Voir, créer ou effacer
                      <br />
                      les visions de ce problème
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteProblem(p.id)}
                      style={{
                        padding: "0.35rem 0.6rem",
                        borderRadius: 6,
                        border: "1px solid #e00",
                        background: "white",
                        color: "#e00",
                        cursor: "pointer",
                        fontSize: "0.85rem",
                      }}
                    >
                      Supprimer ce problème
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

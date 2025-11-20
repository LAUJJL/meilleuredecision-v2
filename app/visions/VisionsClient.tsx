// app/visions/VisionsClient.tsx
"use client";

import { useEffect, useState, FormEvent } from "react";

type Vision = {
  id: string;
  name: string;
  shortDefinition: string;
  createdAt: string;
};

type VisionsClientProps = {
  problemId: string;
  problemName: string;
  problemShort: string;
};

const STORAGE_PREFIX = "md_visions_v2_";

function loadVisions(problemId: string): Vision[] {
  if (typeof window === "undefined") return [];
  if (!problemId) return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + problemId);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Vision[];
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function saveVisions(problemId: string, visions: Vision[]) {
  if (typeof window === "undefined") return;
  if (!problemId) return;

  try {
    window.localStorage.setItem(
      STORAGE_PREFIX + problemId,
      JSON.stringify(visions)
    );
  } catch {
    // on ignore les erreurs de stockage
  }
}

export default function VisionsClient({
  problemId,
  problemName,
  problemShort,
}: VisionsClientProps) {
  const [visions, setVisions] = useState<Vision[]>([]);
  const [visionName, setVisionName] = useState("");
  const [visionShort, setVisionShort] = useState("");

  // charger les visions au montage / changement de problème
  useEffect(() => {
    const loaded = loadVisions(problemId);
    setVisions(loaded);
  }, [problemId]);

  const handleCreateVision = (e: FormEvent) => {
    e.preventDefault();
    const name = visionName.trim();
    const shortDef = visionShort.trim();

    if (!name) {
      alert("Veuillez saisir un nom de vision.");
      return;
    }

    const newVision: Vision = {
      id: Date.now().toString(),
      name,
      shortDefinition: shortDef,
      createdAt: new Date().toISOString(),
    };

    const next = [...visions, newVision];
    setVisions(next);
    saveVisions(problemId, next);

    setVisionName("");
    setVisionShort("");
  };

  const handleDeleteVision = (id: string) => {
    if (!window.confirm("Supprimer définitivement cette vision ?")) return;
    const next = visions.filter((v) => v.id !== id);
    setVisions(next);
    saveVisions(problemId, next);
  };

  const goBackToProblems = () => {
    window.location.href = "/projects";
  };

  const problemLabel =
    problemName && problemName.trim().length > 0
      ? problemName
      : "(problème sans nom)";

  return (
    <div style={{ maxWidth: 900, margin: "2rem auto", padding: "0 1rem" }}>
      <button
        type="button"
        onClick={goBackToProblems}
        style={{
          marginBottom: "1rem",
          padding: "0.4rem 0.8rem",
          borderRadius: 4,
          border: "1px solid #ccc",
          backgroundColor: "#f7f7f7",
          cursor: "pointer",
        }}
      >
        ← Revenir à la liste des problèmes
      </button>

      <h1 style={{ fontSize: "1.6rem", marginBottom: "0.5rem" }}>
        Visions du problème
      </h1>

      <p style={{ marginBottom: "0.25rem" }}>
        <strong>Nom :</strong> {problemLabel}
      </p>
      {problemShort && (
        <p style={{ marginBottom: "1.5rem", color: "#555" }}>
          <strong>Définition courte :</strong> {problemShort}
        </p>
      )}

      {/* Création d'une nouvelle vision */}
      <section
        style={{
          border: "1px solid #ddd",
          borderRadius: 8,
          padding: "1rem",
          marginBottom: "2rem",
        }}
      >
        <h2 style={{ fontSize: "1.2rem", marginBottom: "0.75rem" }}>
          Créer une nouvelle vision
        </h2>

        <form onSubmit={handleCreateVision}>
          <div style={{ marginBottom: "0.75rem" }}>
            <label
              htmlFor="vision-name"
              style={{ display: "block", fontWeight: 600, marginBottom: 4 }}
            >
              Nom de la vision
            </label>
            <input
              id="vision-name"
              type="text"
              value={visionName}
              onChange={(e) => setVisionName(e.target.value)}
              placeholder="Ex : rester salarié sans activité complémentaire"
              style={{
                width: "100%",
                padding: "0.4rem 0.6rem",
                borderRadius: 4,
                border: "1px solid #ccc",
              }}
            />
          </div>

          <div style={{ marginBottom: "0.75rem" }}>
            <label
              htmlFor="vision-short"
              style={{ display: "block", fontWeight: 600, marginBottom: 4 }}
            >
              Définition courte de la vision
            </label>
            <textarea
              id="vision-short"
              value={visionShort}
              onChange={(e) => setVisionShort(e.target.value)}
              placeholder="Quelques mots pour distinguer cette vision des autres."
              rows={2}
              style={{
                width: "100%",
                padding: "0.4rem 0.6rem",
                borderRadius: 4,
                border: "1px solid #ccc",
                resize: "vertical",
              }}
            />
          </div>

          <button
            type="submit"
            style={{
              padding: "0.45rem 0.9rem",
              borderRadius: 4,
              border: "none",
              backgroundColor: "#2563eb",
              color: "white",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Créer cette vision
          </button>
        </form>
      </section>

      {/* Liste des visions existantes */}
      <section>
        <h2 style={{ fontSize: "1.2rem", marginBottom: "0.75rem" }}>
          Visions existantes pour ce problème
        </h2>

        {visions.length === 0 ? (
          <p style={{ color: "#666" }}>Aucune vision pour l’instant.</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {visions.map((vision) => {
              const urlDefLongue = `/vision?problemName=${encodeURIComponent(
                problemLabel
              )}&problemShort=${encodeURIComponent(
                problemShort || ""
              )}&visionId=${encodeURIComponent(
                vision.id
              )}&visionName=${encodeURIComponent(vision.name)}`;

              return (
                <li
                  key={vision.id}
                  style={{
                    border: "1px solid #e5e5e5",
                    borderRadius: 8,
                    padding: "0.75rem 1rem",
                    marginBottom: "0.75rem",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "baseline",
                      gap: "0.5rem",
                    }}
                  >
                    <div>
                      <strong>{vision.name}</strong>
                      {vision.shortDefinition && (
                        <div style={{ color: "#555", marginTop: 4 }}>
                          {vision.shortDefinition}
                        </div>
                      )}
                    </div>

                    <small style={{ color: "#888" }}>
                      Créée le{" "}
                      {new Date(vision.createdAt).toLocaleString("fr-FR", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </small>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "0.5rem",
                      marginTop: "0.75rem",
                    }}
                  >
                    <a
                      href={urlDefLongue}
                      style={{
                        padding: "0.3rem 0.7rem",
                        borderRadius: 4,
                        border: "1px solid #2563eb",
                        color: "#2563eb",
                        textDecoration: "none",
                        fontSize: "0.9rem",
                      }}
                    >
                      Voir ou créer la définition longue
                    </a>

                    <button
                      type="button"
                      onClick={() => handleDeleteVision(vision.id)}
                      style={{
                        padding: "0.3rem 0.7rem",
                        borderRadius: 4,
                        border: "1px solid #dc2626",
                        backgroundColor: "white",
                        color: "#dc2626",
                        fontSize: "0.9rem",
                        cursor: "pointer",
                      }}
                    >
                      Supprimer cette vision
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

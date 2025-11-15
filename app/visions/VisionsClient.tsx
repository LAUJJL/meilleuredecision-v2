"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Vision = {
  id: string;
  name: string;
  shortDef: string;
};

function storageKey(problemName: string) {
  return `md_visions_v1_${problemName}`;
}

export default function VisionsClient({
  problemName,
  problemShort,
}: {
  problemName: string;
  problemShort: string;
}) {
  const router = useRouter();

  const [visions, setVisions] = useState<Vision[]>([]);
  const [newName, setNewName] = useState("");
  const [newShort, setNewShort] = useState("");

  useEffect(() => {
    if (!problemName || typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(storageKey(problemName));
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) setVisions(parsed);
    } catch (e) {
      console.error("Erreur lecture visions :", e);
    }
  }, [problemName]);

  useEffect(() => {
    if (!problemName || typeof window === "undefined") return;
    try {
      window.localStorage.setItem(storageKey(problemName), JSON.stringify(visions));
    } catch (e) {
      console.error("Erreur sauvegarde visions :", e);
    }
  }, [problemName, visions]);

  function handleCreateVision() {
    const trimmed = newName.trim();
    if (!trimmed) return;

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

  function goToVisionDefinition(v: Vision) {
    const params = new URLSearchParams({
      problemName,
      problemShort,
      visionId: v.id,
      visionName: v.name,
      visionShort: v.shortDef,
    });
    router.push(`/vision?${params.toString()}`);
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

      <section style={{ marginTop: 16, marginBottom: 24 }}>
        <h2>Problème sélectionné</h2>
        <p>
          <strong>Nom :</strong> {problemName || "(problème inconnu)"}
        </p>
        {problemShort && (
          <p>
            <strong>Définition courte :</strong> {problemShort}
          </p>
        )}
      </section>

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
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Ex : Vision optimiste"
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
            Définition courte
          </label>
          <textarea
            id="new-vision-short"
            value={newShort}
            onChange={(e) => setNewShort(e.target.value)}
            rows={2}
            placeholder="Ex : Variation rapide de la trésorerie"
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
          disabled={!newName.trim()}
          style={{
            padding: "8px 20px",
            borderRadius: 4,
            border: "none",
            backgroundColor: newName.trim() ? "#2563eb" : "#9ca3af",
            color: "white",
            cursor: newName.trim() ? "pointer" : "not-allowed",
          }}
        >
          Créer cette vision
        </button>
      </section>

      <section>
        <h2>Visions existantes</h2>

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
                    Voir la définition longue
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

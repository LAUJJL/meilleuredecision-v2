// app/visions/VisionsClient.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Vision = {
  id: string;
  name: string;
  shortDef: string;
};

function visionsStorageKey(problemId: string) {
  return `md_visions_v1_${problemId}`;
}

export default function VisionsClient() {
  const router = useRouter();

  const [problemId, setProblemId] = useState("");
  const [problemName, setProblemName] = useState("");
  const [problemShort, setProblemShort] = useState("");

  const [visions, setVisions] = useState<Vision[]>([]);
  const [newName, setNewName] = useState("");
  const [newShort, setNewShort] = useState("");

  // Lecture des paramètres d’URL (problème) + chargement des visions
  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);

    const pId = params.get("problemId") ?? "";
    const pName = params.get("problemName") ?? "";
    const pShort = params.get("problemShort") ?? "";

    setProblemId(pId);
    setProblemName(pName);
    setProblemShort(pShort);

    if (!pId) {
      // Pas d’id de problème ⇒ on ne cherche rien dans le localStorage
      return;
    }

    try {
      const raw = window.localStorage.getItem(visionsStorageKey(pId));
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setVisions(parsed);
      }
    } catch (e) {
      console.error("Erreur de lecture des visions :", e);
    }
  }, []);

  // Sauvegarde automatique des visions à chaque changement
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
    if (!problemId) return;

    // On supprime la vision dans la liste locale
    setVisions((prev) => prev.filter((v) => v.id !== id));

    // Optionnel : on peut aussi effacer ici les données de raffinements
    // associées à cette vision si tu enregistres des choses dans le localStorage
    // avec des clés basées sur visionId.
  }

  function goBackToProblems() {
    router.push("/");
  }

  function goToVisionDefinition(v: Vision) {
    const params = new URLSearchParams({
      problemName: problemName,
      problemShort: problemShort,
      visionId: v.id,
      visionName: v.name,
      visionShort: v.shortDef,
    });
    router.push(`/vision?${params.toString()}`);
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

      {/* Contexte problème */}
      <section style={{ marginTop: 16, marginBottom: 24 }}>
        <h2>Problème sélectionné</h2>
        <p>
          <strong>Nom :</strong>{" "}
          {problemName ? problemName : "(problème inconnu)"}
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

        {!problemId && (
          <p
            style={{
              marginTop: 8,
              marginBottom: 8,
              fontSize: 14,
              color: "#b91c1c",
            }}
          >
            Attention : aucun identifiant de problème n’a été trouvé dans l’URL.
            Revenez à la liste des problèmes et cliquez à nouveau sur le bouton
            « Voir, créer ou effacer les visions de ce problème ».
          </p>
        )}

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
            disabled={!problemId}
            style={{
              width: "100%",
              padding: 8,
              borderRadius: 4,
              border: "1px solid #ccc",
              backgroundColor: problemId ? "white" : "#f9fafb",
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
            disabled={!problemId}
            style={{
              width: "100%",
              padding: 8,
              borderRadius: 4,
              border: "1px solid #ccc",
              resize: "vertical",
              backgroundColor: problemId ? "white" : "#f9fafb",
            }}
          />
        </div>

        <button
          onClick={handleCreateVision}
          disabled={!problemId || !newName.trim()}
          style={{
            padding: "8px 20px",
            borderRadius: 4,
            border: "none",
            backgroundColor:
              problemId && newName.trim() ? "#2563eb" : "#9ca3af",
            color: "white",
            cursor:
              problemId && newName.trim() ? "pointer" : "not-allowed",
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

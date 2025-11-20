"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Vision = {
  id: string;
  name: string;
  short: string;
  // on pourra plus tard ajouter longDefinition, etc.
};

function visionsStorageKey(problemId: string) {
  return `md_visions_${problemId}`;
}

export default function VisionsClient() {
  const router = useRouter();

  const [problemId, setProblemId] = useState("");
  const [problemName, setProblemName] = useState<string>("");
  const [problemShort, setProblemShort] = useState<string>("");

  const [visions, setVisions] = useState<Vision[]>([]);

  const [newVisionName, setNewVisionName] = useState("");
  const [newVisionShort, setNewVisionShort] = useState("");

  // 1) Lire le contexte directement depuis l'URL (côté client)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);

    const pid = params.get("problemId") ?? "";
    const pname = params.get("problemName") ?? "";
    const pshort = params.get("problemShort") ?? "";

    setProblemId(pid);
    setProblemName(pname || "(problème sans nom)");
    setProblemShort(pshort);
  }, []);

  // 2) Charger les visions du problème quand on connaît problemId
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!problemId) return;

    try {
      const raw = window.localStorage.getItem(visionsStorageKey(problemId));
      if (!raw) {
        setVisions([]);
        return;
      }
      const parsed = JSON.parse(raw) as Vision[];
      setVisions(Array.isArray(parsed) ? parsed : []);
    } catch (e) {
      console.error("Erreur de chargement des visions :", e);
      setVisions([]);
    }
  }, [problemId]);

  // 3) Sauvegarder les visions à chaque modification
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
  }, [visions, problemId]);

  function handleCreateVision() {
    if (!problemId) {
      alert(
        "Problème introuvable. Revenez à la liste des problèmes et rouvrez-en un."
      );
      return;
    }

    const name = newVisionName.trim();
    const short = newVisionShort.trim();

    if (!name) {
      alert("Merci de saisir au moins un nom de vision.");
      return;
    }

    const newVision: Vision = {
      id: `v_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      name,
      short,
    };

    setVisions((prev) => [...prev, newVision]);
    setNewVisionName("");
    setNewVisionShort("");
  }

  function handleDeleteVision(id: string) {
    if (!window.confirm("Supprimer définitivement cette vision ?")) return;
    setVisions((prev) => prev.filter((v) => v.id !== id));
  }

  function goBackToProblems() {
    router.push("/problems");
  }

  function goToVisionLongDefinition(v: Vision) {
    // Lien vers la page qui gère la définition longue de la vision.
    // On continue à passer le contexte par l’URL, comme pour les phases.
    const params = new URLSearchParams({
      problemName: problemName,
      problemShort: problemShort,
      visionId: v.id,
      visionName: v.name,
      visionShort: v.short,
    });

    router.push(`/vision?${params.toString()}`);
  }

  return (
    <main style={{ maxWidth: 900, margin: "32px auto", padding: "0 16px" }}>
      {/* Bouton retour */}
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
          <strong>Nom :</strong> {problemName || "(problème sans nom)"}
        </p>
        {problemShort && (
          <p>
            <strong>Définition courte :</strong> {problemShort}
          </p>
        )}
      </section>

      {/* Création d'une nouvelle vision */}
      <section
        style={{
          border: "1px solid #ddd",
          borderRadius: 8,
          padding: 24,
          marginBottom: 32,
        }}
      >
        <h2>Créer une nouvelle vision</h2>

        <div style={{ marginTop: 12 }}>
          <label
            htmlFor="vision-name"
            style={{ display: "block", fontWeight: 600, marginBottom: 4 }}
          >
            Nom de la vision
          </label>
          <input
            id="vision-name"
            type="text"
            value={newVisionName}
            onChange={(e) => setNewVisionName(e.target.value)}
            placeholder="Ex : rester salarié sans activité complémentaire"
            style={{
              width: "100%",
              padding: 8,
              borderRadius: 4,
              border: "1px solid #ccc",
            }}
          />
        </div>

        <div style={{ marginTop: 12 }}>
          <label
            htmlFor="vision-short"
            style={{ display: "block", fontWeight: 600, marginBottom: 4 }}
          >
            Définition courte de la vision
          </label>
          <textarea
            id="vision-short"
            value={newVisionShort}
            onChange={(e) => setNewVisionShort(e.target.value)}
            rows={3}
            placeholder="Quelques mots pour distinguer cette vision des autres."
            style={{
              width: "100%",
              padding: 8,
              borderRadius: 4,
              border: "1px solid #ccc",
              resize: "vertical",
            }}
          />
        </div>

        <div style={{ marginTop: 16 }}>
          <button
            onClick={handleCreateVision}
            style={{
              padding: "8px 20px",
              borderRadius: 6,
              border: "none",
              backgroundColor: "#2563eb",
              color: "white",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Créer cette vision
          </button>
        </div>
      </section>

      {/* Liste des visions existantes */}
      <section style={{ marginBottom: 32 }}>
        <h2>Visions existantes pour ce problème</h2>

        {visions.length === 0 ? (
          <p style={{ marginTop: 8 }}>Aucune vision pour l’instant.</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, marginTop: 12 }}>
            {visions.map((v) => (
              <li
                key={v.id}
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: 8,
                  padding: 16,
                  marginBottom: 12,
                }}
              >
                <p style={{ margin: 0, fontWeight: 600 }}>{v.name}</p>
                {v.short && (
                  <p style={{ marginTop: 4, marginBottom: 8, color: "#4b5563" }}>
                    {v.short}
                  </p>
                )}

                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <button
                    onClick={() => goToVisionLongDefinition(v)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: 4,
                      border: "1px solid #2563eb",
                      backgroundColor: "white",
                      color: "#2563eb",
                      cursor: "pointer",
                      fontSize: 14,
                    }}
                  >
                    Voir ou créer la définition longue
                  </button>

                  <button
                    onClick={() => handleDeleteVision(v.id)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: 4,
                      border: "1px solid #dc2626",
                      backgroundColor: "white",
                      color: "#dc2626",
                      cursor: "pointer",
                      fontSize: 14,
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

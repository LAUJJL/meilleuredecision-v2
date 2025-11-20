// app/visions/VisionsClient.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Vision = {
  id: string;
  name: string;
  short: string;
  createdAt: string;
};

type Props = {
  problemId: string;
  problemName: string;
  problemShort: string;
};

function visionsStorageKey(problemId: string) {
  return `md_visions_${problemId}`;
}

// Petit utilitaire pour créer un id local
function makeId() {
  return Math.random().toString(36).slice(2, 10);
}

export default function VisionsClient({
  problemId,
  problemName,
  problemShort,
}: Props) {
  const router = useRouter();

  const [visions, setVisions] = useState<Vision[]>([]);
  const [newVisionName, setNewVisionName] = useState("");
  const [newVisionShort, setNewVisionShort] = useState("");

  // Charger les visions pour ce problème
  useEffect(() => {
    if (typeof window === "undefined" || !problemId) return;

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

  // Sauvegarde des visions
  function saveVisions(next: Vision[]) {
    setVisions(next);
    if (typeof window === "undefined" || !problemId) return;
    try {
      window.localStorage.setItem(visionsStorageKey(problemId), JSON.stringify(next));
    } catch (e) {
      console.error("Erreur de sauvegarde des visions :", e);
    }
  }

  // Création d’une vision
  function handleCreateVision() {
    const name = newVisionName.trim();
    const short = newVisionShort.trim();

    if (!name) {
      alert("Merci de donner un nom à la vision.");
      return;
    }

    const id = makeId();
    const now = new Date().toISOString();

    const next: Vision[] = [
      ...visions,
      {
        id,
        name,
        short,
        createdAt: now,
      },
    ];

    saveVisions(next);
    setNewVisionName("");
    setNewVisionShort("");

    // On enchaîne directement vers le premier raffinement
    const params = new URLSearchParams({
      problemName,
      problemShort,
      visionId: id,
      visionName: name,
      visionShort: short,
    });

    router.push(`/vision-phase1?${params.toString()}`);
  }

  // Suppression d’une vision
  function handleDeleteVision(id: string) {
    if (!confirm("Supprimer définitivement cette vision et ses raffinements locaux ?")) {
      return;
    }
    const next = visions.filter((v) => v.id !== id);
    saveVisions(next);

    // On pourrait aussi nettoyer des clés locales spécifiques à la vision
    // (snapshots, raffinements…), mais on le fera plus tard pour ne pas
    // compliquer pour l’instant.
  }

  // Ouvrir une vision existante (on part au premier raffinement)
  function handleOpenVision(v: Vision) {
    const params = new URLSearchParams({
      problemName,
      problemShort,
      visionId: v.id,
      visionName: v.name,
      visionShort: v.short,
    });
    router.push(`/vision-phase1?${params.toString()}`);
  }

  // Retour à la liste des problèmes
  function goBackToProblems() {
    router.push("/projects");
  }

  const headerName =
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

      <section style={{ marginTop: 16, marginBottom: 24 }}>
        <h2>Problème sélectionné</h2>
        <p>
          <strong>Nom :</strong> {headerName}
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
          border: "1px solid #e5e7eb",
          borderRadius: 8,
          padding: 24,
          marginBottom: 32,
        }}
      >
        <h2>Créer une nouvelle vision</h2>
        <p style={{ fontSize: 14, color: "#4b5563", marginTop: 8 }}>
          Donnez un nom à votre vision (par exemple : « rester salarié sans activité
          complémentaire », « développer une activité complémentaire », etc.).
        </p>

        <div style={{ marginTop: 16 }}>
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
            placeholder="Ex : Rester salarié sans ajouter d’activités"
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
              border: "1px solid #d1d5db",
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
          <p style={{ marginTop: 8, color: "#6b7280" }}>
            Aucune vision pour l’instant.
          </p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, marginTop: 12 }}>
            {visions.map((v) => (
              <li
                key={v.id}
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: 8,
                  padding: 12,
                  marginBottom: 8,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 8,
                  flexWrap: "wrap",
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600 }}>{v.name}</div>
                  {v.short && (
                    <div style={{ fontSize: 13, color: "#4b5563" }}>{v.short}</div>
                  )}
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => handleOpenVision(v)}
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
                    Ouvrir cette vision
                  </button>
                  <button
                    onClick={() => handleDeleteVision(v.id)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: 6,
                      border: "1px solid #b91c1c",
                      backgroundColor: "white",
                      color: "#b91c1c",
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

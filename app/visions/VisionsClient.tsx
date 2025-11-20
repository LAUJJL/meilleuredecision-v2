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

const VISIONS_STORAGE_PREFIX = "md_visions_v1_";

function visionsStorageKey(problemId: string) {
  const id = problemId && problemId.trim().length > 0 ? problemId : "default";
  return `${VISIONS_STORAGE_PREFIX}${id}`;
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

  // Charger les visions du problème
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const key = visionsStorageKey(problemId);
      const raw = window.localStorage.getItem(key);
      if (!raw) {
        setVisions([]);
        return;
      }
      const parsed = JSON.parse(raw) as Vision[];
      if (Array.isArray(parsed)) {
        setVisions(parsed);
      } else {
        setVisions([]);
      }
    } catch (e) {
      console.error("Erreur de chargement des visions :", e);
      setVisions([]);
    }
  }, [problemId]);

  function saveVisions(next: Vision[]) {
    setVisions(next);
    if (typeof window === "undefined") return;
    try {
      const key = visionsStorageKey(problemId);
      window.localStorage.setItem(key, JSON.stringify(next));
    } catch (e) {
      console.error("Erreur lors de l’enregistrement des visions :", e);
    }
  }

  function goBackToProjects() {
    router.push("/projects");
  }

  function handleCreateVision() {
    const name = newVisionName.trim();
    const short = newVisionShort.trim();

    if (!name) {
      alert("Merci de donner un nom à la vision.");
      return;
    }

    const id = `v_${Date.now().toString(36)}_${Math.random()
      .toString(36)
      .slice(2, 8)}`;

    const vision: Vision = {
      id,
      name,
      short,
      createdAt: new Date().toISOString(),
    };

    saveVisions([...visions, vision]);
    setNewVisionName("");
    setNewVisionShort("");
  }

  function handleDeleteVision(id: string) {
    if (!confirm("Supprimer définitivement cette vision ?")) return;
    const next = visions.filter((v) => v.id !== id);
    saveVisions(next);

    // (Option : ici on pourrait aussi effacer les raffinements de cette vision)
  }

  function openVisionDefinition(v: Vision) {
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
      <button
        onClick={goBackToProjects}
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

      {/* Contexte du problème */}
      <section style={{ marginTop: 16, marginBottom: 24 }}>
        <h2>Problème sélectionné</h2>
        <p>
          <strong>Nom :</strong>{" "}
          {problemName && problemName.trim().length > 0
            ? problemName
            : "(problème sans nom)"}
        </p>
        {problemShort && (
          <p>
            <strong>Définition courte :</strong> {problemShort}
          </p>
        )}
      </section>

      {/* Création d'une vision */}
      <section
        style={{
          border: "1px solid #ddd",
          borderRadius: 8,
          padding: 24,
          marginBottom: 32,
        }}
      >
        <h2>Créer une nouvelle vision</h2>
        <p style={{ fontSize: 14, color: "#4b5563", marginTop: 8 }}>
          Donnez un nom à cette vision et, si vous le souhaitez, une courte
          définition pour la distinguer des autres.
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
            rows={3}
            value={newVisionShort}
            onChange={(e) => setNewVisionShort(e.target.value)}
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
              padding: "10px 24px",
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

      {/* Liste des visions */}
      <section style={{ marginBottom: 32 }}>
        <h2>Visions existantes pour ce problème</h2>
        {visions.length === 0 ? (
          <p style={{ marginTop: 8 }}>Aucune vision pour l’instant.</p>
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
                }}
              >
                <div style={{ fontWeight: 600 }}>{v.name}</div>
                {v.short && (
                  <div style={{ fontSize: 14, color: "#4b5563", marginTop: 4 }}>
                    {v.short}
                  </div>
                )}
                <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                  <button
                    onClick={() => openVisionDefinition(v)}
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
                      border: "1px solid #b91c1c",
                      backgroundColor: "white",
                      color: "#b91c1c",
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

// app/visions/VisionsClient.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Vision = {
  id: string;
  name: string;
  shortDefinition: string;
  longDefinition?: string | null;
};

type Props = {
  problemId: string;
  problemName: string;
  problemShort: string;
};

function visionsStorageKey(problemId: string) {
  return `md_visions_${problemId}`;
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
      setVisions(parsed);
    } catch (e) {
      console.error("Erreur de chargement des visions :", e);
      setVisions([]);
    }
  }, [problemId]);

  function saveVisions(next: Vision[]) {
    setVisions(next);
    if (!problemId || typeof window === "undefined") return;
    try {
      window.localStorage.setItem(
        visionsStorageKey(problemId),
        JSON.stringify(next)
      );
    } catch (e) {
      console.error("Erreur d’enregistrement des visions :", e);
    }
  }

  function handleCreateVision() {
    const name = newVisionName.trim();
    const shortDef = newVisionShort.trim();

    if (!name) {
      alert("Merci de donner un nom à la vision.");
      return;
    }

    const id = `${Date.now().toString(36)}_${Math.random()
      .toString(36)
      .slice(2, 8)}`;

    const newVision: Vision = {
      id,
      name,
      shortDefinition: shortDef,
    };

    const updated = [...visions, newVision];
    saveVisions(updated);

    setNewVisionName("");
    setNewVisionShort("");
  }

  function handleDeleteVision(visionId: string) {
    if (
      !window.confirm(
        "Confirmez-vous la suppression de cette vision et de tous ses raffinements ?"
      )
    ) {
      return;
    }

    const updated = visions.filter((v) => v.id !== visionId);
    saveVisions(updated);

    // On efface aussi les raffinements associés dans le stockage local
    try {
      window.localStorage.removeItem(`md_phase0_${visionId}`);
      window.localStorage.removeItem(`md_phase1_qual_${visionId}`);
      window.localStorage.removeItem(`md_phase1_quant_${visionId}`);
      window.localStorage.removeItem(`md_ref2_part1_${visionId}`);
      window.localStorage.removeItem(`md_ref2_part2_${visionId}`);
      window.localStorage.removeItem(`md_refinement1_locked_${visionId}`);
      window.localStorage.removeItem(`md_refinement2_locked_${visionId}`);
      window.localStorage.removeItem(`md_snapshot_${visionId}_1`);
      window.localStorage.removeItem(`md_snapshot_${visionId}_2`);
    } catch (e) {
      console.error(
        "Erreur lors de la suppression des données de raffinements pour cette vision :",
        e
      );
    }
  }

  function goBackToProblems() {
    router.push("/projects");
  }

  function goToLongDefinition(vision: Vision) {
    const params = new URLSearchParams({
      problemName: problemName,
      problemShort: problemShort,
      visionId: vision.id,
      visionName: vision.name,
      visionShort: vision.shortDefinition ?? "",
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

      <section style={{ marginTop: 12, marginBottom: 24 }}>
        <p>
          <strong>Nom :</strong>{" "}
          {problemName && problemName !== "(problème sans nom)"
            ? problemName
            : "(problème sans nom)"}
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
            placeholder="Ex : Vision pessimiste de la trésorerie"
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

        <button
          onClick={handleCreateVision}
          style={{
            marginTop: 16,
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
      </section>

      {/* Liste des visions existantes */}
      <section style={{ marginBottom: 32 }}>
        <h2>Visions existantes pour ce problème</h2>

        {visions.length === 0 ? (
          <p style={{ marginTop: 8 }}>Aucune vision pour l’instant.</p>
        ) : (
          <ul style={{ listStyleType: "none", padding: 0, marginTop: 16 }}>
            {visions.map((vision) => (
              <li
                key={vision.id}
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
                  <strong>{vision.name}</strong>
                  {vision.shortDefinition && (
                    <p style={{ marginTop: 4, color: "#4b5563" }}>
                      {vision.shortDefinition}
                    </p>
                  )}
                </div>

                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <button
                    onClick={() => goToLongDefinition(vision)}
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
                    onClick={() => handleDeleteVision(vision.id)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: 4,
                      border: "1px solid #dc2626",
                      backgroundColor: "#fee2e2",
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

// app/visions/VisionsClient.tsx
"use client";

import { useEffect, useState, FormEvent } from "react";
import Link from "next/link";

type Vision = {
  id: string;
  name: string;
  shortDefinition: string;
};

type Props = {
  problemId: string;
  problemName: string;
  problemShort: string;
};

export default function VisionsClient({
  problemId,
  problemName,
  problemShort,
}: Props) {
  const [visions, setVisions] = useState<Vision[]>([]);

  // Clé de stockage des visions pour ce problème
  const storageKey =
    problemId && problemId.length > 0
      ? `md:visions:${problemId}`
      : "md:visions:__no_id__";

  // Charger les visions au montage
  useEffect(() => {
    if (!problemId) return;

    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) {
        setVisions([]);
        return;
      }
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setVisions(parsed);
      } else {
        setVisions([]);
      }
    } catch (e) {
      console.error("Erreur lors du chargement des visions", e);
      setVisions([]);
    }
  }, [storageKey, problemId]);

  // Sauvegarde dans le localStorage
  const saveVisions = (newVisions: Vision[]) => {
    setVisions(newVisions);
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(newVisions));
    } catch (e) {
      console.error("Erreur lors de l'enregistrement des visions", e);
    }
  };

  // Création d'une nouvelle vision
  const handleCreate = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    const name = String(formData.get("visionName") ?? "").trim();
    const shortDefinition = String(
      formData.get("visionShort") ?? ""
    ).trim();

    if (!name) {
      alert("Veuillez saisir un nom pour la vision.");
      return;
    }

    const newVision: Vision = {
      id: crypto.randomUUID(),
      name,
      shortDefinition,
    };

    const newList = [...visions, newVision];
    saveVisions(newList);
    form.reset();
  };

  const handleDelete = (id: string) => {
    if (!confirm("Supprimer définitivement cette vision ?")) return;
    const newList = visions.filter((v) => v.id !== id);
    saveVisions(newList);
  };

  const safeProblemName =
    problemName && problemName.trim().length > 0
      ? problemName.trim()
      : "(problème sans nom)";

  return (
    <main style={{ maxWidth: 800, margin: "0 auto", padding: "1rem" }}>
      <Link href="/projects">
        <button style={{ marginBottom: "1rem" }}>
          ← Revenir à la liste des problèmes
        </button>
      </Link>

      <h1>Visions du problème</h1>

      <p>
        <strong>Nom :</strong> {safeProblemName}
      </p>
      {problemShort && (
        <p>
          <strong>Définition courte :</strong> {problemShort}
        </p>
      )}

      <hr />

      {/* Formulaire de création de vision */}
      <section style={{ marginTop: "1rem", marginBottom: "2rem" }}>
        <h2>Créer une nouvelle vision</h2>
        <form onSubmit={handleCreate}>
          <div style={{ marginBottom: "0.5rem" }}>
            <label>
              Nom de la vision
              <input
                type="text"
                name="visionName"
                placeholder="Ex : rester salarié sans activités supplémentaires"
                style={{ display: "block", width: "100%", marginTop: "0.25rem" }}
              />
            </label>
          </div>

          <div style={{ marginBottom: "0.5rem" }}>
            <label>
              Définition courte de la vision
              <textarea
                name="visionShort"
                rows={3}
                placeholder="Quelques mots pour distinguer cette vision des autres."
                style={{ display: "block", width: "100%", marginTop: "0.25rem" }}
              />
            </label>
          </div>

          <button type="submit">Créer cette vision</button>
        </form>
      </section>

      {/* Liste des visions existantes */}
      <section>
        <h2>Visions existantes pour ce problème</h2>

        {visions.length === 0 && <p>Aucune vision pour l’instant.</p>}

        {visions.map((vision) => {
          const params = new URLSearchParams({
            problemId,
            problemName: safeProblemName,
            problemShort: problemShort ?? "",
            visionId: vision.id,
            visionName: vision.name,
          }).toString();

          const phase1Url = `/vision-phase1?${params}`;

          return (
            <div
              key={vision.id}
              style={{
                border: "1px solid #ddd",
                padding: "0.75rem",
                marginBottom: "0.75rem",
                borderRadius: "4px",
              }}
            >
              <strong>{vision.name}</strong>
              {vision.shortDefinition && (
                <p style={{ margin: "0.25rem 0 0.5rem" }}>
                  {vision.shortDefinition}
                </p>
              )}

              <div style={{ display: "flex", gap: "0.5rem" }}>
                <Link href={phase1Url}>
                  <button>Ouvrir cette vision</button>
                </Link>
                <button onClick={() => handleDelete(vision.id)}>Supprimer</button>
              </div>
            </div>
          );
        })}
      </section>
    </main>
  );
}

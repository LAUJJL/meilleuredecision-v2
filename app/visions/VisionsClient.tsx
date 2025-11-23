"use client";

type VisionsClientProps = {
  problemId: string;
  problemName: string;
  problemShort: string;
};

export default function VisionsClient({
  problemId,
  problemName,
  problemShort,
}: VisionsClientProps) {
  // Version minimale : on affiche juste les infos du problème
  // et un petit message. On rajoutera la vraie logique plus tard.
  return (
    <main
      style={{
        maxWidth: "800px",
        margin: "2rem auto",
        padding: "1.5rem",
        border: "1px solid #ddd",
        borderRadius: "8px",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <button
        type="button"
        onClick={() => {
          window.location.href = "/projects";
        }}
        style={{
          marginBottom: "1.5rem",
          padding: "0.5rem 1rem",
          borderRadius: "4px",
          border: "1px solid #ccc",
          background: "#f5f5f5",
          cursor: "pointer",
        }}
      >
        ← Revenir à la liste des problèmes
      </button>

      <h1 style={{ fontSize: "1.6rem", marginBottom: "0.75rem" }}>
        Visions du problème
      </h1>

      <p style={{ margin: "0.25rem 0" }}>
        <strong>Nom :</strong>{" "}
        {problemName && problemName.trim().length > 0
          ? problemName
          : "(problème sans nom)"}
      </p>

      {problemShort && problemShort.trim().length > 0 && (
        <p style={{ margin: "0.25rem 0 1rem 0" }}>
          <strong>Définition courte :</strong> {problemShort}
        </p>
      )}

      {problemId && (
        <p style={{ margin: "0.25rem 0 1rem 0", fontSize: "0.9rem", color: "#666" }}>
          <strong>ID technique :</strong> {problemId}
        </p>
      )}

      <hr style={{ margin: "1.5rem 0" }} />

      <p style={{ marginBottom: "0.5rem" }}>
        Cette page est une <strong>version minimale</strong> de la gestion des
        visions. La logique plus avancée (sauvegarde en base, liste des visions,
        etc.) sera réintroduite plus tard, une fois la base stable.
      </p>
    </main>
  );
}

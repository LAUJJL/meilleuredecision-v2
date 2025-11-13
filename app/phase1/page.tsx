// app/phase1/page.tsx

import Link from "next/link";

export default function Phase1Page() {
  return (
    <main
      style={{
        padding: 32,
        maxWidth: 800,
        margin: "0 auto",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <h1>Phase 1 — maquette minimale</h1>

      <p style={{ marginTop: 16 }}>
        Cette page est volontairement simplifiée : elle ne contient que les
        boutons de navigation. Le contenu réel de la phase&nbsp;1
        (stock, flux, graphique, etc.) sera ajouté dans un deuxième temps.
      </p>

      <div
        style={{
          marginTop: 40,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {/* Bouton : revenir à la vision */}
        <Link
          href="/visions"
          style={{
            padding: "10px 14px",
            borderRadius: 6,
            border: "1px solid #ccc",
            textDecoration: "none",
            display: "inline-block",
          }}
        >
          ← Revenir à la vision
        </Link>

        {/* Bouton : revenir au problème */}
        <Link
          href="/"
          style={{
            padding: "10px 14px",
            borderRadius: 6,
            border: "1px solid #ccc",
            textDecoration: "none",
            display: "inline-block",
          }}
        >
          ← Revenir au problème
        </Link>

        {/* Bouton : valider la phase 1 et aller vers une phase 2 fictive */}
        <Link
          href="/phase2"
          style={{
            padding: "10px 14px",
            borderRadius: 6,
            border: "1px solid #0066cc",
            backgroundColor: "#0066cc",
            color: "white",
            textDecoration: "none",
            display: "inline-block",
            marginTop: 8,
          }}
        >
          Valider la phase 1 et passer à la phase 2
        </Link>
      </div>
    </main>
  );
}

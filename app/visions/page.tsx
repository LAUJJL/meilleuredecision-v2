// app/visions/page.tsx

import Link from "next/link";

export default function VisionsPage() {
  return (
    <main
      style={{
        padding: "24px",
        maxWidth: 800,
        margin: "0 auto",
        fontFamily: "system-ui, sans-serif",
        lineHeight: 1.5,
      }}
    >
      <h1>Visions du problème (démo minimaliste)</h1>

      <p>
        Cette page est pour l’instant une version très simple, juste pour que le
        site compile. On complétera plus tard avec la vraie gestion des visions.
      </p>

      <p>
        Choisissez simplement ce que vous voulez faire&nbsp;:
      </p>

      <div style={{ marginTop: 24, display: "flex", gap: 12 }}>
        <Link href="/">
          <button type="button">← Accueil</button>
        </Link>

        <Link href="/phase1">
          <button type="button">Aller à la phase 1</button>
        </Link>
      </div>
    </main>
  );
}

// app/phase2/page.tsx

import Link from "next/link";

export default function Phase2Page() {
  return (
    <main
      style={{
        padding: 32,
        maxWidth: 800,
        margin: "0 auto",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <h1>Phase 2 — placeholder</h1>

      <p style={{ marginTop: 16 }}>
        Cette page est pour l’instant une simple coquille vide. Nous y
        construirons plus tard la vraie Phase&nbsp;2, une fois que la Phase&nbsp;1 sera
        entièrement définie et stable.
      </p>

      <div style={{ marginTop: 32 }}>
        <Link
          href="/phase1"
          style={{
            padding: "10px 14px",
            borderRadius: 6,
            border: "1px solid #ccc",
            textDecoration: "none",
            display: "inline-block",
          }}
        >
          ← Revenir à la phase 1
        </Link>
      </div>
    </main>
  );
}

// app/phase2/page.tsx
// Page de démonstration Phase 2 – surtout ne pas importer /refinements/page.tsx ici.

import Link from "next/link";

export default function Phase2Page() {
  return (
    <main style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 16 }}>Phase 2</h1>

      <p style={{ marginBottom: 16 }}>
        Contenu de la Phase 2 (à compléter selon vos specs).
      </p>

      <div style={{ display: "flex", gap: 12 }}>
        <Link href="/refinements" style={{ padding: "8px 12px", border: "1px solid #ccc", borderRadius: 8 }}>
          ← Revenir aux visions
        </Link>
        <Link href="/" style={{ padding: "8px 12px", border: "1px solid #ccc", borderRadius: 8 }}>
          Accueil
        </Link>
      </div>
    </main>
  );
}

// app/refinements/ClientPage.tsx
"use client";

import Link from "next/link";
import { useState } from "react";

export default function ClientPage() {
  // Démo minimaliste : mettez ici votre UI interactive / états.
  const [message] = useState("Visions du problème (démo minimaliste)");

  return (
    <main style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
      <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 16 }}>{message}</h1>

      <p style={{ marginBottom: 16 }}>
        Cette page est <strong>client</strong>. Elle peut contenir vos formulaires,
        listes de visions, boutons, etc.
      </p>

      <div style={{ display: "flex", gap: 12 }}>
        <Link href="/" style={{ padding: "8px 12px", border: "1px solid #ccc", borderRadius: 8 }}>
          ← Accueil
        </Link>
        <Link href="/phase2" style={{ padding: "8px 12px", border: "1px solid #ccc", borderRadius: 8 }}>
          Aller à la phase 2
        </Link>
      </div>
    </main>
  );
}

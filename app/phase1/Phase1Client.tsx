// app/phase1/Phase1Client.tsx
"use client";

import { useSearchParams } from "next/navigation";

export default function Phase1Client() {
  // ✔️ C’est ici (dans un composant client) que vous pouvez utiliser useSearchParams
  const sp = useSearchParams();
  const debugVision = sp.get("vision") ?? "(aucune vision dans l’URL)";

  return (
    <div style={{ padding: 16 }}>
      <h1>Phase 1 (test minimal)</h1>
      <p>Vision (depuis l’URL) : {debugVision}</p>
      {/* Remettre VOTRE UI/logic ici après que le build passe */}
    </div>
  );
}

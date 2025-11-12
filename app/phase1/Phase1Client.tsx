"use client";

import { useSearchParams } from "next/navigation";

export default function Phase1Client() {
  // ✔️ Ici, dans un composant client, on peut utiliser useSearchParams
  const sp = useSearchParams();
  const debugVision = sp.get("vision") ?? "(aucune vision dans l’URL)";

  return (
    <div>
      <h1>Phase 1 (test minimal)</h1>
      <p>Vision (depuis l’URL) : {debugVision}</p>
      {/* Vous remettrez ici votre UI/logic de la phase 1 quand le build passera */}
    </div>
  );
}

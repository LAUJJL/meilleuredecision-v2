// app/phase1/Phase1Client.tsx
"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";

/** Lit un paramètre d’URL côté client sans useSearchParams */
function getQueryParam(name: string): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get(name);
}

export default function Phase1Client() {
  const router = useRouter();

  // Si un jour on veut afficher la vision passée dans l’URL :
  const vision = useMemo(() => getQueryParam("vision") ?? "", []);

  // TODO : ton UI Phase 1 (stock + flux constants) reste ici comme avant.
  //       Le seul changement est qu’on n’utilise plus useSearchParams.
  return (
    <div>
      {/* En-tête minimal */}
      <h1 style={{ marginBottom: 16 }}>Phase 1</h1>
      {vision && (
        <p style={{ margin: "8px 0 24px" }}>
          Vision depuis l’URL : <strong>{vision}</strong>
        </p>
      )}

      {/* … ton formulaire/graphique existant … */}

      <div style={{ marginTop: 24 }}>
        <button onClick={() => router.push("/phase2")}>
          Passer à la phase 2
        </button>
      </div>
    </div>
  );
}

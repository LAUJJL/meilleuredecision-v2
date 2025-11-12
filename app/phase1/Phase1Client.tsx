// app/phase1/Phase1Client.tsx
"use client";

import { useSearchParams } from "next/navigation";
// importez ici vos autres hooks/états/composants UI

export default function Phase1Client() {
  const searchParams = useSearchParams();

  // ⚠️ Placez ici tout le code UI/logic que vous aviez dans page.tsx,
  // y compris la lecture des query params via searchParams.get("..."),
  // les formulaires, boutons, etc.

  return (
    <div>
      {/* votre UI Phase 1 */}
    </div>
  );
}

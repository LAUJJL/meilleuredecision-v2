// app/phase1/page.tsx
import { Suspense } from "react";
import Phase1Client from "./Phase1Client";

// (optionnel mais utile si la page lit l'URL)
// force la génération dynamique (évite certains soucis de SSG)
export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <Suspense fallback={<div>Chargement…</div>}>
      <Phase1Client />
    </Suspense>
  );
}

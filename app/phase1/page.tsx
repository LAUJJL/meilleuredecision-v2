import { Suspense } from "react";
import Phase1Client from "./Phase1Client";

export default function Page() {
  return (
    <div style={{ padding: 16 }}>
      {/* Le composant client qui utilise useSearchParams DOIT être dans une Suspense */}
      <Suspense fallback={<div>Chargement…</div>}>
        <Phase1Client />
      </Suspense>
    </div>
  );
}

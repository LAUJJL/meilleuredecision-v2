// app/phase1/page.tsx
import { Suspense } from "react";
import Phase1Client from "./Phase1Client";

export default function Page() {
  return (
    <Suspense fallback={<div>Chargement…</div>}>
      <Phase1Client />
    </Suspense>
  );
}

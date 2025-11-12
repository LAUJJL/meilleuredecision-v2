import { Suspense } from "react";
import Phase1Client from "./Phase1Client";

export default function Page() {
  return (
    <div style={{ padding: 24, maxWidth: 940, margin: "0 auto" }}>
      <Suspense fallback={<div>Chargement…</div>}>
        <Phase1Client />
      </Suspense>
    </div>
  );
}


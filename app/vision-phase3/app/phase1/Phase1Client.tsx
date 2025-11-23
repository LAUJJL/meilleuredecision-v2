// app/phase1/Phase1Client.tsx
"use client";

import { useRouter } from "next/navigation";

export default function Phase1Client() {
  const router = useRouter();
  return (
    <div>
      <h1>Phase 1 — base stable</h1>
      <p>Version minimaliste pour valider le déploiement.</p>
      <button
        onClick={() => router.push("/phase2")}
        style={{ padding: "10px 14px", border: "1px solid #bbb", borderRadius: 6 }}
      >
        Passer à la phase 2
      </button>
    </div>
  );
}

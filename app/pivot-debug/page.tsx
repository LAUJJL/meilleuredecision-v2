"use client";

import { useEffect, useState } from "react";
import { ModelSnapshot, snapshotStorageKey } from "@/lib/pivot";

type SearchParams = { [key: string]: string | string[] | undefined };

export default function PivotDebugPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const rawVisionId = searchParams.visionId;
  const rawRef = searchParams.refinementIndex;

  const visionId =
    typeof rawVisionId === "string" ? rawVisionId : rawVisionId?.[0] ?? "";
  const refinementIndex = parseInt(
    typeof rawRef === "string" ? rawRef : rawRef?.[0] ?? "1",
    10
  );

  const [snapshot, setSnapshot] = useState<ModelSnapshot | null>(null);

  useEffect(() => {
    if (!visionId || typeof window === "undefined") return;
    try {
      const key = snapshotStorageKey(visionId, refinementIndex);
      const raw = window.localStorage.getItem(key);
      if (!raw) return;
      const parsed = JSON.parse(raw) as ModelSnapshot;
      setSnapshot(parsed);
    } catch (e) {
      console.error("Erreur de lecture du snapshot pivot :", e);
    }
  }, [visionId, refinementIndex]);

  return (
    <main style={{ maxWidth: 900, margin: "32px auto", padding: "0 16px" }}>
      <h1>
        Debug pivot – Vision {visionId || "(inconnue)"}, raffinement{" "}
        {refinementIndex}
      </h1>

      {!snapshot ? (
        <p style={{ marginTop: 16 }}>
          Aucun snapshot trouvé pour cette vision / ce raffinement.
        </p>
      ) : (
        <pre
          style={{
            marginTop: 16,
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            padding: 16,
            background: "#111827",
            color: "#e5e7eb",
            fontSize: 12,
            overflowX: "auto",
          }}
        >
          {JSON.stringify(snapshot, null, 2)}
        </pre>
      )}
    </main>
  );
}

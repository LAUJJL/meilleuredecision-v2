"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type NamesData = {
  stockName: string;
  stockUnit: string;
  inflowName: string;
  outflowName: string;
  initialStockName: string;
};

export default function Phase1Client() {
  const router = useRouter();

  // Chargement sécurisé
  const [loaded, setLoaded] = useState(false);

  // Contexte problème + vision
  const [problemName, setProblemName] = useState("");
  const [problemShort, setProblemShort] = useState("");
  const [visionId, setVisionId] = useState("");
  const [visionName, setVisionName] = useState("");
  const [visionShort, setVisionShort] = useState("");

  // Données du raffinement 1
  const [names, setNames] = useState<NamesData>({
    stockName: "",
    stockUnit: "",
    inflowName: "",
    outflowName: "",
    initialStockName: "",
  });

  const [isLocked, setIsLocked] = useState(false);

  // storage keys
  function namesStorageKey(vId: string) {
    return `md_phase1_names_${vId}`;
  }
  function lockKey(vId: string) {
    return `md_refinement1_locked_${vId}`;
  }

  // Charger contexte + données
  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);

    setProblemName(params.get("problemName") ?? "");
    setProblemShort(params.get("problemShort") ?? "");
    setVisionId(params.get("visionId") ?? "");
    setVisionName(params.get("visionName") ?? "");
    setVisionShort(params.get("visionShort") ?? "");
  }, []);

  // Charger données Phase1 quand visionId est connu
  useEffect(() => {
    if (!visionId || typeof window === "undefined") return;

    try {
      // charger lock
      const locked = window.localStorage.getItem(lockKey(visionId)) === "true";
      setIsLocked(locked);

      // charger noms
      const raw = window.localStorage.getItem(namesStorageKey(visionId));
      if (raw) {
        const parsed = JSON.parse(raw);
        setNames(parsed);
      }
    } catch (e) {
      console.error("Erreur chargement Phase1 :", e);
    }

    // FIN DU CHARGEMENT
    setLoaded(true);
  }, [visionId]);

  // Auto-generer nom stock de départ
  const initialStockAutoName =
    names.stockName.trim() === ""
      ? ""
      : `${names.stockName.trim()} de départ`;

  // Sauvegarde auto
  useEffect(() => {
    if (!visionId || isLocked || !loaded || typeof window === "undefined")
      return;

    const data = {
      ...names,
      initialStockName: initialStockAutoName,
    };

    window.localStorage.setItem(namesStorageKey(visionId), JSON.stringify(data));
  }, [names, initialStockAutoName, visionId, isLocked, loaded]);

  // retourner un écran "chargement"
  if (!loaded) {
    return (
      <main style={{ padding: 20 }}>
        <p>Chargement…</p>
      </main>
    );
  }

  function validatePhase1() {
    if (!names.stockName.trim() || !names.stockUnit.trim()) {
      alert("Merci d’indiquer un nom de stock et une unité.");
      return;
    }
    if (!names.inflowName.trim() || !names.outflowName.trim()) {
      alert("Merci de nommer les flux.");
      return;
    }

    const data = {
      ...names,
      initialStockName: initialStockAutoName,
    };

    window.localStorage.setItem(namesStorageKey(visionId), JSON.stringify(data));
    window.localStorage.setItem(lockKey(visionId), "true");

    setIsLocked(true);
  }

  return (
    <main style={{ maxWidth: 900, margin: "32px auto", padding: "0 16px" }}>

      <h1>Premier raffinement – Noms du système</h1>

      {isLocked && (
        <p style={{ background: "#fef3c7", padding: 8, border: "1px solid #facc15" }}>
          Ce raffinement a été validé. Les noms sont figés.
        </p>
      )}

      {/* Noms du système */}

      <label>Nom du stock principal</label>
      <input
        value={names.stockName}
        disabled={isLocked}
        onChange={(e) =>
          setNames((p) => ({ ...p, stockName: e.target.value }))
        }
      />

      <label>Unité du stock</label>
      <input
        value={names.stockUnit}
        disabled={isLocked}
        onChange={(e) =>
          setNames((p) => ({ ...p, stockUnit: e.target.value }))
        }
      />

      <label>Nom du stock de départ (généré automatiquement)</label>
      <div
        style={{
          padding: 8,
          background: "#f2f2f2",
          borderRadius: 4,
        }}
      >
        {initialStockAutoName || "(en attente du nom du stock)"}
      </div>

      <label>Flux d’entrée</label>
      <input
        value={names.inflowName}
        disabled={isLocked}
        onChange={(e) =>
          setNames((p) => ({ ...p, inflowName: e.target.value }))
        }
      />

      <label>Flux de sortie</label>
      <input
        value={names.outflowName}
        disabled={isLocked}
        onChange={(e) =>
          setNames((p) => ({ ...p, outflowName: e.target.value }))
        }
      />

      {!isLocked ? (
        <button onClick={validatePhase1}>Valider</button>
      ) : (
        <button
          onClick={() => {
            const p = new URLSearchParams({
              problemName,
              problemShort,
              visionId,
              visionName,
              visionShort,
            });
            router.push(`/vision-phase2?${p}`);
          }}
        >
          Suivant →
        </button>
      )}

    </main>
  );
}

// lib/pivot.ts

export type PivotParameter = {
  type: "number";
  value: number;
  unit?: string;
  description?: string;
};

export type PivotStock = {
  unit?: string;
  description?: string;
  initial: string;   // référence à un paramètre
  equation: string;  // équation en notation texte
};

export type PivotFlow = {
  unit?: string;
  description?: string;
  equation: string;
};

export type PivotAux = {
  unit?: string;
  description?: string;
  equation: string;
};

export type PivotCriterion = {
  name: string;
  description?: string;
  equation: string;  // ex: "FORALL t: tresorerie[t] >= 0"
};

export type ModelSnapshot = {
  meta: {
    problemId: string;
    visionId: string;
    refinementIndex: number;
    parentRefinementIndex: number | null;
    validatedAt: string; // ISO
  };
  time: {
    horizon: number;
    timeUnit: string;
  };
  parameters: Record<string, PivotParameter>;
  stocks: Record<string, PivotStock>;
  flows: Record<string, PivotFlow>;
  auxiliaries: Record<string, PivotAux>;
  criteria: PivotCriterion[];
};

// Construction d'un snapshot pour le premier raffinement (stock + flux constants)
export function buildPhase1Snapshot(args: {
  problemId: string;
  visionId: string;
  refinementIndex: number; // = 1 pour le premier raffinement
  timeUnit: string;
  horizon: number;
  stockUnit: string;
  initialStockValue: number;
  inflowValue: number;
  outflowValue: number;
}): ModelSnapshot {
  const nowIso = new Date().toISOString();

  return {
    meta: {
      problemId: args.problemId,
      visionId: args.visionId,
      refinementIndex: args.refinementIndex,
      parentRefinementIndex: 0,
      validatedAt: nowIso,
    },
    time: {
      horizon: args.horizon,
      timeUnit: args.timeUnit,
    },
    parameters: {
      tresorerie_initiale: {
        type: "number",
        value: args.initialStockValue,
        unit: args.stockUnit,
        description: "Trésorerie au début de l'horizon.",
      },
      flux_entree_constant: {
        type: "number",
        value: args.inflowValue,
        unit: args.stockUnit,
        description: "Flux d'entrée constant par pas de temps.",
      },
      flux_sortie_constant: {
        type: "number",
        value: args.outflowValue,
        unit: args.stockUnit,
        description: "Flux de sortie constant par pas de temps.",
      },
    },
    stocks: {
      tresorerie: {
        unit: args.stockUnit,
        description: "Trésorerie disponible.",
        initial: "tresorerie_initiale",
        equation:
          "tresorerie[t] = tresorerie[t-1] + flux_entree_constant - flux_sortie_constant",
      },
    },
    flows: {
      flux_entree: {
        unit: args.stockUnit,
        description: "Flux d'entrée constant.",
        equation: "flux_entree_constant",
      },
      flux_sortie: {
        unit: args.stockUnit,
        description: "Flux de sortie constant.",
        equation: "flux_sortie_constant",
      },
    },
    auxiliaries: {},
    criteria: [],
  };
}

export function snapshotStorageKey(
  visionId: string,
  refinementIndex: number
): string {
  return `md_pivot_snapshot_${visionId}_${refinementIndex}`;
}

export function saveSnapshotToLocalStorage(snapshot: ModelSnapshot) {
  if (typeof window === "undefined") return;
  try {
    const key = snapshotStorageKey(
      snapshot.meta.visionId,
      snapshot.meta.refinementIndex
    );
    window.localStorage.setItem(key, JSON.stringify(snapshot, null, 2));
  } catch (e) {
    console.error("Erreur d'enregistrement du snapshot pivot :", e);
  }
}

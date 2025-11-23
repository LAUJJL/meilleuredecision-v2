// lib/pivot.ts

// Genre d'une constante / paramètre, du point de vue de la méthode
// - "fixed"     : liée à la vision, figée après le raffinement où elle est introduite
// - "variable"  : paramètre dont la valeur peut changer dans les raffinements suivants
// - "transient" : constante provisoire, destinée éventuellement à être détaillée,
//                 ou à être reclassée plus tard (fixe ou variable)
export type ConstantKind = "fixed" | "variable" | "transient";

// Statut de stabilité d'une équation (stock, flux, auxiliaire)
// - "fixed"       : le visiteur considère que cette équation restera valable
// - "refinable"   : le visiteur considère qu'elle devra être raffinée / modifiée
// - "unspecified" : le visiteur ne se prononce pas
export type EquationStatus = "fixed" | "refinable" | "unspecified";

export type PivotParameter = {
  type: "number";

  // Valeur numérique actuelle
  value: number;

  unit?: string;
  description?: string;

  // Genre de la constante (facultatif pour le MVP)
  // Si rien n'est précisé, on pourra interpréter comme "transient" par défaut.
  kind?: ConstantKind;

  // Raffinement dans lequel ce paramètre a été introduit (facultatif)
  introducedAtRefinement?: number;

  // Dernier raffinement où la valeur / le genre a été modifié
  lastModifiedAtRefinement?: number;
};

export type PivotStock = {
  unit?: string;
  description?: string;

  // Référence à un paramètre (clé dans parameters)
  initial: string;

  // Équation en notation texte (langage pivot)
  equation: string;

  // Statut de stabilité de l'équation (facultatif)
  equationStatus?: EquationStatus;
};

export type PivotFlow = {
  unit?: string;
  description?: string;

  // Équation en langage pivot (ex: "flux_entree_constant")
  equation: string;

  equationStatus?: EquationStatus;
};

export type PivotAux = {
  unit?: string;
  description?: string;

  // Équation en langage pivot
  equation: string;

  equationStatus?: EquationStatus;
};

export type PivotCriterion = {
  name: string;
  description?: string;

  // Par exemple : "FORALL t: tresorerie[t] >= 0"
  equation: string;
};

export type ModelSnapshot = {
  meta: {
    problemId: string;
    visionId: string;

    // Numéro du raffinement auquel correspond ce snapshot
    refinementIndex: number;

    // Raffinement parent (null ou 0 pour le premier niveau)
    parentRefinementIndex: number | null;

    // Date ISO de validation de ce snapshot
    validatedAt: string;
  };

  time: {
    horizon: number;
    timeUnit: string;
  };

  // Paramètres / constantes
  parameters: Record<string, PivotParameter>;

  // Stocks, flux, auxiliaires
  stocks: Record<string, PivotStock>;
  flows: Record<string, PivotFlow>;
  auxiliaries: Record<string, PivotAux>;

  // Critères de décision / test (ex : objectif atteint)
  criteria: PivotCriterion[];
};

// Construction d'un snapshot pour le premier raffinement (stock + flux constants)
// pour le cas de la trésorerie, avec flux d'entrée et de sortie constants.
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
  const refinementIndex = args.refinementIndex;

  return {
    meta: {
      problemId: args.problemId,
      visionId: args.visionId,
      refinementIndex,
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
        // Pour ce premier cas simple, on peut considérer ces constantes comme fixes
        kind: "fixed",
        introducedAtRefinement: refinementIndex,
        lastModifiedAtRefinement: refinementIndex,
      },
      flux_entree_constant: {
        type: "number",
        value: args.inflowValue,
        unit: args.stockUnit,
        description: "Flux d'entrée constant par pas de temps.",
        kind: "fixed",
        introducedAtRefinement: refinementIndex,
        lastModifiedAtRefinement: refinementIndex,
      },
      flux_sortie_constant: {
        type: "number",
        value: args.outflowValue,
        unit: args.stockUnit,
        description: "Flux de sortie constant par pas de temps.",
        kind: "fixed",
        introducedAtRefinement: refinementIndex,
        lastModifiedAtRefinement: refinementIndex,
      },
    },
    stocks: {
      tresorerie: {
        unit: args.stockUnit,
        description: "Trésorerie disponible.",
        initial: "tresorerie_initiale",
        equation:
          "tresorerie[t] = tresorerie[t-1] + flux_entree_constant - flux_sortie_constant",
        // Dans ce cas pédagogique simple, on peut considérer l'équation comme stable
        equationStatus: "fixed",
      },
    },
    flows: {
      flux_entree: {
        unit: args.stockUnit,
        description: "Flux d'entrée constant.",
        equation: "flux_entree_constant",
        equationStatus: "fixed",
      },
      flux_sortie: {
        unit: args.stockUnit,
        description: "Flux de sortie constant.",
        equation: "flux_sortie_constant",
        equationStatus: "fixed",
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

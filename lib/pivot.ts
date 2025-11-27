// lib/pivot.ts
// Structures du Langage Pivot (version simple et extensible)

export type PivotKind = 'TEMP' | 'CONST' | 'PARAM' | 'AUX' | 'AUX_STABLE';

export interface Bounds {
  logical?: {
    min?: number;
    max?: number;
  };
  user?: {
    min?: number;
    max?: number;
  };
}

export interface PivotElement {
  id: string;         // identifiant interne unique
  name: string;       // nom de la variable
  kind: PivotKind;    // TEMP, CONST, PARAM, AUX, AUX_STABLE
  description?: string;
  bounds?: Bounds;    // bornes logiques + utilisateur (optionnel)
}

export interface PivotStep {
  stepIndex: number;        // numéro d’étape
  sourceText: string;       // texte d’origine
  normalizedText: string;   // texte reformulé accepté
  elements: PivotElement[]; // éléments pivot associés
  contributions: string[];  // liste de contributions textuelles
}

export interface PivotModel {
  steps: PivotStep[];
}

// Outil simple pour regrouper les éléments par type (utile dans la synthèse)
export function groupElementsByKind(
  model: PivotModel
): Record<PivotKind, PivotElement[]> {
  const result: Record<PivotKind, PivotElement[]> = {
    TEMP: [],
    CONST: [],
    PARAM: [],
    AUX: [],
    AUX_STABLE: [],
  };

  for (const step of model.steps) {
    for (const el of step.elements) {
      result[el.kind].push(el);
    }
  }

  return result;
}

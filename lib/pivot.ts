// lib/pivot.ts

export type Primitive =
  | 'COMPARER'
  | 'NORMALISER'
  | 'TRANSFORMER'
  | 'PONDERER'
  | 'SOMMER'
  | 'DECOMPOSER'
  | 'EVALUER';

export interface BasePivotElement {
  kind: 'CONST' | 'PARAM' | 'TEMP' | 'AUX' | 'AUX_STABLE';
  name: string;
  description?: string;
}

export interface ConstanteFixe extends BasePivotElement {
  kind: 'CONST';
  value: unknown;
}

export interface Parametre extends BasePivotElement {
  kind: 'PARAM';
  value: unknown;
}

export interface ConstanteProvisoire extends BasePivotElement {
  kind: 'TEMP';
  value: unknown;
  bounds?: [number, number];
}

export interface Auxiliaire extends BasePivotElement {
  kind: 'AUX';
  equation: string;
  dependencies: string[];
}

export interface AuxiliaireStabilisee extends BasePivotElement {
  kind: 'AUX_STABLE';
  equation: string;
  dependencies: string[];
}

export type ElementPivot =
  | ConstanteFixe
  | Parametre
  | ConstanteProvisoire
  | Auxiliaire
  | AuxiliaireStabilisee;

export function createConstant(
  name: string,
  value: unknown,
  options?: { kind?: 'CONST' | 'PARAM' | 'TEMP'; bounds?: [number, number] }
): ElementPivot {
  const kind = options?.kind ?? 'TEMP'; // par défaut : provisoire
  if (kind === 'CONST') return { kind: 'CONST', name, value };
  if (kind === 'PARAM') return { kind: 'PARAM', name, value };
  return { kind: 'TEMP', name, value, bounds: options?.bounds };
}

export function createAuxiliary(
  name: string,
  equation: string,
  dependencies: string[],
  options?: { stable?: boolean }
): ElementPivot {
  if (options?.stable) {
    return { kind: 'AUX_STABLE', name, equation, dependencies };
  }
  return { kind: 'AUX', name, equation, dependencies };
}

// lib/rps_v3.ts
// v3 minimaliste : Problème (Project) → Vision (Sequence) → Phases (0 = définition de la vision ; 1 = stock + flux constants)

export type Project = {
  id: string;
  title: string;     // nom du problème
  tag: string;       // définition courte (optionnelle)
  lockedAt: string;  // verrouillage dès création (philosophie immuable)
};

export type Sequence = {
  id: string;
  projectId: string;
  title: string;     // nom court de la vision
  tag: string;       // définition courte (optionnelle)
  lockedAt: string;  // verrouillé dès création
};

export type Phase = {
  id: string;
  sequenceId: string;
  idx: number;             // 0 = définition de la vision (texte), 1 = stock+flux constants, ...
  draft?: string;          // contenu en cours (string ⇒ JSON.stringify si besoin)
  content?: string;        // contenu validé (lecture seule) (string ⇒ JSON.stringify si structuré)
  testsDone?: boolean;     // conservé pour compat ; V1 : true
  bypassReason?: string;
  lockedAt?: string;
};

type RpsState = {
  projects: Project[];
  sequences: Sequence[];
  phases: Phase[];
  currentProjectId?: string;
  currentSequenceId?: string;
};

const KEY = "rps.v3";

function nowISO() { return new Date().toISOString(); }
function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try { return JSON.parse(raw) as T; } catch { return fallback; }
}

export function getState(): RpsState {
  if (typeof window === "undefined") return { projects: [], sequences: [], phases: [] };
  return safeParse<RpsState>(localStorage.getItem(KEY), { projects: [], sequences: [], phases: [] });
}
function setState(next: RpsState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(next));
}

/* ——— Utilitaires sélection ——— */
export function clearSelection() {
  const s = getState();
  setState({ ...s, currentProjectId: undefined, currentSequenceId: undefined });
}

/* ——— Projets ——— */
export function createProject(title: string, tag: string): string {
  const s = getState();
  const id = crypto.randomUUID();
  const p: Project = { id, title, tag, lockedAt: nowISO() };
  const next = { ...s, projects: [p, ...s.projects], currentProjectId: id, currentSequenceId: undefined };
  setState(next);
  return id;
}
export function selectProject(projectId: string) {
  const s = getState();
  const exists = s.projects.some(p => p.id === projectId);
  const next = { ...s, currentProjectId: exists ? projectId : undefined, currentSequenceId: undefined };
  setState(next);
}

/* ——— Visions (ex “séquences”) ——— */
export function createSequence(title: string, tag: string): string | undefined {
  const s = getState();
  if (!s.currentProjectId) return;
  const id = crypto.randomUUID();
  const seq: Sequence = { id, projectId: s.currentProjectId, title, tag, lockedAt: nowISO() };
  const next = { ...s, sequences: [seq, ...s.sequences], currentSequenceId: id };
  setState(next);
  // créer Phase 0 (définition de la vision)
  ensurePhase( id, 0 );
  return id;
}
export function selectSequence(sequenceId: string) {
  const s = getState();
  const exists = s.sequences.some(r => r.id === sequenceId);
  const next = { ...s, currentSequenceId: exists ? sequenceId : undefined };
  setState(next);
}

/* ——— Phases génériques ——— */
export function listPhases(sequenceId: string): Phase[] {
  return getState().phases.filter(ph => ph.sequenceId === sequenceId).sort((a,b) => a.idx - b.idx);
}
export function getPhase(sequenceId: string, idx: number): Phase | undefined {
  return getState().phases.find(ph => ph.sequenceId === sequenceId && ph.idx === idx);
}
function ensurePhase(sequenceId: string, idx: number) {
  const s = getState();
  if (!s.phases.some(ph => ph.sequenceId === sequenceId && ph.idx === idx)) {
    const ph: Phase = { id: crypto.randomUUID(), sequenceId, idx, draft: "" };
    setState({ ...s, phases: [ph, ...s.phases] });
  }
}

/* ——— Phase 0 : Définition de la vision (texte libre) ——— */
export function updatePhase0Draft(content: string) {
  const s = getState();
  if (!s.currentSequenceId) return;
  const phases = s.phases.map(ph => {
    if (ph.sequenceId === s.currentSequenceId && ph.idx === 0 && !ph.lockedAt) {
      return { ...ph, draft: content };
    }
    return ph;
  });
  setState({ ...s, phases });
}
export function validatePhase0(opts: { testsDone: boolean; bypassReason?: string }) {
  const s = getState();
  if (!s.currentSequenceId) return;
  const phases = s.phases.map(ph => {
    if (ph.sequenceId === s.currentSequenceId && ph.idx === 0 && !ph.lockedAt) {
      return {
        ...ph,
        content: (ph.draft || "").trim(),
        testsDone: !!opts.testsDone,
        bypassReason: !opts.testsDone ? (opts.bypassReason || "").trim() : undefined,
        lockedAt: nowISO(),
        draft: undefined,
      };
    }
    return ph;
  });
  setState({ ...s, phases });
  // Préparer la Phase 1 (si non déjà créée)
  ensurePhase(s.currentSequenceId, 1);
}

/* ——— Phase 1 : Stock + flux constants ——— */

// Choix proposés pour les unités de temps (pas du modèle = unité de temps)
export const TIME_UNITS = ["seconde", "minute", "heure", "jour", "semaine", "mois", "trimestre", "semestre", "année"] as const;
export type TimeUnit = typeof TIME_UNITS[number];

export type Phase1Spec = {
  stockName: string;        // ex. Trésorerie, Habitants, Points, etc.
  stockUnit: string;        // ex. euros, habitants, points
  timeUnit: TimeUnit;       // ex. mois, année
  inflowName: string;       // ex. Recettes, Naissances, Victoires
  outflowName: string;      // ex. Dépenses, Décès, Défaites
  initialStockName: string; // ex. Trésorerie initiale
  // unités dérivées (juste pour affichage/rappel)
  derivedFlowUnit?: string; // = `${stockUnit} / ${timeUnit}`
  derivedStockUnit?: string; // = stockUnit
};

export function getPhase1(sequenceId: string) {
  return getPhase(sequenceId, 1);
}
export function ensurePhase1(sequenceId: string) {
  ensurePhase(sequenceId, 1);
}

// Met à jour le draft JSON de la phase 1
export function updatePhase1Draft(spec: Phase1Spec) {
  const s = getState();
  if (!s.currentSequenceId) return;
  const enriched: Phase1Spec = {
    ...spec,
    derivedFlowUnit: spec.stockUnit ? `${spec.stockUnit} / ${spec.timeUnit}` : "",
    derivedStockUnit: spec.stockUnit || "",
  };
  const draftStr = JSON.stringify(enriched);
  const phases = s.phases.map(ph => {
    if (ph.sequenceId === s.currentSequenceId && ph.idx === 1 && !ph.lockedAt) {
      return { ...ph, draft: draftStr };
    }
    return ph;
  });
  setState({ ...s, phases });
}

// Valide la phase 1 (lock + transfère draft → content)
export function validatePhase1() {
  const s = getState();
  if (!s.currentSequenceId) return;
  const phases = s.phases.map(ph => {
    if (ph.sequenceId === s.currentSequenceId && ph.idx === 1 && !ph.lockedAt) {
      const content = (ph.draft || "").trim();
      if (!content) return ph; // rien à valider
      return { ...ph, content, lockedAt: nowISO(), draft: undefined, testsDone: true };
    }
    return ph;
  });
  setState({ ...s, phases });
}

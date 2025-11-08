// lib/rps_v3.ts
// v3 minimaliste : Projet → Séquence → Phase 0 (verrouillage + lecture seule)

export type Project = {
  id: string;
  title: string;     // nom du problème
  tag: string;       // reconnaissance courte (étiquette)
  lockedAt: string;  // verrouillage dès création (philosophie immuable)
};

export type Sequence = {
  id: string;
  projectId: string;
  title: string;     // nom court du raffinement
  tag: string;       // reconnaissance courte
  lockedAt: string;  // verrouillé dès création
};

export type Phase = {
  id: string;
  sequenceId: string;
  idx: number;             // 0,1,2...
  draft?: string;          // contenu en cours (tant que non validé)
  content?: string;        // contenu validé (lecture seule)
  testsDone?: boolean;     // indicateur soft
  bypassReason?: string;   // si on valide sans tests → raison
  lockedAt?: string;       // présent si validé
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

/* ——— Projets ——— */
export function createProject(title: string, tag: string): string {
  const s = getState();
  const id = crypto.randomUUID();
  const p: Project = { id, title, tag, lockedAt: nowISO() }; // verrouillé dès création
  const next = {
    ...s,
    projects: [p, ...s.projects],
    currentProjectId: id,
    currentSequenceId: undefined,
  };
  setState(next);
  return id;
}

export function selectProject(projectId: string) {
  const s = getState();
  const exists = s.projects.some(p => p.id === projectId);
  const next = { ...s, currentProjectId: exists ? projectId : undefined, currentSequenceId: undefined };
  setState(next);
}

/* ——— Séquences ——— */
export function createSequence(title: string, tag: string): string | undefined {
  const s = getState();
  if (!s.currentProjectId) return;
  const id = crypto.randomUUID();
  const seq: Sequence = { id, projectId: s.currentProjectId, title, tag, lockedAt: nowISO() };
  const next = {
    ...s,
    sequences: [seq, ...s.sequences],
    currentSequenceId: id,
  };
  setState(next);
  // créer Phase 0 vide (non validée)
  ensurePhase0(id);
  return id;
}

export function selectSequence(sequenceId: string) {
  const s = getState();
  const exists = s.sequences.some(r => r.id === sequenceId);
  const next = { ...s, currentSequenceId: exists ? sequenceId : undefined };
  setState(next);
}

/* ——— Phases ——— */
export function listPhases(sequenceId: string): Phase[] {
  return getState().phases.filter(ph => ph.sequenceId === sequenceId).sort((a,b) => a.idx - b.idx);
}

export function getPhase(sequenceId: string, idx: number): Phase | undefined {
  return getState().phases.find(ph => ph.sequenceId === sequenceId && ph.idx === idx);
}

function ensurePhase0(sequenceId: string) {
  const s = getState();
  if (!s.phases.some(ph => ph.sequenceId === sequenceId && ph.idx === 0)) {
    const ph0: Phase = { id: crypto.randomUUID(), sequenceId, idx: 0, draft: "" };
    setState({ ...s, phases: [ph0, ...s.phases] });
  }
}

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
}
export function clearSelection() {
  const s = getState();
  setState({ ...s, currentProjectId: undefined, currentSequenceId: undefined });
}


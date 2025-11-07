// lib/rps.ts
export type Problem = { id: string; title: string; summary: string };
export type Refinement = {
  id: string;
  problemId: string;
  name: string;
  longDescription: string;
  phase: 0 | 1 | 2;
};

type RpsState = {
  problems: Problem[];
  refinements: Refinement[];
  currentProblemId?: string;
  currentRefinementId?: string;
};

const KEY = "rps.min.v1";

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try { return JSON.parse(raw) as T; } catch { return fallback; }
}

export function getState(): RpsState {
  if (typeof window === "undefined") return { problems: [], refinements: [] };
  return safeParse<RpsState>(localStorage.getItem(KEY), { problems: [], refinements: [] });
}

export function setState(next: RpsState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(next));
}

export function createProblem(title: string, summary: string): string {
  const s = getState();
  const id = crypto.randomUUID();
  s.problems.unshift({ id, title, summary });
  s.currentProblemId = id;
  s.currentRefinementId = undefined;
  setState(s);
  return id;
}

export function selectProblem(problemId: string) {
  const s = getState();
  s.currentProblemId = problemId;
  s.currentRefinementId = undefined;
  setState(s);
}

export function createRefinementForCurrentProblem(): string | undefined {
  const s = getState();
  if (!s.currentProblemId) return;
  const id = crypto.randomUUID();
  s.refinements.unshift({
    id,
    problemId: s.currentProblemId,
    name: "",
    longDescription: "",
    phase: 0,
  });
  s.currentRefinementId = id;
  setState(s);
  return id;
}

export function updatePhase0(name: string, longDescription: string) {
  const s = getState();
  if (!s.currentRefinementId) return;
  s.refinements = s.refinements.map(r =>
    r.id === s.currentRefinementId ? { ...r, name, longDescription } : r
  );
  setState(s);
}

export function goToPhase(n: 0 | 1 | 2) {
  const s = getState();
  if (!s.currentRefinementId) return;
  s.refinements = s.refinements.map(r =>
    r.id === s.currentRefinementId ? { ...r, phase: n } : r
  );
  setState(s);
}

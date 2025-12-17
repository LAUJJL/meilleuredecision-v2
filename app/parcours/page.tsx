'use client';

import React, { useEffect, useMemo, useState } from 'react';

type Mode = 'preset' | 'custom';

type SnapshotV1 = {
  version: 1;
  savedAtIso: string;

  mode: Mode;

  // Définition de la vision (langage courant)
  defShortVision: string;
  defLongVision: string;

  // Structure de stock / flux / horizon
  stockLabel: string;
  unit: string;
  horizon: number;
  flowInLabel: string;
  flowOutLabel: string;

  // R1 : paramètres de base
  initialStock: number;
  r1_inflow: number;
  r1_outflow: number;

  // Objectif minimal (selon la descente, introduit en R2 ou en R3)
  target: number;

  // Décomposition / équations
  salary: number;
  personalExpenses: number;

  addInflowLabel: string;
  addOutflowLabel: string;
  addInflow: number;
  addOutflow: number;
  addFromPeriod: number;

  // Vision préétablie
  visionIndex: 0 | 1 | 2;
  visionLabel: string;
};

const LS_KEY = 'current_problem_v1_parcours';
const FLAG_KEY = 'has_seen_preset_v1';

// Palette minimaliste cohérente
const C = {
  text: '#111',
  secondary: '#444',
  hint: '#666',
  border: '#ddd',
  softBorder: '#eee',
  link: '#0b5fff',
  ok: '#166534',
  bad: '#b91c1c',
  bgDisabled: '#f3f4f6',
};

const toNumber = (s: string) => {
  const x = Number(String(s).replace(',', '.'));
  return Number.isFinite(x) ? x : NaN;
};
const clampInt = (v: number, min: number, max: number) =>
  Math.max(min, Math.min(max, Math.round(v)));
const fmt = (n: number) => {
  const v = Math.round((n + Number.EPSILON) * 100) / 100;
  return String(v);
};

function computeTable({
  initialStock,
  horizon,
  baseInflow,
  baseOutflow,
  addFromPeriod,
  addInflow,
  addOutflow,
}: {
  initialStock: number;
  horizon: number;
  baseInflow: number;
  baseOutflow: number;
  addFromPeriod?: number;
  addInflow?: number;
  addOutflow?: number;
}) {
  const rows: Array<{
    t: number;
    stockStart: number;
    inflow: number;
    outflow: number;
    stockEnd: number;
  }> = [];
  let stock = initialStock;

  for (let t = 1; t <= horizon; t++) {
    const add =
      addFromPeriod != null &&
      addInflow != null &&
      addOutflow != null &&
      t >= addFromPeriod;

    const inflow = baseInflow + (add ? addInflow : 0);
    const outflow = baseOutflow + (add ? addOutflow : 0);

    const stockEnd = stock + (inflow - outflow);
    rows.push({ t, stockStart: stock, inflow, outflow, stockEnd });
    stock = stockEnd;
  }

  const stockFinal = rows.length ? rows[rows.length - 1].stockEnd : initialStock;
  return { rows, stockFinal };
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section
      style={{
        border: `1px solid ${C.border}`,
        borderRadius: 12,
        padding: 16,
        marginTop: 14,
      }}
    >
      <h2 style={{ marginTop: 0, color: C.text }}>{title}</h2>
      {children}
    </section>
  );
}

function ContinueBar({
  onContinue,
  disabled,
}: {
  onContinue: () => void;
  disabled?: boolean;
}) {
  return (
    <div
      style={{
        marginTop: 18,
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <button
        onClick={onContinue}
        disabled={!!disabled}
        style={{
          padding: '10px 16px',
          borderRadius: 10,
          border: `1px solid ${C.border}`,
          background: disabled ? C.bgDisabled : 'white',
          cursor: disabled ? 'not-allowed' : 'pointer',
          fontSize: 16,
          color: C.text,
        }}
      >
        Continuer
      </button>
    </div>
  );
}

function InputRow({
  label,
  value,
  onChange,
  placeholder,
  width = 420,
  disabled = false,
  multiline = false,
}: {
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  placeholder?: string;
  width?: number;
  disabled?: boolean;
  multiline?: boolean;
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        marginTop: 10,
        maxWidth: width,
        opacity: disabled ? 0.75 : 1,
      }}
    >
      <div style={{ fontSize: 14, color: C.text }}>{label}</div>
      {multiline ? (
        <textarea
          value={String(value)}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          rows={4}
          style={{
            padding: '9px 10px',
            borderRadius: 10,
            border: `1px solid ${C.border}`,
            fontSize: 15,
            width: '100%',
            resize: 'vertical',
            color: C.text,
          }} />
      ) : (
        <input
          value={String(value)}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          style={{
            padding: '9px 10px',
            borderRadius: 10,
            border: `1px solid ${C.border}`,
            fontSize: 15,
            width: '100%',
            color: C.text,
          }} />
      )}
    </div>
  );
}

function TableAlwaysVisible({
  rows,
  stockLabel,
  flowInLabel,
  flowOutLabel,
}: {
  rows: Array<{
    t: number;
    stockStart: number;
    inflow: number;
    outflow: number;
    stockEnd: number;
  }>;
  stockLabel: string;
  flowInLabel: string;
  flowOutLabel: string;
}) {
  return (
    <div style={{ overflowX: 'auto', marginTop: 12 }}>
      <table style={{ borderCollapse: 'collapse', minWidth: 860 }}>
        <thead>
          <tr>
            <th style={{ border: `1px solid ${C.border}`, padding: 8, textAlign: 'left' }}>
              Période
            </th>
            <th style={{ border: `1px solid ${C.border}`, padding: 8, textAlign: 'left' }}>
              {stockLabel} début
            </th>
            <th style={{ border: `1px solid ${C.border}`, padding: 8, textAlign: 'left' }}>
              {flowInLabel}
            </th>
            <th style={{ border: `1px solid ${C.border}`, padding: 8, textAlign: 'left' }}>
              {flowOutLabel}
            </th>
            <th style={{ border: `1px solid ${C.border}`, padding: 8, textAlign: 'left' }}>
              {stockLabel} fin
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.t}>
              <td style={{ border: `1px solid ${C.border}`, padding: 8 }}>{r.t}</td>
              <td style={{ border: `1px solid ${C.border}`, padding: 8 }}>{fmt(r.stockStart)}</td>
              <td style={{ border: `1px solid ${C.border}`, padding: 8 }}>{fmt(r.inflow)}</td>
              <td style={{ border: `1px solid ${C.border}`, padding: 8 }}>{fmt(r.outflow)}</td>
              <td style={{ border: `1px solid ${C.border}`, padding: 8 }}>{fmt(r.stockEnd)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function defaultSnapshotPreset(): SnapshotV1 {
  return {
    version: 1,
    savedAtIso: new Date().toISOString(),
    mode: 'preset',

    defShortVision: 'Je reste salarié avec un revenu stable et des dépenses maîtrisées.',
    defLongVision:
      "Dans cette vision, je garde mon activité salariée avec un salaire de 3000 € et des dépenses mensuelles de 2500 €. Je souhaite voir si cette situation permet d’atteindre l’objectif de trésorerie de 10 000 € dans 12 mois.",

    stockLabel: 'Trésorerie',
    unit: 'euros',
    horizon: 12,
    flowInLabel: 'Encaissements',
    flowOutLabel: 'Décaissements',

    initialStock: 3000,
    r1_inflow: 3000,
    r1_outflow: 2500,

    target: 10000,

    salary: 3000,
    personalExpenses: 2500,

    addInflowLabel: "Revenu d'activité",
    addOutflowLabel: "Dépenses d'activité",
    addInflow: 0,
    addOutflow: 0,
    addFromPeriod: 4,

    visionIndex: 0,
    visionLabel: 'Vision 1 — Rester salarié',
  };
}

export default function ParcoursPage() {
  // step 0 : définition de la vision (langage courant)
  // step 1 : R1
  // step 2 : R2
  // step 3 : R3
  const [step, setStep] = useState(0);
  const [snap, setSnap] = useState<SnapshotV1>(() => defaultSnapshotPreset());
  const [addFromPeriodDraft, setAddFromPeriodDraft] = useState<string>('1');

  function persist(next: SnapshotV1) {
    const saved = { ...next, savedAtIso: new Date().toISOString() };
    setSnap(saved);
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(saved));
    } catch {
      // ignore
    }
  }

  function applyVisionPreset(idx: 0 | 1 | 2) {
    if (idx === 0) {
      const v: SnapshotV1 = {
        ...defaultSnapshotPreset(),
        defShortVision: 'Je reste salarié avec un revenu stable et des dépenses maîtrisées.',
        defLongVision:
          "Dans cette vision, je garde mon activité salariée avec un salaire de 3000 € et des dépenses mensuelles de 2500 €. Je souhaite voir si cette situation permet d’atteindre l’objectif de trésorerie de 10 000 € dans 12 mois.",
        initialStock: 3000,
        r1_inflow: 3000,
        r1_outflow: 2500,
        target: 10000,
        salary: 3000,
        personalExpenses: 2500,
        addInflowLabel: "Revenu d'activité",
        addOutflowLabel: "Dépenses d'activité",
        addInflow: 0,
        addOutflow: 0,
        addFromPeriod: 4,
        visionIndex: 0,
        visionLabel: 'Vision 1 — Rester salarié',
      };
      persist(v);
      setAddFromPeriodDraft(String(v.addFromPeriod));
    } else if (idx === 1) {
      const v: SnapshotV1 = {
        ...defaultSnapshotPreset(),
        defShortVision:
          'Je lance une micro-activité et je compare cette option assez tôt à un objectif minimal.',
        defLongVision:
          "Dans cette vision, je lance une micro-activité rapportant 4000 € par mois avec 3000 € de dépenses. Je fixe assez tôt un objectif minimal de 10 000 € de trésorerie à 12 mois, puis j’affine la structure pour voir si cette option permet de l’atteindre et avec quel stock final.",
        initialStock: 3000,
        r1_inflow: 4000,
        r1_outflow: 3000,
        target: 10000,
        salary: 3000,
        personalExpenses: 2500,
        addInflowLabel: "Revenu d'activité",
        addOutflowLabel: "Dépenses d'activité",
        addInflow: 1000,
        addOutflow: 500,
        addFromPeriod: 1,
        visionIndex: 1,
        visionLabel: 'Vision 2 — Micro-activité (objectif tôt)',
      };
      persist(v);
      setAddFromPeriodDraft(String(v.addFromPeriod));
    } else {
      const v: SnapshotV1 = {
        ...defaultSnapshotPreset(),
        defShortVision:
          'Je considère la même micro-activité, mais avec une autre descente : je détaille d’abord la structure, puis je n’introduis l’objectif minimal qu’à la fin.',
        defLongVision:
          "Cette vision utilise les mêmes hypothèses de base que la micro-activité : un salaire personnel, des dépenses personnelles, et des flux d’activité (revenus et dépenses) à préciser. Mais la descente de raffinements est différente : au lieu de comparer très tôt la vision à l’objectif minimal, on choisit d’abord de décomposer complètement les flux — salaire + revenu d’activité, dépenses personnelles + dépenses d’activité — puis seulement ensuite, dans un troisième temps, on confronte cette structure détaillée à l’objectif minimal de 10 000 € à 12 mois.",
        initialStock: 3000,
        r1_inflow: 4000,
        r1_outflow: 3000,
        target: 10000,
        salary: 3000,
        personalExpenses: 2500,
        addInflowLabel: "Revenu d'activité",
        addOutflowLabel: "Dépenses d'activité",
        addInflow: 1000,
        addOutflow: 500,
        addFromPeriod: 1,
        visionIndex: 2,
        visionLabel: 'Vision 3 — Micro-activité (objectif tard)',
      };
      persist(v);
      setAddFromPeriodDraft(String(v.addFromPeriod));
    }
    setStep(0);
  }

  useEffect(() => {
    // V1 : on FORCE preset, même si ?mode=custom est présent.
    const mode: Mode = 'preset';

    // Si l'URL contient ?vision=1|2|3, on démarre directement sur cette vision (sans reprise localStorage).
    try {
      const params = new URLSearchParams(window.location.search);
      const v = params.get('vision');
      if (v) {
        const n = Number(v);
        const idx = n === 2 ? 1 : n === 3 ? 2 : 0;
        applyVisionPreset(idx as 0 | 1 | 2);
        return;
      }
    } catch {
      // ignore
    }

    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as SnapshotV1;
        if (parsed && parsed.version === 1 && parsed.mode === mode) {
          setSnap(parsed);
          setAddFromPeriodDraft(String(parsed.addFromPeriod ?? 1));
          return;
        }
      }
    } catch {
      // ignore
    }

    applyVisionPreset(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const lockNames = snap.mode === 'preset';

  const tableR1R2 = useMemo(
    () =>
      computeTable({
        initialStock: snap.initialStock,
        horizon: snap.horizon,
        baseInflow: snap.r1_inflow,
        baseOutflow: snap.r1_outflow,
      }),
    [snap.initialStock, snap.horizon, snap.r1_inflow, snap.r1_outflow]
  );

  const tableR3 = useMemo(() => {
    if (snap.mode === 'preset' && snap.visionIndex === 0) {
      // Vision 1 : pas d'activité ajoutée (R3 = salaire / dépenses pers.)
      return computeTable({
        initialStock: snap.initialStock,
        horizon: snap.horizon,
        baseInflow: snap.salary,
        baseOutflow: snap.personalExpenses,
      });
    }
    // Visions 2 et 3 : flux additionnels possibles
    return computeTable({
      initialStock: snap.initialStock,
      horizon: snap.horizon,
      baseInflow: snap.salary,
      baseOutflow: snap.personalExpenses,
      addFromPeriod: snap.addFromPeriod,
      addInflow: snap.addInflow,
      addOutflow: snap.addOutflow,
    });
  }, [
    snap.mode,
    snap.visionIndex,
    snap.initialStock,
    snap.horizon,
    snap.salary,
    snap.personalExpenses,
    snap.addFromPeriod,
    snap.addInflow,
    snap.addOutflow,
  ]);

  const atteintR1R2 = useMemo(
    () => tableR1R2.stockFinal - snap.target >= 0,
    [tableR1R2.stockFinal, snap.target]
  );
  const atteintR3 = useMemo(
    () => tableR3.stockFinal - snap.target >= 0,
    [tableR3.stockFinal, snap.target]
  );

  const canContinue = useMemo(() => {
    if (step === 0) return true;

    if (step === 1) {
      return (
        Number.isFinite(snap.horizon) &&
        snap.horizon >= 1 &&
        Number.isFinite(snap.initialStock) &&
        Number.isFinite(snap.r1_inflow) &&
        Number.isFinite(snap.r1_outflow)
      );
    }

    if (step === 2) {
      // Vision 3 : R2 = décomposition des flux, sans objectif “nouveau”
      if (snap.mode === 'preset' && snap.visionIndex === 2) {
        if (!Number.isFinite(snap.salary) || !Number.isFinite(snap.personalExpenses))
          return false;
        if (
          !Number.isFinite(snap.addInflow) ||
          !Number.isFinite(snap.addOutflow) ||
          !Number.isFinite(snap.addFromPeriod)
        )
          return false;
        return snap.addFromPeriod >= 1 && snap.addFromPeriod <= snap.horizon;
      }
      // Autres visions : R2 = objectif minimal
      return Number.isFinite(snap.target);
    }

    if (step === 3) {
      if (!Number.isFinite(snap.target)) return false;
      if (!Number.isFinite(snap.salary) || !Number.isFinite(snap.personalExpenses))
        return false;
      if (snap.mode === 'preset' && snap.visionIndex === 0) return true;
      return (
        Number.isFinite(snap.addInflow) &&
        Number.isFinite(snap.addOutflow) &&
        Number.isFinite(snap.addFromPeriod) &&
        snap.addFromPeriod >= 1 &&
        snap.addFromPeriod <= snap.horizon
      );
    }

    return true;
  }, [step, snap]);

  function goBack() {
    if (step === 0) {
      window.location.href = '/';
      return;
    }
    setStep((s) => Math.max(0, s - 1));
  }

  function onContinue() {
    if (step === 3) {
      if (snap.mode === 'preset') {
        if (snap.visionIndex < 2) {
          const next = (snap.visionIndex + 1) as 1 | 2;
          applyVisionPreset(next);
          return;
        }
        try {
          localStorage.setItem(FLAG_KEY, 'true');
        } catch {
          // ignore
        }
        window.location.href = '/';
        return;
      }
      window.location.href = '/';
      return;
    }
    setStep((s) => Math.min(3, s + 1));
  }

  return (
    <main
      style={{
        padding: 40,
        maxWidth: 980,
        margin: '0 auto',
        fontFamily: 'system-ui, sans-serif',
        color: C.text,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          gap: 12,
        }}
      >
        <div>
          <h1 style={{ margin: 0, color: C.text }}>{snap.visionLabel}</h1>
        </div>

        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <a
            href="/"
            style={{ fontSize: 14, color: C.link, textDecoration: 'underline' }}
          >
            Accueil
          </a>

          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              goBack();
            }}
            style={{ fontSize: 14, color: C.link, textDecoration: 'underline' }}
          >
            Revenir
          </a>
        </div>
      </div>

      {step === 0 && (
        <Card title="Définition de la vision (langage courant)">
          <p style={{ marginTop: 0, color: C.secondary }}>
            Vision en cours : <b>{snap.visionLabel}</b>
          </p>

          <ContinueBar onContinue={onContinue} disabled={!canContinue} />


          <div
            style={{
              padding: 12,
              border: `1px solid ${C.softBorder}`,
              borderRadius: 12,
              color: C.text,
            }}
          >
            <div style={{ marginBottom: 8 }}>
              <b>Définition courte :</b> {snap.defShortVision}
            </div>
            <div style={{ lineHeight: 1.55 }}>
              <b>Définition longue :</b> {snap.defLongVision}
            </div>
          </div>


          <ContinueBar onContinue={onContinue} />
        </Card>
      )}

      {step === 1 && (
        <Card title="R1 — Trésorerie : encaissements et décaissements fixes">
          <p style={{ marginTop: 0, color: C.secondary, fontSize: 14 }}>
            Objectif de la page : faire comprendre comment la trésorerie varie en fonction des encaissements et décaissements fixes sur toute la période.
          </p>

          <ContinueBar onContinue={onContinue} disabled={!canContinue} />


          <div
            style={{
              padding: 12,
              border: `1px solid ${C.softBorder}`,
              borderRadius: 12,
              color: C.text,
              marginBottom: 8,
            }}
          >
            <div>
              <b>Équation de base :</b> stock fin = stock début + flux d’entrée − flux de sortie
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 18,
              marginTop: 8,
            }}
          >
            <div>
              <InputRow
                label="Nom du stock"
                value={snap.stockLabel}
                disabled={lockNames}
                onChange={(v) => persist({ ...snap, stockLabel: v })} />
              <InputRow
                label="Unité"
                value={snap.unit}
                disabled={lockNames}
                onChange={(v) => persist({ ...snap, unit: v })} />
              <InputRow
                label="Horizon (nombre de périodes)"
                value={snap.horizon}
                onChange={(v) => {
                  if (v.trim() === '') return;
                  const n = toNumber(v);
                  if (!Number.isFinite(n)) return;
                  const horizon = clampInt(n, 1, 100000);
                  const clampedFrom = clampInt(snap.addFromPeriod, 1, horizon);
                  persist({ ...snap, horizon, addFromPeriod: clampedFrom });
                  setAddFromPeriodDraft(String(clampedFrom));
                }} />
            </div>

            <div>
              <InputRow
                label="Nom du flux d’entrée"
                value={snap.flowInLabel}
                disabled={lockNames}
                onChange={(v) => persist({ ...snap, flowInLabel: v })} />
              <InputRow
                label="Nom du flux de sortie"
                value={snap.flowOutLabel}
                disabled={lockNames}
                onChange={(v) => persist({ ...snap, flowOutLabel: v })} />

              <InputRow
                label="Stock initial"
                value={snap.initialStock}
                onChange={(v) => {
                  if (v.trim() === '') return;
                  const n = toNumber(v);
                  if (!Number.isFinite(n)) return;
                  persist({ ...snap, initialStock: n });
                }} />
              <InputRow
                label={`${snap.flowInLabel} (par période)`}
                value={snap.r1_inflow}
                onChange={(v) => {
                  if (v.trim() === '') return;
                  const n = toNumber(v);
                  if (!Number.isFinite(n)) return;
                  persist({ ...snap, r1_inflow: n });
                }} />
              <InputRow
                label={`${snap.flowOutLabel} (par période)`}
                value={snap.r1_outflow}
                onChange={(v) => {
                  if (v.trim() === '') return;
                  const n = toNumber(v);
                  if (!Number.isFinite(n)) return;
                  persist({ ...snap, r1_outflow: n });
                }} />
            </div>
          </div>

          <TableAlwaysVisible
            rows={tableR1R2.rows}
            stockLabel={snap.stockLabel}
            flowInLabel={snap.flowInLabel}
            flowOutLabel={snap.flowOutLabel} />

          <ContinueBar
            onContinue={onContinue}
            disabled={!canContinue} />
        </Card>
      )}

      {step === 2 && (
        <Card
          title={
            snap.mode === 'preset' && snap.visionIndex === 2
              ? 'R2 — Décomposition des flux (sans objectif)'
              : 'R2 — Objectif minimal'
          }
        >
          <ContinueBar onContinue={onContinue} disabled={!canContinue} />

          {snap.mode === 'preset' && snap.visionIndex === 2 ? (
            <>
              <p style={{ marginTop: 0, color: C.secondary, fontSize: 14 }}>
                Ici, R2 sert d’abord à détailler la structure (salaire + activité). L’objectif minimal
                sera introduit en R3 : c’est une descente différente de la Vision 2.
              </p>

              <div
                style={{
                  padding: 12,
                  border: `1px solid ${C.softBorder}`,
                  borderRadius: 12,
                  color: C.text,
                  lineHeight: 1.6,
                }}
              >
                <b>Équations (structure)</b>
                <div>
                  {snap.flowInLabel} = salaire + {snap.addInflowLabel} (à partir de la période{' '}
                  {snap.addFromPeriod})
                </div>
                <div>
                  {snap.flowOutLabel} = dépenses personnelles + {snap.addOutflowLabel} (à partir de
                  la période {snap.addFromPeriod})
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 18,
                  marginTop: 8,
                }}
              >
                <div>
                  <InputRow
                    label="Salaire (par période)"
                    value={snap.salary}
                    onChange={(v) => {
                      if (v.trim() === '') return;
                      const n = toNumber(v);
                      if (!Number.isFinite(n)) return;
                      persist({ ...snap, salary: n });
                    }} />
                  <InputRow
                    label="Dépenses personnelles (par période)"
                    value={snap.personalExpenses}
                    onChange={(v) => {
                      if (v.trim() === '') return;
                      const n = toNumber(v);
                      if (!Number.isFinite(n)) return;
                      persist({ ...snap, personalExpenses: n });
                    }} />
                </div>

                <div>
                  <InputRow
                    label={`À partir de la période (1..${snap.horizon})`}
                    value={addFromPeriodDraft}
                    onChange={(v) => {
                      setAddFromPeriodDraft(v);
                      if (v.trim() === '') return;
                      const n = toNumber(v);
                      if (!Number.isFinite(n)) return;
                      const p = clampInt(n, 1, snap.horizon);
                      persist({ ...snap, addFromPeriod: p });
                    }}
                    placeholder="Ex. 4" />
                  <InputRow
                    label={`${snap.addInflowLabel} (par période)`}
                    value={snap.addInflow}
                    onChange={(v) => {
                      if (v.trim() === '') return;
                      const n = toNumber(v);
                      if (!Number.isFinite(n)) return;
                      persist({ ...snap, addInflow: n });
                    }} />
                  <InputRow
                    label={`${snap.addOutflowLabel} (par période)`}
                    value={snap.addOutflow}
                    onChange={(v) => {
                      if (v.trim() === '') return;
                      const n = toNumber(v);
                      if (!Number.isFinite(n)) return;
                      persist({ ...snap, addOutflow: n });
                    }} />
                </div>
              </div>

              <TableAlwaysVisible
                rows={tableR3.rows}
                stockLabel={snap.stockLabel}
                flowInLabel={snap.flowInLabel}
                flowOutLabel={snap.flowOutLabel} />

              <ContinueBar
                onContinue={onContinue}
                disabled={!canContinue} />
            </>
          ) : (
            <>
              <p style={{ marginTop: 0, color: C.secondary, fontSize: 14 }}>
                R2 introduit l’objectif minimal : on voit rapidement si la vision atteint (ou non) l’objectif.
              </p>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 18,
                }}
              >
                <div>
                  <InputRow
                    label="Stock initial (modifiable)"
                    value={snap.initialStock}
                    onChange={(v) => {
                      if (v.trim() === '') return;
                      const n = toNumber(v);
                      if (!Number.isFinite(n)) return;
                      persist({ ...snap, initialStock: n });
                    }} />
                  <InputRow
                    label={`${snap.flowInLabel} (modifiable)`}
                    value={snap.r1_inflow}
                    onChange={(v) => {
                      if (v.trim() === '') return;
                      const n = toNumber(v);
                      if (!Number.isFinite(n)) return;
                      persist({ ...snap, r1_inflow: n });
                    }} />
                </div>
                <div>
                  <InputRow
                    label={`${snap.flowOutLabel} (modifiable)`}
                    value={snap.r1_outflow}
                    onChange={(v) => {
                      if (v.trim() === '') return;
                      const n = toNumber(v);
                      if (!Number.isFinite(n)) return;
                      persist({ ...snap, r1_outflow: n });
                    }} />
                  <InputRow
                    label={`Objectif minimal (en ${snap.unit})`}
                    value={snap.target}
                    onChange={(v) => {
                      if (v.trim() === '') return;
                      const n = toNumber(v);
                      if (!Number.isFinite(n)) return;
                      persist({ ...snap, target: n });
                    }} />
                </div>
              </div>

              <div
                style={{
                  marginTop: 12,
                  padding: 12,
                  border: `1px solid ${C.softBorder}`,
                  borderRadius: 12,
                }}
              >
                Stock final (R1/R2) : <b>{fmt(tableR1R2.stockFinal)}</b> {snap.unit} —{' '}
                <b style={{ color: atteintR1R2 ? C.ok : C.bad }}>
                  {atteintR1R2 ? 'objectif atteint' : 'objectif non atteint'}
                </b>
              </div>

              <TableAlwaysVisible
                rows={tableR1R2.rows}
                stockLabel={snap.stockLabel}
                flowInLabel={snap.flowInLabel}
                flowOutLabel={snap.flowOutLabel} />

              <ContinueBar
                onContinue={onContinue}
                disabled={!canContinue} />
            </>
          )}
        </Card>
      )}

      {step === 3 && (
        <Card title="R3 — Interprétation (équations)">
          <p style={{ marginTop: 0, color: C.secondary, fontSize: 14 }}>
            {snap.mode === 'preset' && snap.visionIndex === 2
              ? "Ici, l’objectif minimal arrive après la décomposition des flux : on confronte maintenant la structure détaillée à l’objectif."
              : "R3 explicite les équations (interprétation des flux). Vous pouvez encore ajuster l’objectif minimal."}
          </p>

          {snap.mode === "preset" && snap.visionIndex === 2 ? (
  <div style={{ marginTop: 18, display: "flex", justifyContent: "flex-end" }}>
    <button
      onClick={() => (window.location.href = "/")}
      style={{
        padding: "10px 16px",
        borderRadius: 10,
        border: "1px solid #ccc",
        background: "white",
        cursor: "pointer",
        fontSize: 16,
      }}
    >
      Retour à l’accueil
    </button>
  </div>
) : (
  <ContinueBar onContinue={onContinue} disabled={!canContinue} />
)}



          <InputRow
            label={`Objectif minimal (en ${snap.unit}) — modifiable`}
            value={snap.target}
            onChange={(v) => {
              if (v.trim() === '') return;
              const n = toNumber(v);
              if (!Number.isFinite(n)) return;
              persist({ ...snap, target: n });
            }} />

          {snap.mode === 'preset' && snap.visionIndex === 0 ? (
            <>
              <div
                style={{
                  padding: 12,
                  border: `1px solid ${C.softBorder}`,
                  borderRadius: 12,
                  lineHeight: 1.6,
                  marginTop: 8,
                }}
              >
                <b>Équations (Vision 1)</b>
                <div>
                  {snap.flowInLabel} = salaire
                </div>
                <div>
                  {snap.flowOutLabel} = dépenses personnelles
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 18,
                  marginTop: 8,
                }}
              >
                <InputRow
                  label="Salaire (par période)"
                  value={snap.salary}
                  onChange={(v) => {
                    if (v.trim() === '') return;
                    const n = toNumber(v);
                    if (!Number.isFinite(n)) return;
                    persist({ ...snap, salary: n });
                  }} />
                <InputRow
                  label="Dépenses personnelles (par période)"
                  value={snap.personalExpenses}
                  onChange={(v) => {
                    if (v.trim() === '') return;
                    const n = toNumber(v);
                    if (!Number.isFinite(n)) return;
                    persist({ ...snap, personalExpenses: n });
                  }} />
              </div>
            </>
          ) : (
            <>
              <div
                style={{
                  padding: 12,
                  border: `1px solid ${C.softBorder}`,
                  borderRadius: 12,
                  lineHeight: 1.6,
                  marginTop: 8,
                }}
              >
                <b>Équations</b>
                <div>
                  {snap.flowInLabel} = salaire + {snap.addInflowLabel} (à partir de la période{' '}
                  {snap.addFromPeriod})
                </div>
                <div>
                  {snap.flowOutLabel} = dépenses personnelles + {snap.addOutflowLabel} (à partir de la
                  période {snap.addFromPeriod})
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 18,
                  marginTop: 8,
                }}
              >
                <div>
                  <InputRow
                    label="Salaire (par période)"
                    value={snap.salary}
                    onChange={(v) => {
                      if (v.trim() === '') return;
                      const n = toNumber(v);
                      if (!Number.isFinite(n)) return;
                      persist({ ...snap, salary: n });
                    }} />
                  <InputRow
                    label="Dépenses personnelles (par période)"
                    value={snap.personalExpenses}
                    onChange={(v) => {
                      if (v.trim() === '') return;
                      const n = toNumber(v);
                      if (!Number.isFinite(n)) return;
                      persist({ ...snap, personalExpenses: n });
                    }} />
                </div>

                <div>
                  <InputRow
                    label={`À partir de la période (1..${snap.horizon})`}
                    value={addFromPeriodDraft}
                    onChange={(v) => {
                      setAddFromPeriodDraft(v);
                      if (v.trim() === '') return;
                      const n = toNumber(v);
                      if (!Number.isFinite(n)) return;
                      const p = clampInt(n, 1, snap.horizon);
                      persist({ ...snap, addFromPeriod: p });
                    }}
                    placeholder="Ex. 4" />
                  <InputRow
                    label={`${snap.addInflowLabel} (par période)`}
                    value={snap.addInflow}
                    onChange={(v) => {
                      if (v.trim() === '') return;
                      const n = toNumber(v);
                      if (!Number.isFinite(n)) return;
                      persist({ ...snap, addInflow: n });
                    }} />
                  <InputRow
                    label={`${snap.addOutflowLabel} (par période)`}
                    value={snap.addOutflow}
                    onChange={(v) => {
                      if (v.trim() === '') return;
                      const n = toNumber(v);
                      if (!Number.isFinite(n)) return;
                      persist({ ...snap, addOutflow: n });
                    }} />
                </div>
              </div>
            </>
          )}

          <div
            style={{
              marginTop: 12,
              padding: 12,
              border: `1px solid ${C.softBorder}`,
              borderRadius: 12,
            }}
          >
            Stock final (R3) : <b>{fmt(tableR3.stockFinal)}</b> {snap.unit} —{' '}
            <b style={{ color: atteintR3 ? C.ok : C.bad }}>
              {atteintR3 ? 'objectif atteint' : 'objectif non atteint'}
            </b>
          </div>

          <TableAlwaysVisible
            rows={tableR3.rows}
            stockLabel={snap.stockLabel}
            flowInLabel={snap.flowInLabel}
            flowOutLabel={snap.flowOutLabel} />

          {snap.mode === "preset" && snap.visionIndex === 2 ? (
  <div style={{ marginTop: 18, display: "flex", justifyContent: "flex-end" }}>
    <button
      onClick={() => (window.location.href = "/")}
      style={{
        padding: "10px 16px",
        borderRadius: 10,
        border: "1px solid #ccc",
        background: "white",
        cursor: "pointer",
        fontSize: 16,
      }}
    >
      Retour à l’accueil
    </button>
  </div>
) : (
  <ContinueBar
    onContinue={onContinue}
    disabled={!canContinue}
  />
)}


        </Card>
      )}
    </main>
  );
}
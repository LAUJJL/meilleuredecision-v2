'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';

type TimeUnit =
  | 'seconde'
  | 'minute'
  | 'heure'
  | 'jour'
  | 'semaine'
  | 'mois'
  | 'trimestre'
  | 'semestre'
  | 'an';

type R2Overrides = {
  initialStock?: number;
  baseInflow?: number;
  baseOutflow?: number;
};

type R2Semantics = {
  inflowMeaning: string; // ex "Salaire"
  outflowMeaning: string; // ex "Dépenses personnelles"
};

type R3Semantics = {
  inflowMeaning: string; // ex "Revenu activité"
  outflowMeaning: string; // ex "Dépenses activité"
};

type RefinementStep =
  | {
      id: number;
      type: 'R1_BASE';
      createdAt: string;
      payload: {
        stockName: string;
        stockUnit: string;
        timeUnit: TimeUnit;
        horizon: number;
        flowInName: string;
        flowOutName: string;
        initialStock: number;
        flowInValue: number;
        flowOutValue: number;
      };
    }
  | {
      id: number;
      type: 'R2_OBJECTIF';
      createdAt: string;
      payload: {
        target: number;
        targetPeriod: number;
        stockName: string;
        overrides?: R2Overrides;
        semantics?: R2Semantics;
      };
    }
  | {
      id: number;
      type: 'R3_ACTIVITE';
      createdAt: string;
      payload: {
        name: string;
        fromPeriod: number;
        deltaInflow: number;
        deltaOutflow: number;
        semantics?: R3Semantics;
      };
    };

type TableRow = {
  period: number;
  beginning: number;
  inflow: number;
  outflow: number;
  ending: number;
};

type VisionId = 'vision_1' | 'vision_2' | 'vision_3';
type VisionPreset = {
  id: VisionId;
  label: string;
  initialStock: number;
  inflow: number;
  outflow: number;
  horizon: number;
  timeUnit: TimeUnit;
  target: number;
};

type ProblemSnapshotV1 = {
  version: 1;
  savedAtIso: string;

  stockLabel: string;
  unit: string;
  timeUnit: TimeUnit;
  horizon: number | null;

  currentInitialStock: number | null;
  currentBaseInflow: number | null;
  currentBaseOutflow: number | null;

  target: number | null;

  r2Semantics?: {
    flowInLabel: string;
    inflowMeaning: string;
    flowOutLabel: string;
    outflowMeaning: string;
  };

  activities: Array<{
    name: string;
    fromPeriod: number;
    deltaInflow: number;
    deltaOutflow: number;
  }>;
};

const LS_KEY = 'current_problem_v1';

function nowIso() {
  return new Date().toISOString();
}

function round2(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function safeParseNumber(s: string): number | null {
  const t = s.trim().replace(',', '.');
  if (!t) return null;
  const n = Number(t);
  if (!Number.isFinite(n)) return null;
  return n;
}

function clampInt(n: number, min: number, max: number) {
  const i = Math.floor(n);
  return Math.max(min, Math.min(max, i));
}

function buildTableVariableFlows(
  initialStock: number,
  inflowByPeriod: number[],
  outflowByPeriod: number[],
  horizon: number,
): TableRow[] {
  const rows: TableRow[] = [];
  let begin = initialStock;

  for (let p = 1; p <= horizon; p++) {
    const inflow = inflowByPeriod[p - 1] ?? 0;
    const outflow = outflowByPeriod[p - 1] ?? 0;
    const end = begin + inflow - outflow;

    rows.push({
      period: p,
      beginning: round2(begin),
      inflow: round2(inflow),
      outflow: round2(outflow),
      ending: round2(end),
    });

    begin = end;
  }

  return rows;
}

function TableView(props: {
  title: string;
  rows: TableRow[];
  stockLabel: string;
  flowInLabel: string;
  flowOutLabel: string;
  unit: string;
  horizon: number | null;
  note?: string;
}) {
  const { title, rows, stockLabel, flowInLabel, flowOutLabel, unit, horizon, note } = props;
  const stockFinal = rows.length > 0 ? rows[rows.length - 1].ending : null;

  return (
    <div style={{ marginTop: 12 }}>
      <h3 style={{ marginTop: 0 }}>{title}</h3>
      {note && <p style={{ marginTop: 6, color: '#2563eb' }}>{note}</p>}

      {rows.length === 0 ? (
        <p style={{ color: '#666' }}>Tableau indisponible (valeurs chiffrées non renseignées ou incomplètes).</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', minWidth: 850 }}>
            <thead>
              <tr>
                <th style={{ border: '1px solid #ccc', padding: 6 }}>Période</th>
                <th style={{ border: '1px solid #ccc', padding: 6 }}>{stockLabel} début</th>
                <th style={{ border: '1px solid #ccc', padding: 6 }}>{flowInLabel}</th>
                <th style={{ border: '1px solid #ccc', padding: 6 }}>{flowOutLabel}</th>
                <th style={{ border: '1px solid #ccc', padding: 6 }}>{stockLabel} fin</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.period}>
                  <td style={{ border: '1px solid #ccc', padding: 6 }}>{r.period}</td>
                  <td style={{ border: '1px solid #ccc', padding: 6 }}>{r.beginning}</td>
                  <td style={{ border: '1px solid #ccc', padding: 6 }}>{r.inflow}</td>
                  <td style={{ border: '1px solid #ccc', padding: 6 }}>{r.outflow}</td>
                  <td style={{ border: '1px solid #ccc', padding: 6 }}>{r.ending}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {stockFinal !== null && horizon !== null && (
        <p style={{ marginTop: 10, color: '#444' }}>
          Valeur finale (période {horizon}) : <b>{round2(stockFinal)}</b> {unit}
        </p>
      )}
    </div>
  );
}

function ObjectivePanel(props: { unit: string; stockFinal: number | null; target: number | null; modeLabel?: string }) {
  const { unit, stockFinal, target, modeLabel } = props;

  if (stockFinal === null || target === null) {
    return <p style={{ color: '#666' }}>Évaluation indisponible (table ou objectif incomplets).</p>;
  }

  const sf = round2(stockFinal);
  const tg = round2(target);
  const ecart = round2(sf - tg);
  const atteint = ecart >= 0;

  return (
    <div style={{ marginTop: 10, padding: 10, border: '1px dashed #ccc', borderRadius: 10, color: '#333' }}>
      {modeLabel && (
        <div style={{ color: '#2563eb', marginBottom: 6 }}>
          <b>{modeLabel}</b>
        </div>
      )}
      <div>
        objectif_stock : <b>{tg}</b> {unit}
      </div>
      <div>
        stock_final : <b>{sf}</b> {unit}
      </div>
      <div>
        ecart = stock_final − objectif_stock : <b>{ecart}</b> {unit}
      </div>
      <div>
        atteint = (ecart ≥ 0) :{' '}
        <b style={{ color: atteint ? '#166534' : '#b91c1c' }}>{atteint ? 'Objectif atteint' : 'Objectif non atteint'}</b>
      </div>
    </div>
  );
}

function Toggle(props: { open: boolean; setOpen: (b: boolean) => void; labelOpen: string; labelClose: string }) {
  return (
    <button
      type="button"
      onClick={() => props.setOpen(!props.open)}
      style={{
        cursor: 'pointer',
        padding: '6px 12px',
        border: '1px solid #ddd',
        background: 'white',
        borderRadius: 8,
        marginTop: 10,
      }}
    >
      {props.open ? props.labelClose : props.labelOpen}
    </button>
  );
}

function BaseParamsSummary(props: {
  unit: string;
  timeUnit: TimeUnit;
  stockLabel: string;
  flowInLabel: string;
  flowOutLabel: string;
  initialStock: number | null;
  baseInflow: number | null;
  baseOutflow: number | null;
  hasOverrides: boolean;
  r2Semantics?: R2Semantics;
}) {
  const {
    unit,
    timeUnit,
    stockLabel,
    flowInLabel,
    flowOutLabel,
    initialStock,
    baseInflow,
    baseOutflow,
    hasOverrides,
    r2Semantics,
  } = props;

  return (
    <div style={{ marginTop: 10, padding: 12, border: '1px solid #eee', borderRadius: 10, color: '#333' }}>
      <div>
        <b>Paramètres de base courants (hérités / révisés)</b>
        <div style={{ color: '#666', marginTop: 4, fontSize: 12 }}>
          {hasOverrides ? 'Inclut des révisions validées en R2.' : 'Aucune révision R2 enregistrée.'}
        </div>
      </div>

      <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div>
          {stockLabel} départ : <b>{initialStock ?? '—'}</b> {initialStock == null ? '' : unit}
        </div>
        <div>
          {flowInLabel} base : <b>{baseInflow ?? '—'}</b> {baseInflow == null ? '' : `${unit}/${timeUnit}`}
        </div>
        <div>
          {flowOutLabel} base : <b>{baseOutflow ?? '—'}</b> {baseOutflow == null ? '' : `${unit}/${timeUnit}`}
        </div>
      </div>

      {r2Semantics && (
        <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px dashed #ddd' }}>
          <div style={{ color: '#2563eb' }}>
            <b>Clarification (R2)</b>
          </div>
          <div style={{ marginTop: 6 }}>
            {flowInLabel} = <b>{r2Semantics.inflowMeaning}</b>
          </div>
          <div>
            {flowOutLabel} = <b>{r2Semantics.outflowMeaning}</b>
          </div>
        </div>
      )}
    </div>
  );
}

const VISION_PRESETS: Record<VisionId, VisionPreset> = {
  vision_1: {
    id: 'vision_1',
    label: 'Rester salarié',
    initialStock: 3000,
    inflow: 3000,
    outflow: 2500,
    horizon: 12,
    timeUnit: 'mois',
    target: 10000,
  },
  vision_2: {
    id: 'vision_2',
    label: 'Micro-activité',
    initialStock: 3000,
    inflow: 4000,
    outflow: 3000,
    horizon: 12,
    timeUnit: 'mois',
    target: 10000,
  },
  vision_3: {
    id: 'vision_3',
    label: 'Salarié + amélioration',
    initialStock: 3000,
    inflow: 3500,
    outflow: 2900,
    horizon: 12,
    timeUnit: 'mois',
    target: 10000,
  },
};

function asVisionId(x: string | null): VisionId | null {
  if (x === 'vision_1' || x === 'vision_2' || x === 'vision_3') return x;
  return null;
}

export default function RefinementsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const visionFromUrl = asVisionId(searchParams.get('vision'));
  const mode = searchParams.get('mode'); // "custom" désactive le préremplissage
  const presetFromUrl = mode === 'custom' ? null : visionFromUrl ? VISION_PRESETS[visionFromUrl] : null;

  const [didApplyVisionPreset, setDidApplyVisionPreset] = useState(false);

  const [showTableR1, setShowTableR1] = useState(false);
  const [showTableR2, setShowTableR2] = useState(false);
  const [showTableR3Validated, setShowTableR3Validated] = useState(false);
  const [showTableR3Preview, setShowTableR3Preview] = useState(true);

  const [showR2Params, setShowR2Params] = useState(false);
  const [showR2Clarification, setShowR2Clarification] = useState(false);
  const [showR3Clarification, setShowR3Clarification] = useState(false);

  const [baseStockName, setBaseStockName] = useState('Trésorerie');
  const [stockUnit, setStockUnit] = useState('euros');
  const [timeUnit, setTimeUnit] = useState<TimeUnit>('mois');
  const [horizonInput, setHorizonInput] = useState('12');

  const [flowInNameInput, setFlowInNameInput] = useState('Encaissements');
  const [flowOutNameInput, setFlowOutNameInput] = useState('Décaissements');

  const [initialStockInput, setInitialStockInput] = useState('');
  const [flowInValueInput, setFlowInValueInput] = useState('');
  const [flowOutValueInput, setFlowOutValueInput] = useState('');

  const [steps, setSteps] = useState<RefinementStep[]>([]);

  const [targetInput, setTargetInput] = useState('10000');

  const [r2InitialStockInput, setR2InitialStockInput] = useState('');
  const [r2BaseInflowInput, setR2BaseInflowInput] = useState('');
  const [r2BaseOutflowInput, setR2BaseOutflowInput] = useState('');

  const [r2InflowMeaning, setR2InflowMeaning] = useState('Salaire');
  const [r2OutflowMeaning, setR2OutflowMeaning] = useState('Dépenses personnelles');

  const [activityNameInput, setActivityNameInput] = useState('Activité ajoutée');
  const [fromPeriodInput, setFromPeriodInput] = useState('4');

  const [activityIncomeInput, setActivityIncomeInput] = useState('500');
  const [activityCostInput, setActivityCostInput] = useState('0');

  const [r3InflowMeaning, setR3InflowMeaning] = useState('Revenu activité');
  const [r3OutflowMeaning, setR3OutflowMeaning] = useState('Dépenses activité');

  const hasR1 = steps.some((s) => s.type === 'R1_BASE');
  const hasR2 = steps.some((s) => s.type === 'R2_OBJECTIF');

  // Préremplissage automatique (désactivé si mode=custom)
  useEffect(() => {
    if (hasR1) return;
    if (!presetFromUrl) return;
    if (didApplyVisionPreset) return;

    setTimeUnit(presetFromUrl.timeUnit);
    setHorizonInput(String(presetFromUrl.horizon));
    setInitialStockInput(String(presetFromUrl.initialStock));
    setFlowInValueInput(String(presetFromUrl.inflow));
    setFlowOutValueInput(String(presetFromUrl.outflow));
    setTargetInput(String(presetFromUrl.target));

    setDidApplyVisionPreset(true);
  }, [hasR1, presetFromUrl, didApplyVisionPreset]);

  const r1 = useMemo(
    () => steps.find((s) => s.type === 'R1_BASE') as Extract<RefinementStep, { type: 'R1_BASE' }> | undefined,
    [steps],
  );

  const r2 = useMemo(
    () => steps.find((s) => s.type === 'R2_OBJECTIF') as Extract<RefinementStep, { type: 'R2_OBJECTIF' }> | undefined,
    [steps],
  );

  const r3s = useMemo(
    () => steps.filter((s) => s.type === 'R3_ACTIVITE') as Extract<RefinementStep, { type: 'R3_ACTIVITE' }>[],
    [steps],
  );

  const flowInLabel = (r1?.payload.flowInName ?? flowInNameInput).trim() || 'Flux d’entrée';
  const flowOutLabel = (r1?.payload.flowOutName ?? flowOutNameInput).trim() || 'Flux de sortie';
  const stockLabel = (r1?.payload.stockName ?? baseStockName).trim() || 'Stock';

  const horizonParsed = useMemo(() => {
    const n = safeParseNumber(horizonInput);
    if (n === null) return null;
    const i = Math.floor(n);
    if (i <= 0) return null;
    return i;
  }, [horizonInput]);

  const initialStockParsed = useMemo(() => safeParseNumber(initialStockInput), [initialStockInput]);
  const flowInValueParsed = useMemo(() => safeParseNumber(flowInValueInput), [flowInValueInput]);
  const flowOutValueParsed = useMemo(() => safeParseNumber(flowOutValueInput), [flowOutValueInput]);

  const r1Horizon = r1?.payload.horizon ?? horizonParsed;
  const r1InitialStock = r1?.payload.initialStock ?? initialStockParsed;
  const r1BaseInflow = r1?.payload.flowInValue ?? flowInValueParsed;
  const r1BaseOutflow = r1?.payload.flowOutValue ?? flowOutValueParsed;

  const unit = r1?.payload.stockUnit ?? stockUnit;
  const tUnit = r1?.payload.timeUnit ?? timeUnit;

  const r1StructureOk =
    baseStockName.trim().length > 0 &&
    stockUnit.trim().length > 0 &&
    timeUnit.trim().length > 0 &&
    horizonParsed !== null &&
    flowInNameInput.trim().length > 0 &&
    flowOutNameInput.trim().length > 0;

  const r1NumbersOk = initialStockParsed !== null && flowInValueParsed !== null && flowOutValueParsed !== null;
  const r1Ready = r1StructureOk && r1NumbersOk;

  function addR1() {
    if (!r1Ready || hasR1) return;
    if (horizonParsed === null || initialStockParsed === null || flowInValueParsed === null || flowOutValueParsed === null) return;

    const step: RefinementStep = {
      id: Date.now(),
      type: 'R1_BASE',
      createdAt: nowIso(),
      payload: {
        stockName: baseStockName.trim(),
        stockUnit: stockUnit.trim(),
        timeUnit,
        horizon: horizonParsed,
        flowInName: flowInNameInput.trim(),
        flowOutName: flowOutNameInput.trim(),
        initialStock: initialStockParsed,
        flowInValue: flowInValueParsed,
        flowOutValue: flowOutValueParsed,
      },
    };

    setSteps((prev) => [...prev, step]);
  }

  useEffect(() => {
    if (!hasR1 || hasR2) return;

    if (r2InitialStockInput === '' && r1InitialStock !== null) setR2InitialStockInput(String(r1InitialStock));
    if (r2BaseInflowInput === '' && r1BaseInflow !== null) setR2BaseInflowInput(String(r1BaseInflow));
    if (r2BaseOutflowInput === '' && r1BaseOutflow !== null) setR2BaseOutflowInput(String(r1BaseOutflow));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasR1, hasR2, r1InitialStock, r1BaseInflow, r1BaseOutflow]);

  useEffect(() => {
    if (!r2?.payload.semantics) return;
    setR2InflowMeaning(r2.payload.semantics.inflowMeaning);
    setR2OutflowMeaning(r2.payload.semantics.outflowMeaning);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [r2?.id]);

  const r2OverridesDraft: R2Overrides | null = useMemo(() => {
    if (!hasR1 || hasR2) return null;

    const i = safeParseNumber(r2InitialStockInput);
    const fin = safeParseNumber(r2BaseInflowInput);
    const fout = safeParseNumber(r2BaseOutflowInput);

    const overrides: R2Overrides = {};
    if (i !== null) overrides.initialStock = i;
    if (fin !== null) overrides.baseInflow = fin;
    if (fout !== null) overrides.baseOutflow = fout;

    return Object.keys(overrides).length === 0 ? null : overrides;
  }, [hasR1, hasR2, r2InitialStockInput, r2BaseInflowInput, r2BaseOutflowInput]);

  const horizon = r1Horizon;

  const currentInitialStock = r2?.payload.overrides?.initialStock ?? r2OverridesDraft?.initialStock ?? r1InitialStock;
  const currentBaseInflow = r2?.payload.overrides?.baseInflow ?? r2OverridesDraft?.baseInflow ?? r1BaseInflow;
  const currentBaseOutflow = r2?.payload.overrides?.baseOutflow ?? r2OverridesDraft?.baseOutflow ?? r1BaseOutflow;

  const semanticsDraft: R2Semantics = useMemo(
    () => ({
      inflowMeaning: r2InflowMeaning.trim() || 'Salaire',
      outflowMeaning: r2OutflowMeaning.trim() || 'Dépenses personnelles',
    }),
    [r2InflowMeaning, r2OutflowMeaning],
  );

  function addR2Objectif() {
    if (!hasR1 || hasR2) return;
    if (horizon === null) return;

    const target = safeParseNumber(targetInput);
    if (target === null) return;

    const step: RefinementStep = {
      id: Date.now(),
      type: 'R2_OBJECTIF',
      createdAt: nowIso(),
      payload: {
        target,
        targetPeriod: horizon,
        stockName: stockLabel,
        overrides: r2OverridesDraft ?? undefined,
        semantics: showR2Clarification ? semanticsDraft : undefined,
      },
    };

    setSteps((prev) => [...prev, step]);
  }

  function addR3Activite() {
    if (!hasR1 || !hasR2) return;
    if (horizon === null) return;

    const name = activityNameInput.trim();
    if (!name) return;

    const fromRaw = safeParseNumber(fromPeriodInput);
    const income = safeParseNumber(activityIncomeInput);
    const cost = safeParseNumber(activityCostInput);
    if (fromRaw === null || income === null || cost === null) return;

    const fromPeriod = clampInt(fromRaw, 1, horizon);

    const step: RefinementStep = {
      id: Date.now(),
      type: 'R3_ACTIVITE',
      createdAt: nowIso(),
      payload: {
        name,
        fromPeriod,
        deltaInflow: income,
        deltaOutflow: cost,
        semantics: showR3Clarification
          ? {
              inflowMeaning: r3InflowMeaning.trim() || 'Revenu activité',
              outflowMeaning: r3OutflowMeaning.trim() || 'Dépenses activité',
            }
          : undefined,
      },
    };

    setSteps((prev) => [...prev, step]);
  }

  function resetAll(askConfirm: boolean) {
    if (askConfirm && !confirm('Tout effacer (raffinements en mémoire) ?')) return;
    setSteps([]);
    setDidApplyVisionPreset(false);
  }

  function newProblem() {
    resetAll(false);
    router.replace('/refinements?mode=custom');
  }

  const tableRowsValidated = useMemo(() => {
    if (horizon === null) return [];
    if (currentInitialStock === null || currentBaseInflow === null || currentBaseOutflow === null) return [];

    const inflowByPeriod = Array.from({ length: horizon }, () => currentBaseInflow);
    const outflowByPeriod = Array.from({ length: horizon }, () => currentBaseOutflow);

    for (const a of r3s) {
      const startIdx = clampInt(a.payload.fromPeriod, 1, horizon) - 1;
      for (let i = startIdx; i < horizon; i++) {
        inflowByPeriod[i] = (inflowByPeriod[i] ?? 0) + a.payload.deltaInflow;
        outflowByPeriod[i] = (outflowByPeriod[i] ?? 0) + a.payload.deltaOutflow;
      }
    }

    return buildTableVariableFlows(currentInitialStock, inflowByPeriod, outflowByPeriod, horizon);
  }, [horizon, currentInitialStock, currentBaseInflow, currentBaseOutflow, r3s]);

  const stockFinalValidated = tableRowsValidated.length > 0 ? tableRowsValidated[tableRowsValidated.length - 1].ending : null;

  const pendingR3 = useMemo(() => {
    if (!hasR1 || !hasR2) return null;
    if (horizon === null) return null;

    const name = activityNameInput.trim();
    if (!name) return null;

    const fromRaw = safeParseNumber(fromPeriodInput);
    const income = safeParseNumber(activityIncomeInput);
    const cost = safeParseNumber(activityCostInput);
    if (fromRaw === null || income === null || cost === null) return null;

    return { name, fromPeriod: clampInt(fromRaw, 1, horizon), deltaInflow: income, deltaOutflow: cost };
  }, [hasR1, hasR2, horizon, activityNameInput, fromPeriodInput, activityIncomeInput, activityCostInput]);

  const tableRowsPreview = useMemo(() => {
    if (!pendingR3) return tableRowsValidated;
    if (horizon === null) return tableRowsValidated;
    if (currentInitialStock === null || currentBaseInflow === null || currentBaseOutflow === null) return tableRowsValidated;

    const inflowByPeriod = Array.from({ length: horizon }, () => currentBaseInflow);
    const outflowByPeriod = Array.from({ length: horizon }, () => currentBaseOutflow);

    for (const a of r3s) {
      const startIdx = clampInt(a.payload.fromPeriod, 1, horizon) - 1;
      for (let i = startIdx; i < horizon; i++) {
        inflowByPeriod[i] = (inflowByPeriod[i] ?? 0) + a.payload.deltaInflow;
        outflowByPeriod[i] = (outflowByPeriod[i] ?? 0) + a.payload.deltaOutflow;
      }
    }

    const startIdx = clampInt(pendingR3.fromPeriod, 1, horizon) - 1;
    for (let i = startIdx; i < horizon; i++) {
      inflowByPeriod[i] = (inflowByPeriod[i] ?? 0) + pendingR3.deltaInflow;
      outflowByPeriod[i] = (outflowByPeriod[i] ?? 0) + pendingR3.deltaOutflow;
    }

    return buildTableVariableFlows(currentInitialStock, inflowByPeriod, outflowByPeriod, horizon);
  }, [pendingR3, tableRowsValidated, horizon, currentInitialStock, currentBaseInflow, currentBaseOutflow, r3s]);

  const stockFinalPreview = tableRowsPreview.length > 0 ? tableRowsPreview[tableRowsPreview.length - 1].ending : null;

  const targetPreview = useMemo(() => {
    if (r2?.payload.target != null) return r2.payload.target;
    return safeParseNumber(targetInput);
  }, [r2?.payload.target, targetInput]);

  const r3Ready = useMemo(() => {
    if (!hasR1 || !hasR2) return false;
    if (horizon === null) return false;
    if (!activityNameInput.trim()) return false;

    const fp = safeParseNumber(fromPeriodInput);
    const income = safeParseNumber(activityIncomeInput);
    const cost = safeParseNumber(activityCostInput);

    return fp !== null && income !== null && cost !== null;
  }, [hasR1, hasR2, horizon, activityNameInput, fromPeriodInput, activityIncomeInput, activityCostInput]);

  const hasAnyR2Override = !!(
    r2?.payload.overrides?.initialStock != null ||
    r2?.payload.overrides?.baseInflow != null ||
    r2?.payload.overrides?.baseOutflow != null
  );

  const r2SemanticsToShow = r2?.payload.semantics;

  const visionLine = useMemo(() => {
    if (presetFromUrl && !hasR1) {
      return { text: `Vision : ${presetFromUrl.label} (préremplissage)` };
    }
    if (mode === 'custom' && !hasR1) {
      return { text: `Mode : problème personnalisé (vierge)` };
    }
    return null;
  }, [presetFromUrl, hasR1, mode]);

  // 🔹 SAUVEGARDE AUTOMATIQUE DE LA DÉFINITION STRUCTURÉE DU PROBLÈME COURANT
  useEffect(() => {
    try {
      const snapshot: ProblemSnapshotV1 = {
        version: 1,
        savedAtIso: nowIso(),
        stockLabel,
        unit,
        timeUnit: tUnit,
        horizon: horizon ?? null,

        currentInitialStock: currentInitialStock ?? null,
        currentBaseInflow: currentBaseInflow ?? null,
        currentBaseOutflow: currentBaseOutflow ?? null,

        target: (r2?.payload.target ?? safeParseNumber(targetInput)) ?? null,

        r2Semantics: r2?.payload.semantics
          ? {
              flowInLabel,
              inflowMeaning: r2.payload.semantics.inflowMeaning,
              flowOutLabel,
              outflowMeaning: r2.payload.semantics.outflowMeaning,
            }
          : undefined,

        activities: r3s.map((a) => ({
          name: a.payload.name,
          fromPeriod: a.payload.fromPeriod,
          deltaInflow: a.payload.deltaInflow,
          deltaOutflow: a.payload.deltaOutflow,
        })),
      };

      localStorage.setItem(LS_KEY, JSON.stringify(snapshot));
    } catch {
      // silence volontaire : ne pas faire échouer l'UI si le storage est indisponible
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    // dépendances "structurelles" du problème:
    stockLabel,
    unit,
    tUnit,
    horizon,
    currentInitialStock,
    currentBaseInflow,
    currentBaseOutflow,
    targetInput,
    r2?.id,
    r2?.payload.target,
    r2?.payload.semantics,
    r3s,
    flowInLabel,
    flowOutLabel,
  ]);

  return (
    <main style={{ padding: 40, maxWidth: 1100, margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 16 }}>
        <div>
          <h1 style={{ margin: 0 }}>Raffinements</h1>
          <div style={{ marginTop: 6, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link href="/mon-probleme" style={{ textDecoration: 'underline', color: '#2563eb' }}>
              Mon problème (définition longue)
            </Link>
            <Link href="/probleme?type=long" style={{ textDecoration: 'underline', color: '#2563eb' }}>
              Problème préétabli (définition longue)
            </Link>
            <Link href="/methode?type=long" style={{ textDecoration: 'underline', color: '#2563eb' }}>
              Méthode
            </Link>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Link href="/" style={{ textDecoration: 'underline' }}>
            Accueil
          </Link>

          <button onClick={newProblem} style={{ cursor: 'pointer' }}>
            Nouveau problème
          </button>

          <button onClick={() => resetAll(true)} style={{ cursor: 'pointer' }}>
            Tout effacer (mémoire)
          </button>
        </div>
      </header>

      <hr style={{ margin: '18px 0' }} />

      {/* R1 */}
      <section style={{ padding: 16, border: '1px solid #ddd', borderRadius: 10 }}>
        <h2 style={{ marginTop: 0 }}>Raffinement 1 — Structure minimale commune</h2>

        {visionLine && (
          <div style={{ marginTop: 6, marginBottom: 10, color: '#2563eb' }}>
            <b>{visionLine.text}</b>{' '}
            {mode !== 'custom' && (
              <a href="/choisir-vision.html" style={{ marginLeft: 8, textDecoration: 'underline', color: '#2563eb' }}>
                Changer
              </a>
            )}
          </div>
        )}

        {!presetFromUrl && mode !== 'custom' && !hasR1 && (
          <div style={{ marginTop: 6, marginBottom: 10 }}>
            <a href="/choisir-vision.html" style={{ textDecoration: 'underline', color: '#2563eb' }}>
              Choisir une vision (préremplissage)
            </a>
          </div>
        )}

        <p style={{ marginTop: 0, color: '#444' }}>
          Le Raffinement 1 impose une structure commune (stock + flux + horizon). Vous pouvez modifier les noms et les valeurs chiffrées.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={{ display: 'block' }}>Nom du stock principal :</label>
            <input
              value={baseStockName}
              onChange={(e) => setBaseStockName(e.target.value)}
              style={{ display: 'block', width: '100%', marginBottom: 8, padding: 6 }}
              disabled={hasR1}
            />

            <label style={{ display: 'block' }}>Unité du stock :</label>
            <input
              value={stockUnit}
              onChange={(e) => setStockUnit(e.target.value)}
              style={{ display: 'block', width: '100%', marginBottom: 8, padding: 6 }}
              disabled={hasR1}
            />

            <label style={{ display: 'block' }}>Unité de temps :</label>
            <select
              value={timeUnit}
              onChange={(e) => setTimeUnit(e.target.value as TimeUnit)}
              style={{ display: 'block', width: '100%', marginBottom: 8, padding: 6 }}
              disabled={hasR1}
            >
              {(['seconde', 'minute', 'heure', 'jour', 'semaine', 'mois', 'trimestre', 'semestre', 'an'] as TimeUnit[]).map(
                (u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ),
              )}
            </select>

            <label style={{ display: 'block' }}>Horizon :</label>
            <input
              value={horizonInput}
              onChange={(e) => setHorizonInput(e.target.value)}
              style={{ display: 'block', width: '100%', marginBottom: 8, padding: 6 }}
              disabled={hasR1}
            />
          </div>

          <div>
            <label style={{ display: 'block' }}>Nom du flux d’entrée (base) :</label>
            <input
              value={flowInNameInput}
              onChange={(e) => setFlowInNameInput(e.target.value)}
              style={{ display: 'block', width: '100%', marginBottom: 8, padding: 6 }}
              disabled={hasR1}
            />

            <label style={{ display: 'block' }}>Nom du flux de sortie (base) :</label>
            <input
              value={flowOutNameInput}
              onChange={(e) => setFlowOutNameInput(e.target.value)}
              style={{ display: 'block', width: '100%', marginBottom: 8, padding: 6 }}
              disabled={hasR1}
            />
          </div>
        </div>

        <div style={{ marginTop: 12, padding: 12, border: '1px dashed #ddd', borderRadius: 10, color: '#333' }}>
          <p style={{ marginTop: 0, color: '#666' }}>Valeurs chiffrées nécessaires pour produire le premier tableau.</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block' }}>Stock de départ :</label>
              <input
                value={initialStockInput}
                onChange={(e) => setInitialStockInput(e.target.value)}
                style={{ display: 'block', width: '100%', marginBottom: 8, padding: 6 }}
                disabled={hasR1}
                placeholder="ex : 3000"
              />
            </div>

            <div>
              <label style={{ display: 'block' }}>{flowInLabel} de base par période :</label>
              <input
                value={flowInValueInput}
                onChange={(e) => setFlowInValueInput(e.target.value)}
                style={{ display: 'block', width: '100%', marginBottom: 8, padding: 6 }}
                disabled={hasR1}
                placeholder="ex : 3000"
              />

              <label style={{ display: 'block' }}>{flowOutLabel} de base par période :</label>
              <input
                value={flowOutValueInput}
                onChange={(e) => setFlowOutValueInput(e.target.value)}
                style={{ display: 'block', width: '100%', marginBottom: 8, padding: 6 }}
                disabled={hasR1}
                placeholder="ex : 2500"
              />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 10, flexWrap: 'wrap' }}>
          <button
            onClick={addR1}
            disabled={!r1Ready || hasR1}
            style={{ cursor: hasR1 ? 'not-allowed' : 'pointer', padding: '6px 12px' }}
          >
            Valider le Raffinement 1
          </button>

          {!r1StructureOk && <span style={{ color: '#b45309' }}>Veuillez compléter la structure (noms + horizon) pour continuer.</span>}
          {r1StructureOk && !r1NumbersOk && !hasR1 && (
            <span style={{ color: '#b45309' }}>Veuillez renseigner aussi les valeurs chiffrées (stock / encaissements / décaissements).</span>
          )}
          {hasR1 && <span style={{ color: '#166534' }}>R1 validé (lecture seule).</span>}
        </div>

        <Toggle open={showTableR1} setOpen={setShowTableR1} labelOpen="Afficher le tableau du stock" labelClose="Masquer le tableau du stock" />

        {showTableR1 && (
          <TableView
            title="Tableau — modèle courant"
            rows={tableRowsValidated}
            stockLabel={stockLabel}
            flowInLabel={flowInLabel}
            flowOutLabel={flowOutLabel}
            unit={unit}
            horizon={horizon}
            note="Le tableau reflète le modèle courant (et intègre les raffinements validés)."
          />
        )}
      </section>

      {/* R2 */}
      <section style={{ marginTop: 16, padding: 16, border: '1px solid #ddd', borderRadius: 10 }}>
        <h2 style={{ marginTop: 0 }}>Raffinement 2 — Objectif minimal (+ clarification)</h2>

        {!hasR1 ? (
          <p style={{ color: '#666' }}>Veuillez d’abord valider le Raffinement 1.</p>
        ) : (
          <>
            <p style={{ color: '#444', marginTop: 0 }}>
              Objectif sur <b>{stockLabel}</b>, à la fin de l’horizon (<b>{horizon ?? '?'}</b> {tUnit}
              {horizon === 1 ? '' : 's'}).
            </p>

            <label style={{ display: 'block', marginTop: 12 }}>Objectif minimal ({unit}) :</label>
            <input
              value={targetInput}
              onChange={(e) => setTargetInput(e.target.value)}
              style={{ display: 'block', width: '100%', marginBottom: 8, padding: 6 }}
              disabled={hasR2}
            />

            <Toggle
              open={showR2Params}
              setOpen={setShowR2Params}
              labelOpen="Renseigner / ajuster des paramètres (révisables)"
              labelClose="Masquer les paramètres (révisables)"
            />

            {showR2Params && !hasR2 && (
              <div style={{ marginTop: 12, padding: 12, border: '1px dashed #ddd', borderRadius: 10 }}>
                <p style={{ marginTop: 0, color: '#666' }}>
                  Vous pouvez ajuster ces valeurs. Elles sont préremplies avec les valeurs du raffinement précédent.
                </p>

                <label style={{ display: 'block' }}>Stock de départ :</label>
                <input
                  value={r2InitialStockInput}
                  onChange={(e) => setR2InitialStockInput(e.target.value)}
                  style={{ width: '100%', padding: 6, marginBottom: 8 }}
                />

                <label style={{ display: 'block' }}>{flowInLabel} base par période :</label>
                <input
                  value={r2BaseInflowInput}
                  onChange={(e) => setR2BaseInflowInput(e.target.value)}
                  style={{ width: '100%', padding: 6, marginBottom: 8 }}
                />

                <label style={{ display: 'block' }}>{flowOutLabel} base par période :</label>
                <input
                  value={r2BaseOutflowInput}
                  onChange={(e) => setR2BaseOutflowInput(e.target.value)}
                  style={{ width: '100%', padding: 6 }}
                />
              </div>
            )}

            <Toggle
              open={showR2Clarification}
              setOpen={setShowR2Clarification}
              labelOpen={hasR2 ? 'Afficher la clarification (R2)' : 'Ajouter une clarification — ex : encaissements = salaire'}
              labelClose="Masquer la clarification (R2)"
            />

            {showR2Clarification && (
              <div style={{ marginTop: 12, padding: 12, border: '1px solid #eee', borderRadius: 10 }}>
                <p style={{ marginTop: 0, color: '#666' }}>Clarification du sens des flux.</p>

                {!hasR2 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={{ display: 'block' }}>{flowInLabel} =</label>
                      <input
                        value={r2InflowMeaning}
                        onChange={(e) => setR2InflowMeaning(e.target.value)}
                        style={{ width: '100%', padding: 6 }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block' }}>{flowOutLabel} =</label>
                      <input
                        value={r2OutflowMeaning}
                        onChange={(e) => setR2OutflowMeaning(e.target.value)}
                        style={{ width: '100%', padding: 6 }}
                      />
                    </div>
                  </div>
                ) : (
                  <div style={{ marginTop: 8, color: '#333' }}>
                    {r2?.payload.semantics ? (
                      <>
                        <div>
                          {flowInLabel} = <b>{r2.payload.semantics.inflowMeaning}</b>
                        </div>
                        <div>
                          {flowOutLabel} = <b>{r2.payload.semantics.outflowMeaning}</b>
                        </div>
                      </>
                    ) : (
                      <p style={{ color: '#666' }}>Aucune clarification enregistrée dans R2.</p>
                    )}
                  </div>
                )}
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 10, flexWrap: 'wrap' }}>
              <button
                onClick={addR2Objectif}
                disabled={hasR2 || safeParseNumber(targetInput) === null}
                style={{ cursor: hasR2 ? 'not-allowed' : 'pointer', padding: '6px 12px' }}
              >
                Valider le Raffinement 2 (objectif)
              </button>

              {!hasR2 && safeParseNumber(targetInput) === null && (
                <span style={{ color: '#b45309' }}>Veuillez entrer une valeur numérique pour l’objectif.</span>
              )}

              {hasR2 && <span style={{ marginTop: 2, color: '#166534' }}>R2 validé (lecture seule).</span>}
            </div>

            <ObjectivePanel
              unit={unit}
              stockFinal={stockFinalValidated}
              target={targetPreview}
              modeLabel={!hasR2 ? 'Prévisualisation (avant validation)' : undefined}
            />

            <Toggle open={showTableR2} setOpen={setShowTableR2} labelOpen="Afficher le tableau du stock" labelClose="Masquer le tableau du stock" />

            {showTableR2 && (
              <TableView
                title="Tableau — modèle courant"
                rows={tableRowsValidated}
                stockLabel={stockLabel}
                flowInLabel={flowInLabel}
                flowOutLabel={flowOutLabel}
                unit={unit}
                horizon={horizon}
                note={!hasR2 && r2OverridesDraft ? 'Prévisualisation : inclut les paramètres révisés (non validés).' : undefined}
              />
            )}
          </>
        )}
      </section>

      {/* R3 */}
      <section style={{ marginTop: 16, padding: 16, border: '1px solid #ddd', borderRadius: 10 }}>
        <h2 style={{ marginTop: 0 }}>Raffinement 3 — Activité ajoutée</h2>

        {!hasR1 ? (
          <p style={{ color: '#666' }}>Veuillez d’abord valider le Raffinement 1.</p>
        ) : !hasR2 ? (
          <p style={{ color: '#666' }}>Veuillez d’abord valider le Raffinement 2 (objectif).</p>
        ) : (
          <>
            <p style={{ color: '#444', marginTop: 0 }}>
              Une activité ajoute des revenus et/ou des dépenses supplémentaires à partir d’une période donnée (jusqu’à la fin).
            </p>

            <BaseParamsSummary
              unit={unit}
              timeUnit={tUnit}
              stockLabel={stockLabel}
              flowInLabel={flowInLabel}
              flowOutLabel={flowOutLabel}
              initialStock={currentInitialStock}
              baseInflow={currentBaseInflow}
              baseOutflow={currentBaseOutflow}
              hasOverrides={hasAnyR2Override}
              r2Semantics={r2SemanticsToShow}
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 12 }}>
              <div>
                <label style={{ display: 'block' }}>Nom de l’activité :</label>
                <input
                  value={activityNameInput}
                  onChange={(e) => setActivityNameInput(e.target.value)}
                  style={{ display: 'block', width: '100%', marginBottom: 10, padding: 6 }}
                />

                <label style={{ display: 'block' }}>À partir de la période (1..{horizon ?? '?'}) :</label>
                <input
                  value={fromPeriodInput}
                  onChange={(e) => setFromPeriodInput(e.target.value)}
                  style={{ display: 'block', width: '100%', marginBottom: 10, padding: 6 }}
                />
              </div>

              <div>
                <label style={{ display: 'block' }}>
                  Revenu {tUnit} (ajout aux {flowInLabel}) :
                </label>
                <input
                  value={activityIncomeInput}
                  onChange={(e) => setActivityIncomeInput(e.target.value)}
                  style={{ display: 'block', width: '100%', marginBottom: 10, padding: 6 }}
                />

                <label style={{ display: 'block' }}>
                  Dépenses {tUnit} (ajout aux {flowOutLabel}) :
                </label>
                <input
                  value={activityCostInput}
                  onChange={(e) => setActivityCostInput(e.target.value)}
                  style={{ display: 'block', width: '100%', marginBottom: 10, padding: 6 }}
                />
              </div>
            </div>

            <Toggle open={showR3Clarification} setOpen={setShowR3Clarification} labelOpen="Afficher la clarification (R3)" labelClose="Masquer la clarification (R3)" />

            {showR3Clarification && (
              <div style={{ marginTop: 12, padding: 12, border: '1px solid #eee', borderRadius: 10 }}>
                <p style={{ marginTop: 0, color: '#666' }}>Clarification des ajouts apportés par l’activité.</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block' }}>Ajout aux {flowInLabel} =</label>
                    <input value={r3InflowMeaning} onChange={(e) => setR3InflowMeaning(e.target.value)} style={{ width: '100%', padding: 6 }} />
                  </div>
                  <div>
                    <label style={{ display: 'block' }}>Ajout aux {flowOutLabel} =</label>
                    <input value={r3OutflowMeaning} onChange={(e) => setR3OutflowMeaning(e.target.value)} style={{ width: '100%', padding: 6 }} />
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={addR3Activite}
                disabled={!r3Ready}
                style={{ cursor: r3Ready ? 'pointer' : 'not-allowed', marginTop: 8, padding: '6px 12px' }}
              >
                Ajouter et valider le Raffinement 3 (activité)
              </button>
              {!r3Ready && (
                <span style={{ marginTop: 8, color: '#b45309' }}>Veuillez compléter le nom, la période et les valeurs numériques.</span>
              )}
            </div>

            <ObjectivePanel
              unit={unit}
              stockFinal={pendingR3 ? stockFinalPreview : stockFinalValidated}
              target={r2?.payload.target ?? null}
              modeLabel={pendingR3 ? 'Prévisualisation (activité non validée incluse)' : undefined}
            />

            <Toggle
              open={showTableR3Preview}
              setOpen={setShowTableR3Preview}
              labelOpen="Afficher le tableau du stock (prévisualisation)"
              labelClose="Masquer le tableau du stock (prévisualisation)"
            />

            {showTableR3Preview && (
              <TableView
                title="Tableau — prévisualisation"
                rows={tableRowsPreview}
                stockLabel={stockLabel}
                flowInLabel={flowInLabel}
                flowOutLabel={flowOutLabel}
                unit={unit}
                horizon={horizon}
                note={pendingR3 ? 'Inclut l’activité en cours (non validée).' : 'Champs incomplets : la prévisualisation correspond au modèle validé.'}
              />
            )}

            <Toggle
              open={showTableR3Validated}
              setOpen={setShowTableR3Validated}
              labelOpen="Afficher le tableau du stock (modèle validé)"
              labelClose="Masquer le tableau du stock (modèle validé)"
            />

            {showTableR3Validated && (
              <TableView
                title="Tableau — modèle validé"
                rows={tableRowsValidated}
                stockLabel={stockLabel}
                flowInLabel={flowInLabel}
                flowOutLabel={flowOutLabel}
                unit={unit}
                horizon={horizon}
                note="Exclut l’activité en cours tant qu’elle n’est pas validée."
              />
            )}
          </>
        )}
      </section>

      <footer style={{ marginTop: 24, color: '#666' }}>
        <div>Méthode top-down : Problème → Visions → Raffinements. Une fois validé : lecture seule.</div>
      </footer>
    </main>
  );
}

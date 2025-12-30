'use client';

import HelpPanel from "../components/HelpPanel";
import React, { useEffect, useMemo, useState } from "react";

type SnapshotV1 = {
  version: 1;
  savedAtIso: string;

  defShortVision: string;
  defLongVision: string;

  stockLabel: string;     // "Trésorerie"
  unit: string;           // "euros"
  horizon: number;        // 12 (fixe)
  flowInLabel: string;    // "Encaissements"
  flowOutLabel: string;   // "Décaissements"

  // Paramètre fixé (dès le départ)
  initialStock: number;

  // R1/R2 : valeurs libres (exploration)
  r1_inflow: number;
  r1_outflow: number;

  // Objectif (fixe pour l’exemple)
  target: number;

  // Paramètres fixes (réalité)
  salary: number;
  personalExpenses: number;

  // Activité (fixe par vision)
  addInflowLabel: string;
  addOutflowLabel: string;
  addInflow: number;
  addOutflow: number;
  addFromPeriod: number;

  visionIndex: 0 | 1 | 2; // 0=>Vision1, 1=>Vision2, 2=>Vision3
  visionLabel: string;
};

type ReadingMode = "simple" | "details";

const C = {
  text: "#111",
  secondary: "#444",
  hint: "#666",
  border: "#ddd",
  softBorder: "#eee",
  link: "#0b5fff",
  ok: "#166534",
  bad: "#b91c1c",
  bgDisabled: "#f3f4f6",
};

const toNumber = (s: string) => {
  const x = Number(String(s).replace(",", "."));
  return Number.isFinite(x) ? x : NaN;
};

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
  const rows: Array<{ t: number; stockStart: number; inflow: number; outflow: number; stockEnd: number }> = [];
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
    <section style={{ border: `1px solid ${C.border}`, borderRadius: 12, padding: 16, marginTop: 14 }}>
      <h2 style={{ marginTop: 0, color: C.text }}>{title}</h2>
      {children}
    </section>
  );
}

function ContinueBar({ onContinue, disabled }: { onContinue: () => void; disabled?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 12 }}>
      <button
        onClick={onContinue}
        disabled={!!disabled}
        style={{
          padding: "10px 16px",
          borderRadius: 10,
          border: `1px solid ${C.border}`,
          background: disabled ? C.bgDisabled : "white",
          cursor: disabled ? "not-allowed" : "pointer",
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
  disabled = false,
  placeholder,
}: {
  label: string;
  value: string | number;
  onChange: (v: string) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 10, maxWidth: 460, opacity: disabled ? 0.75 : 1 }}>
      <div style={{ fontSize: 14, color: C.text }}>{label}</div>
      <input
        value={String(value)}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        style={{
          padding: "9px 10px",
          borderRadius: 10,
          border: `1px solid ${C.border}`,
          fontSize: 15,
          width: "100%",
          color: C.text,
        }}
      />
    </div>
  );
}

function TableAlwaysVisible({
  rows,
  stockLabel,
  flowInLabel,
  flowOutLabel,
}: {
  rows: Array<{ t: number; stockStart: number; inflow: number; outflow: number; stockEnd: number }>;
  stockLabel: string;
  flowInLabel: string;
  flowOutLabel: string;
}) {
  return (
    <div style={{ overflowX: "auto", marginTop: 12 }}>
      <table style={{ borderCollapse: "collapse", minWidth: 860 }}>
        <thead>
          <tr>
            <th style={{ border: `1px solid ${C.border}`, padding: 8, textAlign: "left" }}>Période</th>
            <th style={{ border: `1px solid ${C.border}`, padding: 8, textAlign: "left" }}>{stockLabel} début</th>
            <th style={{ border: `1px solid ${C.border}`, padding: 8, textAlign: "left" }}>{flowInLabel}</th>
            <th style={{ border: `1px solid ${C.border}`, padding: 8, textAlign: "left" }}>{flowOutLabel}</th>
            <th style={{ border: `1px solid ${C.border}`, padding: 8, textAlign: "left" }}>{stockLabel} fin</th>
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

function ReadingModeBar({
  mode,
  setMode,
}: {
  mode: ReadingMode;
  setMode: (m: ReadingMode) => void;
}) {
  const btn = (active: boolean): React.CSSProperties => ({
    padding: "8px 10px",
    borderRadius: 10,
    border: `1px solid ${C.border}`,
    background: active ? "#f3f4f6" : "white",
    cursor: "pointer",
    fontSize: 14,
    color: C.text,
  });

  return (
    <div
      style={{
        marginTop: 10,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 12,
        padding: 10,
        border: `1px solid ${C.softBorder}`,
        borderRadius: 12,
      }}
    >
      <div style={{ fontSize: 14, color: C.secondary, lineHeight: 1.4 }}>
        <b>Mode</b> :{" "}
        {mode === "simple"
          ? "Simple (sans équations)"
          : "Détails (avec équations)"}{" "}
        — vous pouvez changer à tout moment.
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button style={btn(mode === "simple")} onClick={() => setMode("simple")}>
          Simple
        </button>
        <button style={btn(mode === "details")} onClick={() => setMode("details")}>
          Détails
        </button>
      </div>
    </div>
  );
}

function DetailsOnly({ mode, children }: { mode: ReadingMode; children: React.ReactNode }) {
  if (mode !== "details") return null;
  return <>{children}</>;
}

function BaseEquation({ mode }: { mode: ReadingMode }) {
  return (
    <DetailsOnly mode={mode}>
      <div style={{ padding: 12, border: `1px solid ${C.softBorder}`, borderRadius: 12, marginTop: 12 }}>
        <b>Équation de base (toujours valable)</b>
        <div style={{ marginTop: 6 }}>
          <b>trésorerie fin</b> = <b>trésorerie début</b> + <b>encaissements</b> − <b>décaissements</b>
        </div>
      </div>
    </DetailsOnly>
  );
}

// Paramètre FIXE du problème
const TRESORERIE_DEPART_FIXE = 3000;

function defaultSnapshot(): SnapshotV1 {
  return {
    version: 1,
    savedAtIso: new Date().toISOString(),

    defShortVision: "Je reste salarié avec un revenu stable et des dépenses maîtrisées.",
    defLongVision:
      "Dans cette vision, je garde mon activité salariée avec un salaire de 3000 € et des dépenses mensuelles de 2500 €. Je veux vérifier si cette situation permet d’atteindre un objectif minimal de trésorerie (10 000 €) dans 12 mois.",

    stockLabel: "Trésorerie",
    unit: "euros",
    horizon: 12,
    flowInLabel: "Encaissements",
    flowOutLabel: "Décaissements",

    initialStock: TRESORERIE_DEPART_FIXE,

    r1_inflow: 3000,
    r1_outflow: 2500,

    target: 10000,

    salary: 3000,
    personalExpenses: 2500,

    addInflowLabel: "Revenu d'activité",
    addOutflowLabel: "Dépenses d'activité",
    addInflow: 0,
    addOutflow: 0,
    addFromPeriod: 1,

    visionIndex: 0,
    visionLabel: "Vision 1 — Rester salarié",
  };
}

// Met à jour l’URL pour rester cohérent avec la vision affichée
function setVisionInUrl(visionIndex: 0 | 1 | 2) {
  const q = visionIndex === 0 ? "1" : visionIndex === 1 ? "2" : "3";
  const url = new URL(window.location.href);
  url.searchParams.set("vision", q);
  window.history.replaceState({}, "", url.toString());
}

export default function ParcoursPage() {
  const [step, setStep] = useState(0); // 0 vision, 1 R1, 2 R2, 3 R3
  const [snap, setSnap] = useState<SnapshotV1>(() => defaultSnapshot());

  const [readingMode, setReadingMode] = useState<ReadingMode>("simple");

  // Drafts R1 (pour pouvoir effacer/retaper) — uniquement flux libres
  const [inDraft, setInDraft] = useState("3000");
  const [outDraft, setOutDraft] = useState("2500");

  const LOCK_STRUCTURE = true;

  function syncDraftsFrom(s: SnapshotV1) {
    setInDraft(String(s.r1_inflow));
    setOutDraft(String(s.r1_outflow));
  }

  function applyVision(idx: 0 | 1 | 2) {
    // ✅ important : garder l’URL cohérente avec l’état
    setVisionInUrl(idx);

    if (idx === 0) {
      const v: SnapshotV1 = {
        ...defaultSnapshot(),
        visionIndex: 0,
        visionLabel: "Vision 1 — Rester salarié",
        defShortVision: "Je reste salarié.",
        defLongVision:
          "Je garde mon salaire et mes dépenses personnelles. Je vérifie si l’objectif minimal est atteignable.",
        addInflow: 0,
        addOutflow: 0,
        addFromPeriod: 1,
      };
      setSnap(v);
      syncDraftsFrom(v);
      setStep(0);
      return;
    }

    if (idx === 1) {
      const v: SnapshotV1 = {
        ...defaultSnapshot(),
        visionIndex: 1,
        visionLabel: "Vision 2 — Micro-activité (objectif tôt)",
        defShortVision: "Je reste salarié et j’ajoute une micro-activité.",
        defLongVision:
          "J’introduis tôt l’objectif minimal, puis je fixe les paramètres de l’exemple (salaire, dépenses, activité).",
        addInflow: 1000,
        addOutflow: 500,
        addFromPeriod: 1,
      };
      setSnap(v);
      syncDraftsFrom(v);
      setStep(0);
      return;
    }

    const v: SnapshotV1 = {
      ...defaultSnapshot(),
      visionIndex: 2,
      visionLabel: "Vision 3 — Micro-activité (objectif tard)",
      defShortVision: "Je regarde d’abord la réalité, puis je compare à l’objectif.",
      defLongVision:
        "Je fixe d’abord les paramètres de l’exemple (réalité), puis j’introduis l’objectif minimal seulement après.",
      addInflow: 1000,
      addOutflow: 500,
      addFromPeriod: 1,
    };
    setSnap(v);
    syncDraftsFrom(v);
    setStep(0);
  }

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const v = params.get("vision");
      if (v) {
        const n = Number(v);
        const idx = n === 2 ? 1 : n === 3 ? 2 : 0;
        applyVision(idx as 0 | 1 | 2);
        return;
      }
    } catch {
      // ignore
    }
    applyVision(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    if (snap.visionIndex === 0) {
      return computeTable({
        initialStock: snap.initialStock,
        horizon: snap.horizon,
        baseInflow: snap.salary,
        baseOutflow: snap.personalExpenses,
      });
    }

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
    snap.visionIndex,
    snap.initialStock,
    snap.horizon,
    snap.salary,
    snap.personalExpenses,
    snap.addFromPeriod,
    snap.addInflow,
    snap.addOutflow,
  ]);

  const atteintR2 = tableR1R2.stockFinal - snap.target >= 0;
  const atteintR3 = tableR3.stockFinal - snap.target >= 0;

  function goBack() {
    if (step === 0) {
      window.location.href = "/choisir-vision";
      return;
    }
    setStep((s) => Math.max(0, s - 1));
  }

  function onContinue() {
    if (step === 3) {
      if (snap.visionIndex < 2) {
        applyVision((snap.visionIndex + 1) as 1 | 2);
        return;
      }
      window.location.href = "/";
      return;
    }
    setStep((s) => Math.min(3, s + 1));
  }

  function onChangeIn(v: string) {
    setInDraft(v);
    const n = toNumber(v);
    if (Number.isFinite(n)) setSnap((p) => ({ ...p, r1_inflow: n }));
  }
  function onChangeOut(v: string) {
    setOutDraft(v);
    const n = toNumber(v);
    if (Number.isFinite(n)) setSnap((p) => ({ ...p, r1_outflow: n }));
  }

  function helpTitle() {
    const s = step === 0 ? "Vision" : step === 1 ? "R1" : step === 2 ? "R2" : "R3";
    return `Aide — ${snap.visionLabel} — ${s}`;
  }

  const showObjectiveInR2 = snap.visionIndex !== 2; // Vision 3 : objectif tard
  const showObjectiveInR3 = true;

  const showModeBar = step === 1 || step === 2 || step === 3;

  return (
    <main style={{ padding: 40, maxWidth: 980, margin: "0 auto", fontFamily: "system-ui, sans-serif", color: C.text }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
        <h1 style={{ margin: 0 }}>{snap.visionLabel}</h1>

        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <a href="/" style={{ fontSize: 14, color: C.link, textDecoration: "underline" }}>Accueil</a>
          <a
            href="#"
            onClick={(e) => { e.preventDefault(); goBack(); }}
            style={{ fontSize: 14, color: C.link, textDecoration: "underline" }}
          >
            Revenir
          </a>
        </div>
      </div>

      {showModeBar && <ReadingModeBar mode={readingMode} setMode={setReadingMode} />}

      {step === 0 && (
        <Card title="Définition de la vision (langage courant)">
          <HelpPanel title={helpTitle()}>
            <p style={{ marginTop: 0 }}>
              Une vision décrit une façon d’aborder le problème. Ensuite, les raffinements rendent le raisonnement explicite.
            </p>
            <p style={{ marginBottom: 0 }}>
              Cliquez sur <b>Continuer</b> pour passer à R1.
            </p>
          </HelpPanel>

          <ContinueBar onContinue={onContinue} />

          <div style={{ padding: 12, border: `1px solid ${C.softBorder}`, borderRadius: 12, marginTop: 12 }}>
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
        <Card title="R1 — Mécanique du stock (valeurs libres)">
          <HelpPanel title={helpTitle()}>
            <p style={{ marginTop: 0 }}>
              R1 sert à comprendre la mécanique : un stock évolue sous l’effet de deux flux.
            </p>
            <p style={{ marginBottom: 0 }}>
              Ici, on laisse libres <b>encaissements</b> et <b>décaissements</b> pour voir l’effet sur la trésorerie.
            </p>
          </HelpPanel>

          <ContinueBar onContinue={onContinue} />

          {/* ✅ Toujours l’équation de base en mode Détails */}
          <BaseEquation mode={readingMode} />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginTop: 8 }}>
            <div>
              <InputRow label="Nom du stock" value={snap.stockLabel} disabled={LOCK_STRUCTURE} onChange={() => {}} />
              <InputRow label="Unité" value={snap.unit} disabled={LOCK_STRUCTURE} onChange={() => {}} />
              <InputRow label="Horizon (nombre de périodes)" value={snap.horizon} disabled={true} onChange={() => {}} />
              <InputRow label="Nom du flux d’entrée" value={snap.flowInLabel} disabled={LOCK_STRUCTURE} onChange={() => {}} />
              <InputRow label="Nom du flux de sortie" value={snap.flowOutLabel} disabled={LOCK_STRUCTURE} onChange={() => {}} />
            </div>

            <div>
              <InputRow label="Trésorerie au départ (fixée)" value={snap.initialStock} disabled={true} onChange={() => {}} />
              <InputRow label="Encaissements (par période) — libre" value={inDraft} disabled={false} onChange={onChangeIn} placeholder="ex. 3000" />
              <InputRow label="Décaissements (par période) — libre" value={outDraft} disabled={false} onChange={onChangeOut} placeholder="ex. 2500" />
            </div>
          </div>

          <TableAlwaysVisible rows={tableR1R2.rows} stockLabel={snap.stockLabel} flowInLabel={snap.flowInLabel} flowOutLabel={snap.flowOutLabel} />

          <ContinueBar onContinue={onContinue} />
        </Card>
      )}

      {step === 2 && (
        <Card title={snap.visionIndex === 2 ? "R2 — Réalité (paramètres fixés, sans objectif)" : "R2 — Objectif minimal (paramètres encore libres)"}>
          <HelpPanel title={helpTitle()}>
            {snap.visionIndex === 2 ? (
              <>
                <p style={{ marginTop: 0 }}>
                  Vision 3 : on fixe d’abord la réalité (paramètres), puis on introduit l’objectif seulement après.
                </p>
                <p style={{ marginBottom: 0 }}>
                  Ici, <b>pas d’objectif</b> : on prépare la comparaison.
                </p>
              </>
            ) : (
              <>
                <p style={{ marginTop: 0 }}>
                  On introduit l’objectif minimal : c’est une boussole qui resserre l’étude.
                </p>
                <p style={{ marginBottom: 0 }}>
                  Les flux restent libres ici : on peut déjà voir quelles combinaisons atteignent l’objectif.
                </p>
              </>
            )}
          </HelpPanel>

          <ContinueBar onContinue={onContinue} />

          {/* ✅ Toujours l’équation de base en mode Détails */}
          <BaseEquation mode={readingMode} />

          {showObjectiveInR2 && (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginTop: 8 }}>
  <InputRow
    label="Trésorerie au départ (fixée)"
    value={snap.initialStock}
    disabled={true}
    onChange={() => {}}
  />
  <InputRow
    label="Objectif minimal (fixe)"
    value={snap.target}
    disabled={true}
    onChange={() => {}}
  />

  {/* ✅ R2 : les flux restent libres (Vision 1 et Vision 2) */}
  <InputRow
    label="Encaissements (par période) — libre"
    value={inDraft}
    disabled={false}
    onChange={onChangeIn}
    placeholder="ex. 3000"
  />
  <InputRow
    label="Décaissements (par période) — libre"
    value={outDraft}
    disabled={false}
    onChange={onChangeOut}
    placeholder="ex. 2500"
  />
</div>


              <div style={{ marginTop: 12, padding: 12, border: `1px solid ${C.softBorder}`, borderRadius: 12 }}>
                Stock final (R1/R2) : <b>{fmt(tableR1R2.stockFinal)}</b> {snap.unit} —{" "}
                <b style={{ color: atteintR2 ? C.ok : C.bad }}>{atteintR2 ? "objectif atteint" : "objectif non atteint"}</b>
              </div>

              <TableAlwaysVisible rows={tableR1R2.rows} stockLabel={snap.stockLabel} flowInLabel={snap.flowInLabel} flowOutLabel={snap.flowOutLabel} />
            </>
          )}

          {snap.visionIndex === 2 && (
            <>
              <DetailsOnly mode={readingMode}>
                <div style={{ padding: 12, border: `1px solid ${C.softBorder}`, borderRadius: 12, marginTop: 12, lineHeight: 1.6 }}>
                  <b>Paramètres fixés (réalité de l’exemple)</b>
                  <div>encaissements = salaire + revenu d’activité</div>
                  <div>décaissements = dépenses personnelles + dépenses d’activité</div>
                </div>
              </DetailsOnly>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginTop: 8 }}>
                <InputRow label="Trésorerie au départ (fixée)" value={snap.initialStock} disabled={true} onChange={() => {}} />
                <InputRow label="Salaire mensuel (fixe)" value={snap.salary} disabled={true} onChange={() => {}} />
                <InputRow label="Dépenses personnelles mensuelles (fixes)" value={snap.personalExpenses} disabled={true} onChange={() => {}} />
                <InputRow label="Revenu d’activité (fixe)" value={snap.addInflow} disabled={true} onChange={() => {}} />
                <InputRow label="Dépenses d’activité (fixes)" value={snap.addOutflow} disabled={true} onChange={() => {}} />
              </div>

              <div style={{ marginTop: 12, padding: 12, border: `1px solid ${C.softBorder}`, borderRadius: 12 }}>
                (On introduira l’objectif à l’étape suivante.)
              </div>
            </>
          )}

          <ContinueBar onContinue={onContinue} />
        </Card>
      )}

      {step === 3 && (
        <Card title="R3 — Paramètres fixés + comparaison à l’objectif">
          <HelpPanel title={helpTitle()}>
            <p style={{ marginTop: 0 }}>
              Ici, on fixe les paramètres de l’exemple (réalité) et on compare à l’objectif minimal.
            </p>
            <p style={{ marginBottom: 0 }}>
              L’équation de base reste la même.
            </p>
          </HelpPanel>

          <ContinueBar onContinue={onContinue} />

          {/* ✅ Toujours l’équation de base en mode Détails */}
          <BaseEquation mode={readingMode} />

          <DetailsOnly mode={readingMode}>
            <div style={{ padding: 12, border: `1px solid ${C.softBorder}`, borderRadius: 12, marginTop: 12, lineHeight: 1.6 }}>
              <b>Paramètres fixés (réalité de l’exemple)</b>
              {snap.visionIndex === 0 ? (
                <>
                  <div>encaissements = salaire</div>
                  <div>décaissements = dépenses personnelles</div>
                </>
              ) : (
                <>
                  <div>encaissements = salaire + revenu d’activité</div>
                  <div>décaissements = dépenses personnelles + dépenses d’activité</div>
                </>
              )}
            </div>
          </DetailsOnly>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginTop: 8 }}>
            <InputRow label="Trésorerie au départ (fixée)" value={snap.initialStock} disabled={true} onChange={() => {}} />
            {showObjectiveInR3 && <InputRow label="Objectif minimal (fixe)" value={snap.target} disabled={true} onChange={() => {}} />}
            <InputRow label="Salaire mensuel (fixe)" value={snap.salary} disabled={true} onChange={() => {}} />
            <InputRow label="Dépenses personnelles mensuelles (fixes)" value={snap.personalExpenses} disabled={true} onChange={() => {}} />

            {snap.visionIndex !== 0 && (
              <>
                <InputRow label="Revenu d’activité (fixe)" value={snap.addInflow} disabled={true} onChange={() => {}} />
                <InputRow label="Dépenses d’activité (fixes)" value={snap.addOutflow} disabled={true} onChange={() => {}} />
              </>
            )}
          </div>

          <div style={{ marginTop: 12, padding: 12, border: `1px solid ${C.softBorder}`, borderRadius: 12 }}>
            Stock final (R3) : <b>{fmt(tableR3.stockFinal)}</b> {snap.unit} —{" "}
            <b style={{ color: atteintR3 ? C.ok : C.bad }}>{atteintR3 ? "objectif atteint" : "objectif non atteint"}</b>
          </div>

          <TableAlwaysVisible rows={tableR3.rows} stockLabel={snap.stockLabel} flowInLabel={snap.flowInLabel} flowOutLabel={snap.flowOutLabel} />

          <ContinueBar onContinue={onContinue} />
        </Card>
      )}
    </main>
  );
}

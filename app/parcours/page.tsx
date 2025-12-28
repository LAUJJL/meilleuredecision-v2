'use client';

import HelpPanel from "../components/HelpPanel";
import React, { useEffect, useMemo, useState } from "react";
import { ReadingModeBar, DetailsOnly } from "../components/readingMode";

type SnapshotV1 = {
  version: 1;
  savedAtIso: string;

  defShortVision: string;
  defLongVision: string;

  stockLabel: string;
  unit: string;
  horizon: number;
  flowInLabel: string;
  flowOutLabel: string;

  // Paramètres libres (R1 et parfois R2)
  initialStock: number;
  r1_inflow: number;
  r1_outflow: number;

  // Objectif (valeur fixée, introduite tôt ou tard selon la vision)
  target: number;

  // Paramètres fixés (cas présenté) utilisés en R2 (Vision 3) et/ou R3
  fixedInitialStock: number;
  fixedInflow: number;
  fixedOutflow: number;

  // Explication “métier” des flux (pour les détails)
  fixedInflowMeaning: string;   // ex: "salaire mensuel"
  fixedOutflowMeaning: string;  // ex: "dépenses personnelles"

  visionIndex: 0 | 1 | 2;
  visionLabel: string;
};

const C = {
  text: "#111",
  secondary: "#444",
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
  inflow,
  outflow,
}: {
  initialStock: number;
  horizon: number;
  inflow: number;
  outflow: number;
}) {
  const rows: Array<{ t: number; stockStart: number; inflow: number; outflow: number; stockEnd: number }> = [];
  let stock = initialStock;

  for (let t = 1; t <= horizon; t++) {
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
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 6,
        marginTop: 10,
        maxWidth: 460,
        opacity: disabled ? 0.75 : 1,
      }}
    >
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

function defaultSnapshot(): SnapshotV1 {
  return {
    version: 1,
    savedAtIso: new Date().toISOString(),

    defShortVision: "Je reste salarié.",
    defLongVision:
      "Je reste salarié avec un salaire et des dépenses personnelles. L’objectif est d’évaluer si cette situation permet d’atteindre un objectif de trésorerie dans un horizon donné.",

    stockLabel: "Trésorerie",
    unit: "euros",
    horizon: 12,
    flowInLabel: "Encaissements",
    flowOutLabel: "Décaissements",

    initialStock: 3000,
    r1_inflow: 3000,
    r1_outflow: 2500,

    target: 10000,

    // Paramètres fixés (cas présenté)
    fixedInitialStock: 3000,
    fixedInflow: 3000,
    fixedOutflow: 2500,
    fixedInflowMeaning: "salaire mensuel",
    fixedOutflowMeaning: "dépenses personnelles",

    visionIndex: 0,
    visionLabel: "Vision 1 — Rester salarié",
  };
}

export default function ParcoursPage() {
  const [step, setStep] = useState(0); // 0 Vision, 1 R1, 2 R2, 3 R3
  const [snap, setSnap] = useState<SnapshotV1>(() => defaultSnapshot());

  // Drafts pour permettre effacement / saisie libre
  const [stockDraft, setStockDraft] = useState("3000");
  const [inDraft, setInDraft] = useState("3000");
  const [outDraft, setOutDraft] = useState("2500");

  const LOCK_STRUCTURE = true;

  function syncDraftsFrom(s: SnapshotV1) {
    setStockDraft(String(s.initialStock));
    setInDraft(String(s.r1_inflow));
    setOutDraft(String(s.r1_outflow));
  }

  function applyVision(idx: 0 | 1 | 2) {
    if (idx === 0) {
      const v: SnapshotV1 = {
        ...defaultSnapshot(),
        visionIndex: 0,
        visionLabel: "Vision 1 — Rester salarié",
        defShortVision: "Je reste salarié.",
        defLongVision:
          "Je reste salarié avec un salaire et des dépenses personnelles. L’objectif est d’évaluer si cette situation permet d’atteindre un objectif de trésorerie dans un horizon donné.",
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
        visionLabel: "Vision 2 — Objectif introduit tôt",
        defShortVision: "Objectif introduit tôt.",
        defLongVision:
          "On introduit l’objectif dès R2 : on obtient tôt un diagnostic (objectif atteint / non atteint), puis on précise ensuite les paramètres (R3).",
      };
      setSnap(v);
      syncDraftsFrom(v);
      setStep(0);
      return;
    }

    const v: SnapshotV1 = {
      ...defaultSnapshot(),
      visionIndex: 2,
      visionLabel: "Vision 3 — Objectif introduit tard",
      defShortVision: "Objectif introduit tard.",
      defLongVision:
        "On commence par fixer la réalité (stock de départ, encaissements, décaissements) sans parler d’objectif. L’objectif n’est introduit qu’en R3 : on juge ensuite si la réalité permet de l’atteindre.",
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

  // Tables
  const tableFree = useMemo(
    () =>
      computeTable({
        initialStock: snap.initialStock,
        horizon: snap.horizon,
        inflow: snap.r1_inflow,
        outflow: snap.r1_outflow,
      }),
    [snap.initialStock, snap.horizon, snap.r1_inflow, snap.r1_outflow]
  );

  const tableFixed = useMemo(
    () =>
      computeTable({
        initialStock: snap.fixedInitialStock,
        horizon: snap.horizon,
        inflow: snap.fixedInflow,
        outflow: snap.fixedOutflow,
      }),
    [snap.fixedInitialStock, snap.horizon, snap.fixedInflow, snap.fixedOutflow]
  );

  // Diagnostics
  const atteintR2_V1V2 = tableFree.stockFinal - snap.target >= 0;
  const atteintR3_V1V2 = tableFixed.stockFinal - snap.target >= 0;
  const atteintR3_V3 = tableFixed.stockFinal - snap.target >= 0;

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

  // Handlers paramètres libres
  function onChangeStock(v: string) {
    setStockDraft(v);
    const n = toNumber(v);
    if (Number.isFinite(n)) setSnap((p) => ({ ...p, initialStock: n }));
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

      {showModeBar && <ReadingModeBar />}

      {/* STEP 0 */}
      {step === 0 && (
        <Card title="Définition de la vision (langage courant)">
          <HelpPanel title={helpTitle()}>
            <p style={{ marginTop: 0 }}>
              Les visions se distinguent par <b>l’ordre</b> dans lequel on fixe les éléments (objectif tôt ou tard).
            </p>
            <p style={{ marginBottom: 0 }}>
              <b>Note :</b> l’étape <b>R1</b> est un point de départ <b>identique</b> quelle que soit la vision.
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

      {/* STEP 1 */}
      {step === 1 && (
        <Card title="R1 — Mécanique du stock (paramètres libres)">
          <HelpPanel title={helpTitle()}>
            <p style={{ marginTop: 0 }}>
              R1 est un <b>point de départ commun</b> à toutes les visions : les paramètres sont <b>libres</b>.
            </p>
            <p style={{ marginBottom: 0 }}>
              Vous pouvez faire varier : stock de départ, encaissements, décaissements.
            </p>
          </HelpPanel>

          <ContinueBar onContinue={onContinue} />

          <div style={{ marginTop: 12, color: C.secondary, fontSize: 14 }}>
            En bref : à chaque période, la trésorerie change selon (encaissements − décaissements).
          </div>

          <DetailsOnly>
            <div style={{ padding: 12, border: `1px solid ${C.softBorder}`, borderRadius: 12, marginTop: 12 }}>
              <b>Équation générale</b>
              <div style={{ marginTop: 6 }}>
                <b>trésorerie fin</b> = <b>trésorerie début</b> + <b>encaissements</b> − <b>décaissements</b>
              </div>
            </div>
          </DetailsOnly>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginTop: 8 }}>
            <div>
              <InputRow label="Nom du stock" value={snap.stockLabel} disabled={LOCK_STRUCTURE} onChange={() => {}} />
              <InputRow label="Unité" value={snap.unit} disabled={LOCK_STRUCTURE} onChange={() => {}} />
              <InputRow label="Horizon (nombre de périodes)" value={snap.horizon} disabled={true} onChange={() => {}} />
              <InputRow label="Nom du flux d’entrée" value={snap.flowInLabel} disabled={LOCK_STRUCTURE} onChange={() => {}} />
              <InputRow label="Nom du flux de sortie" value={snap.flowOutLabel} disabled={LOCK_STRUCTURE} onChange={() => {}} />
            </div>

            <div>
              <InputRow label="Stock de départ (paramètre libre)" value={stockDraft} disabled={false} onChange={onChangeStock} />
              <InputRow label="Encaissements (par période) — paramètre libre" value={inDraft} disabled={false} onChange={onChangeIn} />
              <InputRow label="Décaissements (par période) — paramètre libre" value={outDraft} disabled={false} onChange={onChangeOut} />
            </div>
          </div>

          <TableAlwaysVisible rows={tableFree.rows} stockLabel={snap.stockLabel} flowInLabel={snap.flowInLabel} flowOutLabel={snap.flowOutLabel} />

          <ContinueBar onContinue={onContinue} />
        </Card>
      )}

      {/* STEP 2 */}
      {step === 2 && (
        <Card
          title={
            snap.visionIndex === 2
              ? "R2 — Fixer les paramètres (valeurs fixées), sans objectif"
              : "R2 — Ajout de l’objectif (paramètres libres)"
          }
        >
          <HelpPanel title={helpTitle()}>
            {snap.visionIndex === 2 ? (
              <>
                <p style={{ marginTop: 0 }}>
                  Dans cette vision, on commence par <b>fixer la réalité</b> (stock de départ, encaissements, décaissements).
                </p>
                <p style={{ marginBottom: 0 }}>
                  À ce stade, <b>aucun objectif</b> n’est introduit.
                </p>
              </>
            ) : (
              <>
                <p style={{ marginTop: 0 }}>
                  Ici on ajoute l’<b>objectif</b>. Les paramètres restent <b>libres</b> : on peut tester différents scénarios.
                </p>
                <p style={{ marginBottom: 0 }}>
                  (Dans la Vision 2, R2 est identique à R2 de la Vision 1.)
                </p>
              </>
            )}
          </HelpPanel>

          <ContinueBar onContinue={onContinue} />

          {snap.visionIndex === 2 ? (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginTop: 8 }}>
                <InputRow label="Stock de départ (valeur fixée)" value={snap.fixedInitialStock} disabled={true} onChange={() => {}} />
                <InputRow label="Encaissements (valeur fixée)" value={snap.fixedInflow} disabled={true} onChange={() => {}} />
                <InputRow label="Décaissements (valeur fixée)" value={snap.fixedOutflow} disabled={true} onChange={() => {}} />
              </div>

              <DetailsOnly>
                <div style={{ padding: 12, border: `1px solid ${C.softBorder}`, borderRadius: 12, marginTop: 12, lineHeight: 1.6 }}>
                  <b>Valorisation des paramètres fixés (R2)</b>
                  <div>encaissements = {snap.fixedInflowMeaning} (valeur fixée)</div>
                  <div>décaissements = {snap.fixedOutflowMeaning} (valeur fixée)</div>
                </div>
              </DetailsOnly>

              <div style={{ marginTop: 12, padding: 12, border: `1px solid ${C.softBorder}`, borderRadius: 12 }}>
                Stock final (R2) : <b>{fmt(tableFixed.stockFinal)}</b> {snap.unit}
              </div>

              <TableAlwaysVisible rows={tableFixed.rows} stockLabel={snap.stockLabel} flowInLabel={snap.flowInLabel} flowOutLabel={snap.flowOutLabel} />
            </>
          ) : (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginTop: 8 }}>
                <InputRow label="Objectif minimal (valeur fixée)" value={snap.target} disabled={true} onChange={() => {}} />
                <div />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginTop: 8 }}>
                <InputRow label="Stock de départ (paramètre libre)" value={stockDraft} disabled={false} onChange={onChangeStock} />
                <InputRow label="Encaissements (par période) — paramètre libre" value={inDraft} disabled={false} onChange={onChangeIn} />
                <InputRow label="Décaissements (par période) — paramètre libre" value={outDraft} disabled={false} onChange={onChangeOut} />
              </div>

              <div style={{ marginTop: 12, padding: 12, border: `1px solid ${C.softBorder}`, borderRadius: 12 }}>
                Stock final (R2) : <b>{fmt(tableFree.stockFinal)}</b> {snap.unit} —{" "}
                <b style={{ color: atteintR2_V1V2 ? C.ok : C.bad }}>
                  {atteintR2_V1V2 ? "objectif atteint" : "objectif non atteint"}
                </b>
              </div>

              <DetailsOnly>
                <div style={{ padding: 12, border: `1px solid ${C.softBorder}`, borderRadius: 12, marginTop: 12 }}>
                  <b>Équation (rappel)</b>
                  <div style={{ marginTop: 6 }}>
                    <b>trésorerie fin</b> = <b>trésorerie début</b> + <b>encaissements</b> − <b>décaissements</b>
                  </div>
                </div>
              </DetailsOnly>

              <TableAlwaysVisible rows={tableFree.rows} stockLabel={snap.stockLabel} flowInLabel={snap.flowInLabel} flowOutLabel={snap.flowOutLabel} />
            </>
          )}

          <ContinueBar onContinue={onContinue} />
        </Card>
      )}

      {/* STEP 3 */}
      {step === 3 && (
        <Card title={snap.visionIndex === 2 ? "R3 — Ajouter l’objectif (valeur fixée) et conclure" : "R3 — Préciser les paramètres (valeurs fixées)"}>
          <HelpPanel title={helpTitle()}>
            {snap.visionIndex === 2 ? (
              <>
                <p style={{ marginTop: 0 }}>
                  Ici, on introduit l’<b>objectif</b> (valeur fixée) après avoir fixé la réalité.
                </p>
                <p style={{ marginBottom: 0 }}>
                  On conclut ensuite : objectif atteint / non atteint.
                </p>
              </>
            ) : (
              <>
                <p style={{ marginTop: 0 }}>
                  R3 : les paramètres prennent des <b>valeurs fixées</b> (cas présenté). On conclut sur un cas précis.
                </p>
                <p style={{ marginBottom: 0 }}>
                  L’objectif a déjà été introduit en R2.
                </p>
              </>
            )}
          </HelpPanel>

          <ContinueBar onContinue={onContinue} />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginTop: 8 }}>
            <InputRow label="Stock de départ (valeur fixée)" value={snap.fixedInitialStock} disabled={true} onChange={() => {}} />
            <InputRow label="Encaissements (valeur fixée)" value={snap.fixedInflow} disabled={true} onChange={() => {}} />
            <InputRow label="Décaissements (valeur fixée)" value={snap.fixedOutflow} disabled={true} onChange={() => {}} />
            <InputRow label="Objectif minimal (valeur fixée)" value={snap.target} disabled={true} onChange={() => {}} />
          </div>

          <DetailsOnly>
            <div style={{ padding: 12, border: `1px solid ${C.softBorder}`, borderRadius: 12, marginTop: 12, lineHeight: 1.6 }}>
              <b>Valorisation des paramètres fixés</b>
              <div>encaissements = {snap.fixedInflowMeaning} (valeur fixée)</div>
              <div>décaissements = {snap.fixedOutflowMeaning} (valeur fixée)</div>
            </div>
          </DetailsOnly>

          <div style={{ marginTop: 12, padding: 12, border: `1px solid ${C.softBorder}`, borderRadius: 12 }}>
            Stock final : <b>{fmt(tableFixed.stockFinal)}</b> {snap.unit} —{" "}
            <b style={{ color: (snap.visionIndex === 2 ? atteintR3_V3 : atteintR3_V1V2) ? C.ok : C.bad }}>
              {(snap.visionIndex === 2 ? atteintR3_V3 : atteintR3_V1V2) ? "objectif atteint" : "objectif non atteint"}
            </b>
          </div>

          <DetailsOnly>
            <div style={{ padding: 12, border: `1px solid ${C.softBorder}`, borderRadius: 12, marginTop: 12 }}>
              <b>Rappel</b>
              <div style={{ marginTop: 6 }}>
                <b>trésorerie fin</b> = <b>trésorerie début</b> + <b>encaissements</b> − <b>décaissements</b>
              </div>
            </div>
          </DetailsOnly>

          <TableAlwaysVisible rows={tableFixed.rows} stockLabel={snap.stockLabel} flowInLabel={snap.flowInLabel} flowOutLabel={snap.flowOutLabel} />

          <ContinueBar onContinue={onContinue} />
        </Card>
      )}
    </main>
  );
}

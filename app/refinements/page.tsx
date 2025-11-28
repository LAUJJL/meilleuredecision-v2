'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  PivotElement,
  PivotModel,
  PivotKind,
  groupElementsByKind,
} from '../../lib/pivot';

type Problem = {
  id: number;
  name: string;
  shortDef: string;
};

type Vision = {
  id: number;
  name: string;
  longDef: string;
};

type CurrentVisionPayload = {
  problem: Problem;
  vision: Vision;
};

type ReformulationPair = {
  r1: string;
  r2: string;
};

type UIStep = {
  id: number;
  sourceText: string;
  normalizedText: string;
  isAccepted: boolean;
  pivotElements: PivotElement[];
  contributions: string[];
};

let globalId = 1;
function nextId() {
  return globalId++;
}

export default function RefinementsPage() {
  const [current, setCurrent] = useState<CurrentVisionPayload | null>(null);

  // Raffinement 1 : formulaire structuré (stock + unités + horizon + noms de flux)
  const [baseStockName, setBaseStockName] = useState('');
  const [baseStockUnit, setBaseStockUnit] = useState('');
  const [timeUnit, setTimeUnit] = useState('');
  const [horizon, setHorizon] = useState('');
  const [flowInNameInput, setFlowInNameInput] = useState('');
  const [flowOutNameInput, setFlowOutNameInput] = useState('');

  // Raffinements 2, 3, ... : texte + reformulations
  const [draftText, setDraftText] = useState('');
  const [currentReforms, setCurrentReforms] = useState<ReformulationPair | null>(null);
  const [steps, setSteps] = useState<UIStep[]>([]);
  const [reformError, setReformError] = useState<string | null>(null);
  const [draftContribution, setDraftContribution] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem('currentVision');
    if (stored) {
      try {
        const payload: CurrentVisionPayload = JSON.parse(stored);
        setCurrent(payload);
      } catch {
        setCurrent(null);
      }
    }
  }, []);

  /**
   * RAFFINEMENT 1 : cadre de base du modèle
   * - Un stock principal (nom choisi par le visiteur)
   * - Un stock de départ (nom généré automatiquement : "<stock> de départ")
   * - Un flux d'entrée (nom choisi par le visiteur)
   * - Un flux de sortie (nom choisi par le visiteur)
   * - Une unité du stock
   * - Une unité de temps
   * - Un horizon de simulation
   */
  function createBaseRefinement() {
    const stock = baseStockName.trim();
    const unit = baseStockUnit.trim();
    const tUnit = timeUnit.trim();
    const horiz = horizon.trim();
    const flowIn = flowInNameInput.trim();
    const flowOut = flowOutNameInput.trim();

    if (!stock || !unit || !tUnit || !horiz || !flowIn || !flowOut) {
      setReformError(
        'Veuillez remplir tous les champs : nom du stock, unité du stock, unité de temps, horizon, flux d’entrée et flux de sortie.'
      );
      return;
    }

    setReformError(null);

    const stockInitialName = `${stock} de départ`;

    const sourceText = `Cadre de base du modèle : un stock "${stock}" (en ${unit}), avec un stock de départ "${stockInitialName}", un flux d'entrée "${flowIn}" et un flux de sortie "${flowOut}", simulé avec un pas de temps en ${tUnit} jusqu'à l'horizon ${horiz}.`;

    const normalizedText = sourceText;

    const pivotElements: PivotElement[] = [
      {
        id: `stock_${nextId()}`,
        name: stock,
        kind: 'AUX_STABLE',
        description: `Stock principal du modèle (en ${unit}).`,
      },
      {
        id: `stock_init_${nextId()}`,
        name: stockInitialName,
        kind: 'CONST',
        description: `Valeur initiale du stock "${stock}".`,
      },
      {
        id: `flow_in_${nextId()}`,
        name: flowIn,
        kind: 'AUX',
        description: `Flux d'entrée du stock "${stock}".`,
      },
      {
        id: `flow_out_${nextId()}`,
        name: flowOut,
        kind: 'AUX',
        description: `Flux de sortie du stock "${stock}".`,
      },
      {
        id: `param_time_${nextId()}`,
        name: 'unite_temps',
        kind: 'PARAM',
        description: `Unité de temps utilisée : ${tUnit}.`,
      },
      {
        id: `param_horizon_${nextId()}`,
        name: 'horizon_simulation',
        kind: 'PARAM',
        description: `Horizon de la simulation : ${horiz} (${tUnit}).`,
      },
    ];

    const newStep: UIStep = {
      id: nextId(),
      sourceText,
      normalizedText,
      isAccepted: true,
      pivotElements,
      contributions: [
        'Cadre de base du modèle : stock principal, stock de départ, flux d’entrée/sortie, unité de temps et horizon.',
      ],
    };

    setSteps((prev) => [...prev, newStep]);

    setBaseStockName('');
    setBaseStockUnit('');
    setTimeUnit('');
    setHorizon('');
    setFlowInNameInput('');
    setFlowOutNameInput('');
  }

  /**
   * Raffinements 2, 3, ... : texte + reformulations
   */
  function generateReformulations() {
    const t = draftText.trim();
    if (!t) {
      setReformError('Veuillez entrer un texte de raffinement.');
      return;
    }
    setReformError(null);

    setCurrentReforms({
      r1: `Reformulation 1 : ${t}`,
      r2: `Reformulation 2 : ${t}`,
    });
  }

  function rejectReformulations() {
    setCurrentReforms(null);
    setReformError(
      "Ces reformulations ne vous conviennent pas. Reformulez votre texte de raffinement."
    );
  }

  function acceptReformulations() {
    if (!currentReforms) return;
    const source = draftText.trim();
    if (!source) return;

    const normalized = currentReforms.r2;

    const pivotElements: PivotElement[] = [
      {
        id: `temp_${nextId()}`,
        name: 'TEMP_exemple',
        kind: 'TEMP',
        description: 'Exemple de constante provisoire liée à ce raffinement',
      },
      {
        id: `aux_${nextId()}`,
        name: 'AUX_exemple',
        kind: 'AUX',
        description: 'Exemple de variable auxiliaire liée à ce raffinement',
      },
    ];

    const contributions: string[] = [];
    const trimmed = draftContribution.trim();
    if (trimmed) contributions.push(trimmed);

    const newStep: UIStep = {
      id: nextId(),
      sourceText: source,
      normalizedText: normalized,
      isAccepted: true,
      pivotElements,
      contributions,
    };

    setSteps((prev) => [...prev, newStep]);
    setCurrentReforms(null);
    setDraftText('');
    setDraftContribution('');
    setReformError(null);
  }

  function toggleStepAccepted(id: number) {
    setSteps((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, isAccepted: !s.isAccepted } : s
      )
    );
  }

  const acceptedSteps = steps.filter((s) => s.isAccepted);

  const pivotModel: PivotModel = {
    steps: acceptedSteps.map((s, index) => ({
      stepIndex: index + 1,
      sourceText: s.sourceText,
      normalizedText: s.normalizedText,
      elements: s.pivotElements,
      contributions: s.contributions,
    })),
  };

  const grouped = groupElementsByKind(pivotModel);

  function count(kind: PivotKind): number {
    return grouped[kind]?.length ?? 0;
  }

  return (
    <main style={{ padding: 40, maxWidth: 900, margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      <h1>Raffinements successifs</h1>

      {/* Contexte vision + problème */}
      {current ? (
        <section
          style={{
            padding: 12,
            borderRadius: 8,
            border: '1px solid #ccc',
            marginBottom: 16,
            background: '#f9f9ff',
          }}
        >
          <div style={{ fontSize: 13, color: '#555' }}>Problème :</div>
          <div>
            <b>{current.problem.name}</b>
            {current.problem.shortDef && <span> — {current.problem.shortDef}</span>}
          </div>

          <div style={{ fontSize: 13, color: '#555', marginTop: 8 }}>Vision :</div>
          <div>
            <b>{current.vision.name}</b>
          </div>

          {current.vision.longDef && (
            <div style={{ marginTop: 4, fontSize: 13, color: '#444' }}>
              {current.vision.longDef}
            </div>
          )}

          <div style={{ marginTop: 8 }}>
            <Link href="/visions">
              <u>Changer de vision</u>
            </Link>
          </div>
        </section>
      ) : (
        <section
          style={{
            padding: 12,
            borderRadius: 8,
            border: '1px solid #f0b0b0',
            marginBottom: 16,
            background: '#fff5f5',
          }}
        >
          <div style={{ color: '#a00' }}>
            Aucune vision sélectionnée. Retournez à la page des visions.
          </div>
          <div style={{ marginTop: 4 }}>
            <Link href="/visions">
              <u>Aller aux visions</u>
            </Link>
          </div>
        </section>
      )}

      {/* Zone d'information */}
      <p style={{ color: '#555' }}>
        Le raffinement 1 sert à poser le cadre de base : un stock principal, un stock de départ,
        ses flux d&apos;entrée et de sortie, l&apos;unité de temps et l&apos;horizon de
        simulation. À partir du raffinement 2, vous ajoutez des raffinements textuels successifs
        (contraintes, mécanismes, paramètres, etc.).
      </p>

      {/* RAFFINEMENT 1 : formulaire structuré */}
      {steps.length === 0 && (
        <section style={{ marginTop: 24, marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, marginBottom: 8 }}>
            1. Raffinement 1 — cadre de base du modèle
          </h2>
          <p style={{ fontSize: 14, color: '#555', marginBottom: 12 }}>
            Ce premier raffinement ne demande pas de texte libre. Il sert uniquement à définir :
            le stock principal, l&apos;unité du stock, l&apos;unité de temps, l&apos;horizon de
            simulation, et les noms des flux d&apos;entrée et de sortie. Le nom du stock de départ
            sera généré automatiquement à partir du nom du stock (en ajoutant &quot;de départ&quot;).
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 500 }}>
            <div>
              <div style={{ fontSize: 13, color: '#555' }}>Nom du stock principal :</div>
              <input
                type="text"
                value={baseStockName}
                onChange={(e) => setBaseStockName(e.target.value)}
                placeholder='Exemples : "Trésorerie", "Stock de produits finis"…'
                style={{ width: '100%', padding: 6 }}
              />
            </div>

            <div>
              <div style={{ fontSize: 13, color: '#555' }}>Unité du stock :</div>
              <input
                type="text"
                value={baseStockUnit}
                onChange={(e) => setBaseStockUnit(e.target.value)}
                placeholder='Exemples : "euros", "unités", "heures"…'
                style={{ width: '100%', padding: 6 }}
              />
            </div>

            <div>
              <div style={{ fontSize: 13, color: '#555' }}>Unité de temps :</div>
              <input
                type="text"
                value={timeUnit}
                onChange={(e) => setTimeUnit(e.target.value)}
                placeholder='Exemples : "jours", "mois", "années"…'
                style={{ width: '100%', padding: 6 }}
              />
            </div>

            <div>
              <div style={{ fontSize: 13, color: '#555' }}>Horizon de simulation :</div>
              <input
                type="text"
                value={horizon}
                onChange={(e) => setHorizon(e.target.value)}
                placeholder='Exemples : "12 mois", "5 ans", "180 jours"…'
                style={{ width: '100%', padding: 6 }}
              />
            </div>

            <div>
              <div style={{ fontSize: 13, color: '#555' }}>Nom du flux d&apos;entrée :</div>
              <input
                type="text"
                value={flowInNameInput}
                onChange={(e) => setFlowInNameInput(e.target.value)}
                placeholder='Exemples : "Encaissements", "Livraisons", "Recrutements"…'
                style={{ width: '100%', padding: 6 }}
              />
            </div>

            <div>
              <div style={{ fontSize: 13, color: '#555' }}>Nom du flux de sortie :</div>
              <input
                type="text"
                value={flowOutNameInput}
                onChange={(e) => setFlowOutNameInput(e.target.value)}
                placeholder='Exemples : "Décaissements", "Ventes", "Départs"…'
                style={{ width: '100%', padding: 6 }}
              />
            </div>
          </div>

          {reformError && (
            <p style={{ color: 'red', marginTop: 8 }}>{reformError}</p>
          )}

          <button
            onClick={createBaseRefinement}
            style={{ marginTop: 12, padding: '6px 12px', cursor: 'pointer' }}
          >
            Créer le raffinement 1
          </button>
        </section>
      )}

      {/* RAFFINEMENTS 2, 3, ... : texte + reformulations */}
      {steps.length > 0 && (
        <>
          {/* 1) Proposer un raffinement textuel */}
          <section style={{ marginTop: 24, marginBottom: 24 }}>
            <h2 style={{ fontSize: 18, marginBottom: 8 }}>
             2. Proposer un nouveau raffinement 
            </h2>

            <textarea
              value={draftText}
              onChange={(e) => setDraftText(e.target.value)}
              rows={4}
              style={{ width: '100%', padding: 8, fontFamily: 'inherit' }}
              placeholder="Écrivez ici un nouveau raffinement (ajout de mécanisme, contrainte, paramètre, etc.)…"
            />

            <div style={{ marginTop: 10 }}>
              <div style={{ fontSize: 13, color: '#555', marginBottom: 4 }}>
                (Optionnel) En quelques mots, que contribue ce raffinement ?
              </div>
              <input
                type="text"
                value={draftContribution}
                onChange={(e) => setDraftContribution(e.target.value)}
                placeholder="Exemples : ajoute une contrainte, précise un délai, introduit un paramètre…"
                style={{ width: '100%', padding: 6, fontFamily: 'inherit', fontSize: 13 }}
              />
            </div>

            {reformError && (
              <p style={{ color: 'red', marginTop: 8 }}>{reformError}</p>
            )}

            <button
              onClick={generateReformulations}
              style={{ marginTop: 8, padding: '6px 12px', cursor: 'pointer' }}
            >
              Générer les reformulations
            </button>
          </section>

          {/* 2) Reformulations */}
          {currentReforms && (
            <section
              style={{
                border: '1px solid #ccc',
                padding: 12,
                borderRadius: 8,
                marginBottom: 24,
                background: '#fafafa',
              }}
            >
              <h2 style={{ fontSize: 18, marginTop: 0 }}>3. Vérifier les reformulations</h2>

              <p>Voici deux reformulations de votre texte :</p>
              <ul>
                <li>{currentReforms.r1}</li>
                <li>{currentReforms.r2}</li>
              </ul>

              <p><b>Ces deux reformulations expriment-elles bien votre idée&nbsp;?</b></p>

              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button
                  onClick={acceptReformulations}
                  style={{ padding: '6px 12px', cursor: 'pointer' }}
                >
                  Oui → créer le raffinement
                </button>

                <button
                  onClick={rejectReformulations}
                  style={{
                    padding: '6px 12px',
                    cursor: 'pointer',
                    background: '#eee',
                  }}
                >
                  Non, je reformule
                </button>
              </div>
            </section>
          )}
        </>
      )}

      {/* Liste des raffinements */}
      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 18 }}>Raffinements déjà enregistrés</h2>

        {steps.length === 0 && (
          <p style={{ color: '#777' }}>Aucun raffinement pour le moment.</p>
        )}

        {steps.map((s, index) => (
          <div
            key={s.id}
            style={{
              padding: 10,
              marginBottom: 8,
              borderRadius: 6,
              border: '1px solid #ddd',
              background: s.isAccepted ? '#fff' : '#f5f5f5',
              opacity: s.isAccepted ? 1 : 0.6,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <strong>Raffinement {index + 1}</strong>

              <button
                onClick={() => toggleStepAccepted(s.id)}
                style={{
                  padding: '2px 8px',
                  fontSize: 12,
                  cursor: 'pointer',
                  background: s.isAccepted ? '#ffe0e0' : '#e0ffe0',
                }}
              >
                {s.isAccepted ? 'Rejeter' : 'Accepter'}
              </button>
            </div>

            <div style={{ marginTop: 6 }}>
              <div style={{ fontSize: 13, color: '#666' }}>Texte d’origine :</div>
              <div>{s.sourceText}</div>
            </div>

            <div style={{ marginTop: 6 }}>
              <div style={{ fontSize: 13, color: '#666' }}>Texte normalisé :</div>
              <div>{s.normalizedText}</div>
            </div>

            {s.contributions.length > 0 && (
              <div style={{ marginTop: 6 }}>
                <div style={{ fontSize: 13, color: '#666' }}>Contribution(s) :</div>
                <ul style={{ marginTop: 4 }}>
                  {s.contributions.map((c, idx) => (
                    <li key={idx}>{c}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </section>

      {/* Vue technique (Pivot) */}
      <section
        style={{
          borderTop: '1px solid #ddd',
          paddingTop: 16,
          marginTop: 16,
        }}
      >
        <h2 style={{ fontSize: 18 }}>Vue technique du modèle (Langage Pivot)</h2>

        {acceptedSteps.length === 0 ? (
          <p style={{ color: '#777' }}>
            Aucun raffinement accepté → le modèle interne est vide.
          </p>
        ) : (
          <>
            <p>Nombre de raffinements acceptés : <b>{acceptedSteps.length}</b></p>

            <ul>
              <li>TEMP : {count('TEMP')}</li>
              <li>CONST : {count('CONST')}</li>
              <li>PARAM : {count('PARAM')}</li>
              <li>AUX : {count('AUX')}</li>
              <li>AUX_STABLE : {count('AUX_STABLE')}</li>
            </ul>

            <p style={{ fontSize: 13, color: '#666' }}>
              Ce résumé sera affiné plus tard pour refléter exactement les constantes, paramètres
              et variables issus du Langage Pivot.
            </p>
          </>
        )}
      </section>
    </main>
  );
}

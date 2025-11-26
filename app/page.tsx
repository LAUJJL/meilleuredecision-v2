'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { ElementPivot } from '@/lib/pivot';

interface Problem {
  id: number;
  name: string;
  shortDef: string;
}

type RefinementStatus = 'pending' | 'validated' | 'rejected';

interface RefinementStep {
  id: number;
  input: string;
  elements: ElementPivot[];
  status: RefinementStatus; // statut choisi par le visiteur

  // Pour plus tard : quels types de contribution cette étape apporte au modèle ?
  // (définition, contrainte, variable, mécanisme, etc.)
  // Pour l’instant : laissé vide, structure seulement.
  contributions: string[];
}

// Brouillon de raffinement : texte du visiteur + 2 reformulations
interface DraftRefinement {
  id: number;
  original: string;
  r1: string;
  r2: string;
}

// Modèle interne cumulatif structuré par types du Langage Pivot
interface ModeleInterne {
  texts: string[];          // textes des étapes validées
  steps: RefinementStep[];  // étapes validées

  TEMP: ElementPivot[];     // constantes provisoires
  CONST: ElementPivot[];    // constantes fixes
  PARAM: ElementPivot[];    // paramètres
  AUX: ElementPivot[];      // auxiliaires
  AUX_STABLE: ElementPivot[]; // auxiliaires stabilisées

  // Ensemble (plat) des contributions déclarées dans les étapes validées
  contributions: string[];
}

export default function HomePage() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [name, setName] = useState('');
  const [shortDef, setShortDef] = useState('');

  // --- état pour le prototype Langage Pivot / raffinements ---
  const [pivotInput, setPivotInput] = useState('');
  const [drafts, setDrafts] = useState<DraftRefinement[]>([]);
  const [steps, setSteps] = useState<RefinementStep[]>([]);
  const [pivotLoading, setPivotLoading] = useState(false);
  const [pivotError, setPivotError] = useState<string | null>(null);

  // --- modèle interne cumulatif ---
  const [modele, setModele] = useState<ModeleInterne>({
    texts: [],
    steps: [],
    TEMP: [],
    CONST: [],
    PARAM: [],
    AUX: [],
    AUX_STABLE: [],
    contributions: [],
  });
  // ------------------------------------------------------------

  useEffect(() => {
    const saved = localStorage.getItem('problems');
    if (saved) setProblems(JSON.parse(saved));
  }, []);

  const save = (list: Problem[]) => {
    setProblems(list);
    localStorage.setItem('problems', JSON.stringify(list));
  };

  const addProblem = () => {
    if (!name.trim()) return;
    const newProblem: Problem = { id: Date.now(), name, shortDef };
    save([...problems, newProblem]);
    setName('');
    setShortDef('');
  };

  const deleteProblem = (id: number) => {
    if (!confirm('Supprimer ce problème ?')) return;
    save(problems.filter((p) => p.id !== id));
  };

  const selectProblem = (p: Problem) => {
    localStorage.setItem('currentProblem', JSON.stringify(p));
  };

  // --- 1. Le visiteur propose un texte : on crée un brouillon avec 2 reformulations ---
  const handlePivotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pivotInput.trim()) return;

    const original = pivotInput.trim();

    // Reformulations-maquette très simples (pour tester la mécanique).
    const r1 = `Si je reformule : ${original}`;
    const r2 = `Autre manière de dire la même chose : ${original}`;

    const newDraft: DraftRefinement = {
      id: Date.now(),
      original,
      r1,
      r2,
    };

    setDrafts((prev) => [...prev, newDraft]);
    setPivotInput('');
  };
  // ----------------------------------------------------------------

  // --- 2. Le visiteur estime que les deux reformulations sont correctes ---
  // Le site choisit alors, en interne, une formulation "préférée" pour le modèle (ici r1).
  const applyDraft = async (id: number) => {
    const draft = drafts.find((d) => d.id === id);
    if (!draft) return;

    const chosenText = draft.r1; // "cuisine interne" pour l’instant

    setPivotLoading(true);
    setPivotError(null);

    try {
      const res = await fetch('/api/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: chosenText }),
      });

      if (!res.ok) {
        throw new Error(`Erreur HTTP ${res.status}`);
      }

      const data = await res.json();

      const newStep: RefinementStep = {
        id: Date.now(),
        input: chosenText,
        elements: data.elements ?? [],
        status: 'pending', // en attente de validation par le visiteur
        contributions: [], // pour l’instant : aucune contribution typée explicitement
      };

      setSteps((prev) => [...prev, newStep]);
      // ce brouillon a été "consommé"
      setDrafts((prev) => prev.filter((d) => d.id !== id));
    } catch (err: any) {
      setPivotError(err.message ?? 'Erreur inconnue');
    } finally {
      setPivotLoading(false);
    }
  };
  // ----------------------------------------------------------------

  // Si le visiteur estime qu’au moins une reformulation est incorrecte,
  // il jette le brouillon et rédige un nouveau texte.
  const rejectDraft = (id: number) => {
    setDrafts((prev) => prev.filter((d) => d.id !== id));
  };

  // --- utilitaire : construire le modèle interne à partir des étapes validées ---
  const buildModeleFromValidated = (
    validated: RefinementStep[]
  ): ModeleInterne => {
    const texts = validated.map((s) => s.input);

    const temp: ElementPivot[] = [];
    const konst: ElementPivot[] = [];
    const param: ElementPivot[] = [];
    const aux: ElementPivot[] = [];
    const auxStable: ElementPivot[] = [];

    // contributions : pour l’instant, on ne fait que les agréger
    const contribs: string[] = [];

    // pour éviter les doublons simples sur les éléments pivot : kind + name
    const seen = new Set<string>();

    for (const step of validated) {
      // contributions de cette étape
      for (const c of step.contributions || []) {
        if (!contribs.includes(c)) {
          contribs.push(c);
        }
      }

      // éléments pivot de cette étape
      for (const el of step.elements) {
        const key = `${el.kind}|${el.name}`;
        if (seen.has(key)) continue;
        seen.add(key);

        switch (el.kind) {
          case 'TEMP':
            temp.push(el);
            break;
          case 'CONST':
            konst.push(el);
            break;
          case 'PARAM':
            param.push(el);
            break;
          case 'AUX':
            aux.push(el);
            break;
          case 'AUX_STABLE':
            auxStable.push(el);
            break;
          default:
            // autres types éventuels : ignorés pour l’instant
            break;
        }
      }
    }

    return {
      texts,
      steps: validated,
      TEMP: temp,
      CONST: konst,
      PARAM: param,
      AUX: aux,
      AUX_STABLE: auxStable,
      contributions: contribs,
    };
  };

  // --- 3. Le visiteur valide ou rejette l'étape de raffinement ---
  const updateStepStatus = (id: number, status: RefinementStatus) => {
    setSteps((prev) => {
      const updated = prev.map((s) =>
        s.id === id ? { ...s, status } : s
      );

      // Chaîne logique = seulement les étapes validées par le visiteur
      const validatedChain = updated.filter(
        (s) => s.status === 'validated'
      );

      // --- mise à jour du modèle interne cumulatif structuré ---
      const newModel = buildModeleFromValidated(validatedChain);
      setModele(newModel);

      // --- logs pour observation ---
      console.clear();
      console.log('Chaîne validée actuelle (ordre chronologique) :');
      validatedChain.forEach((step, index) => {
        console.log(`\nÉtape validée ${index + 1}`);
        console.log('Texte :', step.input);
        console.log(
          'Éléments pivot :',
          step.elements.map((e) => `${e.kind}:${e.name}`).join(', ')
        );
        console.log(
          'Contributions (pour l’instant vides) :',
          step.contributions
        );
      });
      if (validatedChain.length === 0) {
        console.log('(aucune étape validée pour l’instant)');
      }

      console.log('\nModèle interne cumulatif (par type) :');
      console.log('TEMP :', newModel.TEMP.map((e) => e.name));
      console.log('CONST :', newModel.CONST.map((e) => e.name));
      console.log('PARAM :', newModel.PARAM.map((e) => e.name));
      console.log('AUX :', newModel.AUX.map((e) => e.name));
      console.log('AUX_STABLE :', newModel.AUX_STABLE.map((e) => e.name));
      console.log(
        'Contributions globales :',
        newModel.contributions
      );

      return updated;
    });
  };
  // ----------------------------------------------------------------

  return (
    <main style={{ padding: 40 }}>
            <h1>
        Problèmes{' '}
        <small style={{ fontSize: 14, color: 'gray' }}>(gestion)</small>
      </h1>

      <section style={{ marginTop: 20 }}>
        <h3>Ouvrir un problème existant</h3>
        {problems.length === 0 && <p>Aucun problème pour l’instant.</p>}
        {problems.map((p) => (
          <div key={p.id} style={{ marginBottom: 6 }}>
            <b>{p.name}</b> — {p.shortDef || 'pas de définition courte'}{' '}
            <Link href="/visions" onClick={() => selectProblem(p)}>
              <u>Créer / Ouvrir les visions</u>
            </Link>{' '}
            <button
              onClick={() => deleteProblem(p.id)}
              style={{
                color: 'red',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Supprimer
            </button>
          </div>
        ))}
      </section>

      <hr style={{ margin: '20px 0' }} />

      <section>
        <h3>Créer un nouveau problème</h3>
        <input
          placeholder="Nom du problème (80 car. max)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ display: 'block', width: '100%', marginBottom: 8 }}
        />
        <input
          placeholder="Définition courte (1 ligne, optionnel)"
          value={shortDef}
          onChange={(e) => setShortDef(e.target.value)}
          style={{ display: 'block', width: '100%', marginBottom: 8 }}
        />
        <button onClick={addProblem}>
          Créer le problème (puis choisir/créer sa vision)
        </button>
      </section>

      <button
        onClick={() => {
          if (confirm('Tout effacer (problèmes/visions/sélections) ?')) {
            localStorage.clear();
            setProblems([]);
          }
        }}
        style={{ marginTop: 20 }}
      >
        Réinitialiser la sélection
      </button>

      <hr style={{ margin: '30px 0' }} />

      {/* --- Prototype Langage Pivot & raffinements --- */}
      <section>
        <h2>Prototype Langage Pivot (démo interne)</h2>
        <p style={{ maxWidth: 700 }}>
          1) Vous proposez un texte de raffinement. Le système essaie de le
          comprendre et propose deux <b>reformulations en langage courant</b>.{' '}
          <br />
          2) Vous vérifiez si ces deux reformulations expriment bien ce que
          vous vouliez dire. <br />
          3) Si vous les jugez correctes, le système choisit en interne la
          formulation qui lui convient le mieux pour construire le modèle
          (par exemple la première reformulation), et crée une étape de
          raffinement à partir de celle-ci. Vous pouvez ensuite{' '}
          <b>valider</b> ou <b>rejeter</b> cette étape.
        </p>
        <p style={{ maxWidth: 700, fontSize: 13, color: 'gray' }}>
          Pour l’instant, les reformulations et les éléments pivot sont
          fictifs (prototype), et les contributions sont simplement prévues
          comme structure pour plus tard. Le modèle interne cumule uniquement
          les étapes que vous avez validées, classées par type (TEMP, CONST,
          PARAM, AUX, AUX_STABLE).
        </p>

        {/* Formulaire de proposition initiale */}
        <form onSubmit={handlePivotSubmit} style={{ marginTop: 10 }}>
          <textarea
            value={pivotInput}
            onChange={(e) => setPivotInput(e.target.value)}
            rows={4}
            style={{ width: '100%', padding: 8, marginBottom: 8 }}
            placeholder="Ex : Comment structurer le choix entre deux projets d’investissement ?"
          />
          <button
            type="submit"
            disabled={pivotLoading || !pivotInput.trim()}
          >
            Proposer un texte de raffinement
          </button>
        </form>

        {/* Brouillons de reformulation */}
        {drafts.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <h3>Reformulations proposées (vérification de compréhension)</h3>
            {drafts.map((draft) => (
              <div
                key={draft.id}
                style={{
                  marginBottom: 16,
                  padding: 10,
                  border: '1px solid #ccc',
                }}
              >
                <div style={{ marginBottom: 6 }}>
                  <b>Texte d’origine proposé :</b> {draft.original}
                </div>
                <div style={{ fontSize: 14, marginBottom: 6 }}>
                  Le système propose deux reformulations. Si vous estimez
                  qu&apos;<b>elles expriment bien la même idée que vous</b>,
                  vous pouvez les valider. Sinon, vous pouvez les rejeter et
                  reformuler votre texte.
                </div>
                <div style={{ fontSize: 14, marginBottom: 6 }}>
                  <b>Reformulation 1 :</b> {draft.r1}
                </div>
                <div style={{ fontSize: 14, marginBottom: 6 }}>
                  <b>Reformulation 2 :</b> {draft.r2}
                </div>

                <div style={{ marginTop: 8 }}>
                  <button
                    onClick={() => applyDraft(draft.id)}
                    disabled={pivotLoading}
                    style={{ marginRight: 8 }}
                  >
                    Les deux reformulations sont correctes
                    <br />
                    (créer l’étape de raffinement à partir d’une formulation
                    claire)
                  </button>

                  <button onClick={() => rejectDraft(draft.id)}>
                    L&apos;une ou les deux de ces reformulations est incorrecte
                    <br />
                    (je reformule mon texte)
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {pivotError && (
          <p style={{ color: 'red', marginTop: 10 }}>
            Erreur : {pivotError}
          </p>
        )}

        {/* Étapes de raffinements (après reformulation validée) */}
        {steps.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <h3>Étapes de raffinements</h3>
            <ol>
              {steps.map((step, index) => (
                <li
                  key={step.id}
                  style={{
                    marginBottom: 12,
                    opacity: step.status === 'rejected' ? 0.5 : 1,
                    textDecoration:
                      step.status === 'rejected' ? 'line-through' : 'none',
                  }}
                >
                  <div>
                    <b>Étape {index + 1}</b>{' '}
                    <span style={{ fontSize: 12, color: 'gray' }}>
                      (
                      {step.status === 'pending'
                        ? 'en attente (à valider par vous)'
                        : step.status === 'validated'
                        ? 'validée par vous'
                        : 'rejetée par vous'}
                      )
                    </span>
                  </div>

                  <div style={{ fontSize: 14, margin: '4px 0' }}>
                    <i>Texte utilisé comme base du modèle :</i> {step.input}
                  </div>

                  <div style={{ fontSize: 14 }}>
                    <i>Éléments pivot :</i>
                    <ul>
                      {step.elements.map((el) => (
                        <li key={el.name}>
                          <code>{el.kind}</code> — <b>{el.name}</b>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Plus tard : affichage éventuel des contributions typées */}
                  {/* Pour l’instant, contributions[] reste vide */}
                  {step.status === 'pending' && (
                    <div style={{ marginTop: 4 }}>
                      <button
                        onClick={() =>
                          updateStepStatus(step.id, 'validated')
                        }
                        style={{ marginRight: 8 }}
                      >
                        Valider cette étape
                      </button>
                      <button
                        onClick={() =>
                          updateStepStatus(step.id, 'rejected')
                        }
                      >
                        Rejeter cette étape
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Petit résumé du modèle interne (pour debug) */}
        <div style={{ marginTop: 30, fontSize: 13, color: 'gray' }}>
          <h4>Résumé (technique) du modèle interne</h4>
          <p>
            Étapes validées : <b>{modele.steps.length}</b>
          </p>
          <p>
            Textes cumulés :{' '}
            {modele.texts.length === 0
              ? '(aucun pour l’instant)'
              : modele.texts.join(' | ')}
          </p>
          <p>
            TEMP : <b>{modele.TEMP.length}</b> —{' '}
            {modele.TEMP.map((e) => e.name).join(', ') || '—'}
          </p>
          <p>
            CONST : <b>{modele.CONST.length}</b> —{' '}
            {modele.CONST.map((e) => e.name).join(', ') || '—'}
          </p>
          <p>
            PARAM : <b>{modele.PARAM.length}</b> —{' '}
            {modele.PARAM.map((e) => e.name).join(', ') || '—'}
          </p>
          <p>
            AUX : <b>{modele.AUX.length}</b> —{' '}
            {modele.AUX.map((e) => e.name).join(', ') || '—'}
          </p>
          <p>
            AUX_STABLE : <b>{modele.AUX_STABLE.length}</b> —{' '}
            {modele.AUX_STABLE.map((e) => e.name).join(', ') || '—'}
          </p>
          <p>
            Contributions (structure prête, encore vides) :{' '}
            {modele.contributions.length === 0
              ? '(aucune contribution typée encore)'
              : modele.contributions.join(', ')}
          </p>
        </div>
      </section>
      {/* --- Fin prototype Langage Pivot --- */}
    </main>
  );
}

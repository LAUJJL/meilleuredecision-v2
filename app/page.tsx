'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { ElementPivot } from '@/lib/pivot'; // <-- à créer dans lib/pivot.ts

interface Problem {
  id: number;
  name: string;
  shortDef: string;
}

export default function HomePage() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [name, setName] = useState('');
  const [shortDef, setShortDef] = useState('');

  // --- états pour le prototype Langage Pivot ---
  const [pivotInput, setPivotInput] = useState('');
  const [pivotElements, setPivotElements] = useState<ElementPivot[] | null>(null);
  const [pivotLoading, setPivotLoading] = useState(false);
  const [pivotError, setPivotError] = useState<string | null>(null);
  // ------------------------------------------------

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
    setName(''); setShortDef('');
  };

  const deleteProblem = (id: number) => {
    if (!confirm('Supprimer ce problème ?')) return;
    save(problems.filter(p => p.id !== id));
  };

  const selectProblem = (p: Problem) => {
    localStorage.setItem('currentProblem', JSON.stringify(p));
  };

  // --- appel API /api/refine pour le prototype Langage Pivot ---
  const handlePivotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pivotInput.trim()) return;

    setPivotLoading(true);
    setPivotError(null);
    setPivotElements(null);

    try {
      const res = await fetch('/api/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: pivotInput }),
      });

      if (!res.ok) {
        throw new Error(`Erreur HTTP ${res.status}`);
      }

      const data = await res.json();
      setPivotElements(data.elements ?? []);
    } catch (err: any) {
      setPivotError(err.message ?? 'Erreur inconnue');
    } finally {
      setPivotLoading(false);
    }
  };
  // -------------------------------------------------------------

  return (
    <main style={{ padding: 40 }}>
      <h1>
        Problèmes{' '}
        <small style={{ fontSize: 14, color: 'gray' }}>(gestion)</small>
      </h1>

      <section style={{ marginTop: 20 }}>
        <h3>Ouvrir un problème existant</h3>
        {problems.length === 0 && <p>Aucun problème pour l’instant.</p>}
        {problems.map(p => (
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
          onChange={e => setName(e.target.value)}
          style={{ display: 'block', width: '100%', marginBottom: 8 }}
        />
        <input
          placeholder="Définition courte (1 ligne, optionnel)"
          value={shortDef}
          onChange={e => setShortDef(e.target.value)}
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

      {/* --- Prototype Langage Pivot --- */}
      <section>
        <h2>Prototype Langage Pivot (démo interne)</h2>
        <p style={{ maxWidth: 600 }}>
          Saisissez une idée ou un problème. Le site l’envoie à l’API /api/refine,
          qui renvoie une liste d’éléments du langage pivot (TEMP, AUX, AUX_STABLE, etc.).
        </p>

        <form onSubmit={handlePivotSubmit} style={{ marginTop: 10 }}>
          <textarea
            value={pivotInput}
            onChange={e => setPivotInput(e.target.value)}
            rows={4}
            style={{ width: '100%', padding: 8, marginBottom: 8 }}
            placeholder="Ex : Comment structurer le choix entre deux projets d’investissement ?"
          />
          <button type="submit" disabled={pivotLoading || !pivotInput.trim()}>
            {pivotLoading ? 'Analyse en cours…' : 'Envoyer au moteur de raffinements'}
          </button>
        </form>

        {pivotError && (
          <p style={{ color: 'red', marginTop: 10 }}>
            Erreur : {pivotError}
          </p>
        )}

        {pivotElements && (
          <div style={{ marginTop: 15 }}>
            <h3>Éléments du langage pivot retournés</h3>
            {pivotElements.length === 0 && <p>Aucun élément.</p>}
            <ul>
              {pivotElements.map(el => (
                <li key={el.name}>
                  <code>{el.kind}</code> — <b>{el.name}</b>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
      {/* --- Fin prototype Langage Pivot --- */}
    </main>
  );
}

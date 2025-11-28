'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Problem {
  id: number;
  name: string;
  shortDef: string;
}

export default function HomePage() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [name, setName] = useState('');
  const [shortDef, setShortDef] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem('problems');
    if (saved) setProblems(JSON.parse(saved));
  }, []);

  const save = (list: Problem[]) => {
    setProblems(list);
    if (typeof window !== 'undefined') {
      localStorage.setItem('problems', JSON.stringify(list));
    }
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
    if (typeof window !== 'undefined') {
      localStorage.setItem('currentProblem', JSON.stringify(p));
    }
  };

  return (
    <main style={{ padding: 40, maxWidth: 900, margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      <h1>Problèmes</h1>
      <p style={{ color: '#555' }}>
        Choisissez un problème, ou créez-en un nouveau. Chaque problème pourra ensuite avoir plusieurs visions,
        et chaque vision sa propre suite de raffinements.
      </p>

      <section style={{ marginTop: 20 }}>
        <h2 style={{ fontSize: 18 }}>Problèmes existants</h2>
        {problems.length === 0 && <p>Aucun problème pour l’instant.</p>}
        {problems.map((p) => (
          <div key={p.id} style={{ marginBottom: 6 }}>
            <b>{p.name}</b> — {p.shortDef || 'pas de définition courte'}{' '}
            <Link href="/visions" onClick={() => selectProblem(p)}>
              <u>Ouvrir les visions de ce problème</u>
            </Link>{' '}
            <button
              onClick={() => deleteProblem(p.id)}
              style={{
                color: 'red',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                marginLeft: 8,
              }}
            >
              Supprimer
            </button>
          </div>
        ))}
      </section>

      <hr style={{ margin: '20px 0' }} />

      <section>
        <h2 style={{ fontSize: 18 }}>Créer un nouveau problème</h2>
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
        <button onClick={addProblem} style={{ padding: '6px 12px', cursor: 'pointer' }}>
          Créer le problème
        </button>
      </section>

      <button
        onClick={() => {
          if (confirm('Tout effacer (problèmes et problème courant) ?')) {
            setProblems([]);
            if (typeof window !== 'undefined') {
              localStorage.removeItem('problems');
              localStorage.removeItem('currentProblem');
            }
          }
        }}
        style={{ marginTop: 20, padding: '6px 12px', cursor: 'pointer' }}
      >
        Réinitialiser les problèmes
      </button>
    </main>
  );
}

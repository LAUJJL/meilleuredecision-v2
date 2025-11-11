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
    const saved = localStorage.getItem('problems');
    if (saved) setProblems(JSON.parse(saved));
  }, []);

  const save = (list: Problem[]) => {
    setProblems(list);
    localStorage.setItem('problems', JSON.stringify(list));
  };

  const addProblem = () => {
    if (!name.trim()) return;
    const newProblem: Problem = {
      id: Date.now(),
      name,
      shortDef
    };
    save([...problems, newProblem]);
    setName('');
    setShortDef('');
  };

  const deleteProblem = (id: number) => {
    if (!confirm('Supprimer ce problème ?')) return;
    save(problems.filter(p => p.id !== id));
  };

  const selectProblem = (p: Problem) => {
    localStorage.setItem('currentProblem', JSON.stringify(p));
  };

  return (
    <main style={{ padding: 40 }}>
      <h1>Problèmes <small style={{ fontSize: 14, color: 'gray' }}>(gestion)</small></h1>

      <section style={{ marginTop: 20 }}>
        <h3>Ouvrir un problème existant</h3>
        {problems.length === 0 && <p>Aucun problème pour l’instant.</p>}
        {problems.map(p => (
          <div key={p.id}>
            <b>{p.name}</b> — {p.shortDef || 'pas de définition courte'}{' '}
            <Link href="/visions" onClick={() => selectProblem(p)}>Ouvrir</Link>{' '}
            <button onClick={() => deleteProblem(p.id)} style={{ color: 'red', background: 'none', border: 'none', cursor: 'pointer' }}>
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
        <button onClick={addProblem}>Créer le problème (puis choisir/créer sa vision)</button>
      </section>

      <button
        onClick={() => {
          if (confirm('Réinitialiser la sélection et tout effacer ?')) {
            localStorage.clear();
            setProblems([]);
          }
        }}
        style={{ marginTop: 20 }}
      >
        Réinitialiser la sélection
      </button>
    </main>
  );
}

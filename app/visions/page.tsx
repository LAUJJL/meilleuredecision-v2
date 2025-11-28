'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

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

function visionsKey(problemId: number) {
  return `visions_${problemId}`;
}

export default function VisionsPage() {
  const [currentProblem, setCurrentProblem] = useState<Problem | null>(null);
  const [visions, setVisions] = useState<Vision[]>([]);
  const [name, setName] = useState('');
  const [longDef, setLongDef] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const stored = localStorage.getItem('currentProblem');
    if (stored) {
      try {
        const p: Problem = JSON.parse(stored);
        setCurrentProblem(p);

        const vStored = localStorage.getItem(visionsKey(p.id));
        if (vStored) {
          setVisions(JSON.parse(vStored));
        }
      } catch {
        setCurrentProblem(null);
      }
    }
  }, []);

  const saveVisions = (list: Vision[]) => {
    setVisions(list);
    if (typeof window !== 'undefined' && currentProblem) {
      localStorage.setItem(visionsKey(currentProblem.id), JSON.stringify(list));
    }
  };

  const addVision = () => {
    if (!name.trim()) return;
    const newVision: Vision = {
      id: Date.now(),
      name,
      longDef,
    };
    saveVisions([...visions, newVision]);
    setName('');
    setLongDef('');
  };

  const deleteVision = (id: number) => {
    if (!confirm('Supprimer cette vision ?')) return;
    saveVisions(visions.filter((v) => v.id !== id));
  };

  const selectVision = (v: Vision) => {
    if (typeof window !== 'undefined' && currentProblem) {
      localStorage.setItem(
        'currentVision',
        JSON.stringify({
          problem: currentProblem,
          vision: v,
        })
      );
    }
  };

  return (
    <main style={{ padding: 40, maxWidth: 900, margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      <h1>Visions</h1>

      {currentProblem ? (
        <section
          style={{
            padding: 12,
            borderRadius: 8,
            border: '1px solid #ccc',
            marginBottom: 16,
            background: '#f9f9ff',
          }}
        >
          <div style={{ fontSize: 13, color: '#555' }}>Problème en cours :</div>
          <div>
            <b>{currentProblem.name}</b>
            {currentProblem.shortDef && <span> — {currentProblem.shortDef}</span>}
          </div>
          <div style={{ marginTop: 4 }}>
            <Link href="/">
              <u>Changer de problème</u>
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
            Aucun problème sélectionné. Retournez à la page d’accueil pour choisir un problème.
          </div>
          <div style={{ marginTop: 4 }}>
            <Link href="/">
              <u>Aller aux problèmes</u>
            </Link>
          </div>
        </section>
      )}

      <section style={{ marginTop: 20 }}>
        <h2 style={{ fontSize: 18 }}>Visions existantes</h2>
        {visions.length === 0 && <p>Aucune vision pour l’instant.</p>}
        {visions.map((v) => (
          <div
            key={v.id}
            style={{
              marginBottom: 10,
              padding: 8,
              borderRadius: 6,
              border: '1px solid #ddd',
              background: '#fff',
            }}
          >
            <div>
              <b>{v.name}</b>
            </div>
            <div style={{ fontSize: 13, color: '#555', marginTop: 4 }}>
              {v.longDef || <i>(pas de définition longue)</i>}
            </div>
            <div style={{ marginTop: 6 }}>
              <Link href="/refinements" onClick={() => selectVision(v)}>
                <u>Ouvrir les raffinements</u>
              </Link>{' '}
              |{' '}
              <Link href="/visions/view" onClick={() => selectVision(v)}>
                <u>Voir la vision</u>
              </Link>{' '}
              <button
                onClick={() => deleteVision(v.id)}
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
          </div>
        ))}
      </section>

      <hr style={{ margin: '20px 0' }} />

      <section>
        <h2 style={{ fontSize: 18 }}>Créer une nouvelle vision</h2>
        <input
          placeholder="Nom de la vision"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ display: 'block', width: '100%', marginBottom: 8 }}
        />
        <textarea
          placeholder="Définition longue de la vision (vous pouvez aussi préciser vos objectifs minimums et les stocks qui les mesurent)…"
          value={longDef}
          onChange={(e) => setLongDef(e.target.value)}
          rows={4}
          style={{ display: 'block', width: '100%', marginBottom: 8, padding: 6, fontFamily: 'inherit' }}
        />
        <button onClick={addVision} style={{ padding: '6px 12px', cursor: 'pointer' }}>
          Créer la vision
        </button>
      </section>
    </main>
  );
}

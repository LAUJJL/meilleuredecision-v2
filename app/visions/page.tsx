'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Vision {
  id: number;
  name: string;
  shortDef: string;
}

export default function VisionsPage() {
  const router = useRouter();
  const [problem, setProblem] = useState<{ id: number; name: string } | null>(null);
  const [visions, setVisions] = useState<Vision[]>([]);
  const [selectedVision, setSelectedVision] = useState<Vision | null>(null);
  const [name, setName] = useState('');
  const [shortDef, setShortDef] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('currentProblem');
    if (!saved) {
      router.push('/');
      return;
    }
    const p = JSON.parse(saved);
    setProblem(p);

    const allVisions = JSON.parse(localStorage.getItem('visions') || '{}');
    setVisions(allVisions[p.id] || []);
  }, []);

  const saveVisions = (list: Vision[]) => {
    if (!problem) return;
    const all = JSON.parse(localStorage.getItem('visions') || '{}');
    all[problem.id] = list;
    localStorage.setItem('visions', JSON.stringify(all));
    setVisions(list);
  };

  const addVision = () => {
    if (!name.trim()) return;
    const newVision: Vision = { id: Date.now(), name, shortDef };
    saveVisions([...visions, newVision]);
    setName('');
    setShortDef('');
  };

  const deleteVision = (id: number) => {
    if (!confirm('Supprimer cette vision ?')) return;
    saveVisions(visions.filter(v => v.id !== id));
  };

  const openVision = (v: Vision) => {
    setSelectedVision(v);
    localStorage.setItem('currentVision', JSON.stringify(v));
  };

  return (
    <main style={{ padding: 40 }}>
      <nav style={{ marginBottom: 20 }}>
        <Link href="/">Accueil</Link> → <b>Visions</b>
      </nav>

      <h2>Visions du problème : {problem?.name}</h2>
      <p style={{ color: 'gray' }}>
        Cette page est <b>client</b>. Elle contient les visions du problème sélectionné.
      </p>

      <section style={{ marginTop: 20 }}>
        <h3>Ouvrir une vision existante</h3>
        {visions.length === 0 && <p>Aucune vision pour ce problème.</p>}
        {visions.map(v => (
          <div key={v.id}>
            {v.name} — {v.shortDef || 'pas de définition courte'}{' '}
            <button onClick={() => openVision(v)}>Ouvrir</button>{' '}
            <button onClick={() => deleteVision(v.id)} style={{ color: 'red', background: 'none', border: 'none', cursor: 'pointer' }}>
              Supprimer
            </button>
          </div>
        ))}
      </section>

      <hr style={{ margin: '20px 0' }} />

      <section>
        <h3>Créer une nouvelle vision</h3>
        <input
          placeholder="Nom de la vision"
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
        <button onClick={addVision}>Créer la vision</button>
      </section>

      <hr style={{ margin: '20px 0' }} />

      <button
        onClick={() => router.push('/phase2')}
        disabled={!selectedVision}
        style={{
          background: selectedVision ? '#0070f3' : 'gray',
          color: 'white',
          border: 'none',
          padding: '8px 16px',
          borderRadius: 6,
          cursor: selectedVision ? 'pointer' : 'not-allowed'
        }}
      >
        Aller à la phase 2
      </button>
    </main>
  );
}

'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Vision {
  id: number;
  name: string;
  shortDef: string;
  phase1Done?: boolean; // ✅ indicateur de validation Phase 1
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
    if (!saved) { router.push('/'); return; }
    const p = JSON.parse(saved);
    setProblem(p);

    const allVisions = JSON.parse(localStorage.getItem('visions') || '{}');
    setVisions(allVisions[p.id] || []);
    const cur = localStorage.getItem('currentVision');
    if (cur) setSelectedVision(JSON.parse(cur));
  }, [router]);

  const saveVisions = (list: Vision[]) => {
    if (!problem) return;
    const all = JSON.parse(localStorage.getItem('visions') || '{}');
    all[problem.id] = list;
    localStorage.setItem('visions', JSON.stringify(all));
    setVisions(list);
  };

  const addVision = () => {
    if (!name.trim()) return;
    const newVision: Vision = { id: Date.now(), name, shortDef, phase1Done: false };
    saveVisions([...visions, newVision]);
    setName(''); setShortDef('');
  };

  const deleteVision = (id: number) => {
    if (!confirm('Supprimer cette vision ?')) return;
    saveVisions(visions.filter(v => v.id !== id));
    const cur = localStorage.getItem('currentVision');
    if (cur && JSON.parse(cur).id === id) localStorage.removeItem('currentVision');
  };

  const openVision = (v: Vision) => {
    setSelectedVision(v);
    localStorage.setItem('currentVision', JSON.stringify(v));
  };

  const goPhase1 = () => {
    if (!selectedVision) return;
    router.push('/phase1');
  };

  const canGoPhase2 = !!selectedVision && !!selectedVision.phase1Done;

  return (
    <main style={{ padding: 40 }}>
      <nav style={{ marginBottom: 20 }}>
        <Link href="/">Accueil</Link> → <b>Visions</b>
      </nav>

      <h2>Visions du problème : {problem?.name}</h2>

      <section style={{ marginTop: 20 }}>
        <h3>Ouvrir une vision existante</h3>
        {visions.length === 0 && <p>Aucune vision pour ce problème.</p>}
        {visions.map(v => (
          <div key={v.id} style={{ marginBottom: 6 }}>
            <button onClick={() => openVision(v)} style={{ marginRight: 8 }}>
              Sélectionner
            </button>
            <b>{v.name}</b> — {v.shortDef || 'pas de définition courte'}{' '}
            <span style={{ color: v.phase1Done ? 'green' : 'gray' }}>
              {v.phase1Done ? '• Phase 1 validée' : '• Phase 1 à faire'}
            </span>{' '}
            <button onClick={() => deleteVision(v.id)}
              style={{ color: 'red', background: 'none', border: 'none', cursor: 'pointer' }}>
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

      <div style={{ display: 'flex', gap: 12 }}>
        <button onClick={goPhase1} disabled={!selectedVision}>
          {selectedVision?.phase1Done ? 'Revoir / Modifier la phase 1' : 'Démarrer la phase 1'}
        </button>

        <button
          onClick={() => router.push('/phase2')}
          disabled={!canGoPhase2}
          style={{
            background: canGoPhase2 ? '#0070f3' : 'gray',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: 6,
            cursor: canGoPhase2 ? 'pointer' : 'not-allowed'
          }}
        >
          Aller à la phase 2
        </button>
      </div>
    </main>
  );
}

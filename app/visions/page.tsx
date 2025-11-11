'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Vision {
  id: number;
  name: string;
  longDef: string;       // ⬅️ définition longue (remplace shortDef)
  phase1Done?: boolean;  // indicateur de validation Phase 1
  // phase1 / phase2 restent inchangées si vous les avez déjà ajoutées ailleurs
}

export default function VisionsPage() {
  const router = useRouter();
  const [problem, setProblem] = useState<{ id: number; name: string } | null>(null);
  const [visions, setVisions] = useState<Vision[]>([]);
  const [selectedVision, setSelectedVision] = useState<Vision | null>(null);

  // Formulaire création
  const [name, setName] = useState('');
  const [longDef, setLongDef] = useState(''); // ⬅️ textarea multi-lignes

  useEffect(() => {
    const saved = localStorage.getItem('currentProblem');
    if (!saved) { router.push('/'); return; }
    const p = JSON.parse(saved);
    setProblem(p);

    // Charger les visions du problème
    const allVisionsRaw = localStorage.getItem('visions');
    const allVisions = allVisionsRaw ? JSON.parse(allVisionsRaw) : {};
    const list: any[] = allVisions[p.id] || [];

    // 🔁 Migration simple: si on trouve encore shortDef, on le bascule en longDef
    const migrated: Vision[] = list.map(v => {
      if (v && typeof v === 'object') {
        const hasLong = typeof v.longDef === 'string';
        const hasShort = typeof v.shortDef === 'string';
        if (!hasLong && hasShort) {
          return { ...v, longDef: v.shortDef, shortDef: undefined };
        }
      }
      return v as Vision;
    });

    if (JSON.stringify(migrated) !== JSON.stringify(list)) {
      // sauvegarder migration
      allVisions[p.id] = migrated;
      localStorage.setItem('visions', JSON.stringify(allVisions));
    }
    setVisions(migrated);

    // Recharger la sélection courante si présente
    const cur = localStorage.getItem('currentVision');
    if (cur) {
      const v = JSON.parse(cur);
      // s'assurer que currentVision a bien longDef (migration)
      if (v && typeof v === 'object') {
        if (typeof v.longDef !== 'string' && typeof v.shortDef === 'string') {
          v.longDef = v.shortDef;
          delete v.shortDef;
          localStorage.setItem('currentVision', JSON.stringify(v));
        }
      }
      setSelectedVision(v);
    }
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
    const newVision: Vision = {
      id: Date.now(),
      name: name.trim(),
      longDef: (longDef || '').trim(), // ⬅️ grande zone de texte
      phase1Done: false,
    };
    saveVisions([...(visions || []), newVision]);
    setName('');
    setLongDef('');
  };

  const deleteVision = (id: number) => {
    if (!confirm('Supprimer cette vision ?')) return;
    const next = visions.filter(v => v.id !== id);
    saveVisions(next);
    const cur = localStorage.getItem('currentVision');
    if (cur && JSON.parse(cur).id === id) localStorage.removeItem('currentVision');
    if (selectedVision?.id === id) setSelectedVision(null);
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

  // util pour afficher un extrait court de la définition longue
  const snippet = (txt: string, len = 100) => {
    if (!txt) return '—';
    const t = txt.replace(/\s+/g, ' ').trim();
    return t.length > len ? t.slice(0, len) + '…' : t;
  };

  return (
    <main style={{ padding: 40 }}>
      <nav style={{ marginBottom: 20 }}>
        <Link href="/">Accueil</Link> → <b>Visions</b>
      </nav>

      <h2>Visions du problème : {problem?.name}</h2>

      <section style={{ marginTop: 20 }}>
        <h3>Ouvrir une vision existante</h3>
        {(!visions || visions.length === 0) && <p>Aucune vision pour ce problème.</p>}
        {visions?.map(v => (
          <div key={v.id} style={{ marginBottom: 10 }}>
            <button onClick={() => openVision(v)} style={{ marginRight: 8 }}>
              Sélectionner
            </button>
            <b>{v.name}</b>
            <div style={{ fontSize: 12, color: '#555', marginTop: 2 }}>
              {snippet(v.longDef, 100)}
            </div>
            <div style={{ fontSize: 12, color: v.phase1Done ? 'green' : 'gray' }}>
              {v.phase1Done ? '• Phase 1 validée' : '• Phase 1 à faire'}
            </div>
            <button
              onClick={() => deleteVision(v.id)}
              style={{ color: 'red', background: 'none', border: 'none', cursor: 'pointer', marginTop: 4 }}
            >
              Supprimer
            </button>
          </div>
        ))}
      </section>

      <hr style={{ margin: '20px 0' }} />

      <section>
        <h3>Créer une nouvelle vision</h3>
        <input
          placeholder="Nom de la vision (identification)"
          value={name}
          onChange={e => setName(e.target.value)}
          style={{ display: 'block', width: '100%', marginBottom: 8 }}
        />
        <label style={{ display: 'block', marginBottom: 6 }}>
          Définition longue (plusieurs lignes) — votre représentation complète du problème
        </label>
        <textarea
          placeholder="Décrivez librement et précisément (plusieurs dizaines de lignes possibles)…"
          rows={12}
          value={longDef}
          onChange={e => setLongDef(e.target.value)}
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

'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Vision {
  id: number;
  name: string;
  longDef: string;       // définition longue
  phase1Done?: boolean;  // indicateur de validation Phase 1
}

export default function VisionsPage() {
  const router = useRouter();
  const [problem, setProblem] = useState<{ id: number; name: string } | null>(null);
  const [visions, setVisions] = useState<Vision[]>([]);
  const [selectedVision, setSelectedVision] = useState<Vision | null>(null);

  // Formulaire création
  const [name, setName] = useState('');
  const [longDef, setLongDef] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('currentProblem');
    if (!saved) { router.push('/'); return; }
    const p = JSON.parse(saved);
    setProblem(p);

    // Charger visions par problème
    const allVisionsRaw = localStorage.getItem('visions');
    const allVisions = allVisionsRaw ? JSON.parse(allVisionsRaw) : {};
    const list: any[] = allVisions[p.id] || [];

    // Migration éventuelle shortDef -> longDef
    const migrated: Vision[] = list.map(v => {
      if (v && typeof v === 'object') {
        const hasLong = typeof v.longDef === 'string';
        const hasShort = typeof (v as any).shortDef === 'string';
        if (!hasLong && hasShort) {
          return { ...v, longDef: (v as any).shortDef, shortDef: undefined } as any;
        }
      }
      return v as Vision;
    });

    if (JSON.stringify(migrated) !== JSON.stringify(list)) {
      allVisions[p.id] = migrated;
      localStorage.setItem('visions', JSON.stringify(allVisions));
    }
    setVisions(migrated);

    // Recharger sélection courante si présente
    const cur = localStorage.getItem('currentVision');
    if (cur) {
      const v = JSON.parse(cur);
      if (v && typeof v === 'object') {
        if (typeof v.longDef !== 'string' && typeof v.shortDef === 'string') {
          v.longDef = v.shortDef;
          delete v.shortDef;
          localStorage.setItem('currentVision', JSON.stringify(v));
        }
      }
      // Vérifier qu'elle existe toujours dans la liste
      const stillThere = migrated.find(m => m.id === v.id);
      setSelectedVision(stillThere || null);
      if (!stillThere) localStorage.removeItem('currentVision');
    }
  }, [router]);

  const saveVisions = (list: Vision[]) => {
    if (!problem) return;
    const all = JSON.parse(localStorage.getItem('visions') || '{}');
    all[problem.id] = list;
    localStorage.setItem('visions', JSON.stringify(all));
    setVisions(list);
  };

  const openVision = (v: Vision) => {
    setSelectedVision(v);
    localStorage.setItem('currentVision', JSON.stringify(v));
  };

  const addVision = () => {
    if (!name.trim()) return;
    const newVision: Vision = {
      id: Date.now(),
      name: name.trim(),
      longDef: (longDef || '').trim(),
      phase1Done: false,
    };
    const next = [...(visions || []), newVision];
    saveVisions(next);

    // ✅ Sélectionner automatiquement la nouvelle vision
    openVision(newVision);

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

  const goPhase1 = () => {
    if (!selectedVision) return;
    router.push('/phase1');
  };

  const canGoPhase2 = !!selectedVision && !!selectedVision.phase1Done;

  const snippet = (txt: string, len = 160) => {
    if (!txt) return '—';
    const t = txt.replace(/\s+/g, ' ').trim();
    return t.length > len ? t.slice(0, len) + '…' : t;
  };

  return (
    <main style={{ padding: 40, maxWidth: 900 }}>
      <nav style={{ marginBottom: 20 }}>
        <Link href="/">Accueil</Link> → <b>Visions</b>
      </nav>

      <h2>Visions du problème : {problem?.name}</h2>

      <section style={{ marginTop: 20 }}>
        <h3>Ouvrir une vision existante</h3>
        {(!visions || visions.length === 0) && <p>Aucune vision pour ce problème.</p>}
        <div style={{ display: 'grid', gap: 12 }}>
          {visions?.map(v => {
            const isSelected = selectedVision?.id === v.id;
            return (
              <div
                key={v.id}
                onClick={() => openVision(v)}
                style={{
                  padding: 12,
                  borderRadius: 10,
                  border: `2px solid ${isSelected ? '#2563eb' : '#ddd'}`,
                  background: isSelected ? 'rgba(37,99,235,0.07)' : '#fafafa',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span
                    style={{
                      width: 10, height: 10, borderRadius: 9999,
                      background: isSelected ? '#2563eb' : '#bbb', display: 'inline-block'
                    }}
                    aria-hidden
                  />
                  <b>{v.name}</b>
                </div>
                <div style={{ fontSize: 12, color: '#555', marginTop: 6 }}>
                  {snippet(v.longDef)}
                </div>
                <div style={{ fontSize: 12, color: v.phase1Done ? 'green' : 'gray', marginTop: 4 }}>
                  {v.phase1Done ? '• Phase 1 validée' : '• Phase 1 à faire'}
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteVision(v.id); }}
                  style={{ color: 'red', background: 'none', border: 'none', cursor: 'pointer', marginTop: 6 }}
                >
                  Supprimer
                </button>
              </div>
            );
          })}
        </div>
      </section>

      <hr style={{ margin: '24px 0' }} />

      <section>
        <h3>Créer une nouvelle vision</h3>
        <input
          placeholder="Nom de la vision (identification)"
          value={name}
          onChange={e => setName(e.target.value)}
          style={{ display: 'block', width: '100%', marginBottom: 8, padding: 8, borderRadius: 8, border: '1px solid #ccc' }}
        />
        <label style={{ display: 'block', marginBottom: 6 }}>
          Définition longue (plusieurs lignes) — votre représentation complète du problème
        </label>
        <textarea
          placeholder="Décrivez librement et précisément (plusieurs dizaines de lignes possibles)…"
          rows={10}
          value={longDef}
          onChange={e => setLongDef(e.target.value)}
          style={{ display: 'block', width: '100%', marginBottom: 8, padding: 10, borderRadius: 8, border: '1px solid #ccc' }}
        />
        <button
          onClick={addVision}
          style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: '#111', color: 'white' }}
        >
          Créer la vision
        </button>
      </section>

      <hr style={{ margin: '24px 0' }} />

      <section aria-live="polite" style={{ background: '#f7f7f7', padding: 16, borderRadius: 12 }}>
        <h3 style={{ marginTop: 0 }}>Vision sélectionnée</h3>
        {!selectedVision ? (
          <p>Aucune vision sélectionnée. Cliquez sur une carte ci-dessus pour la choisir.</p>
        ) : (
          <div>
            <p style={{ margin: '4px 0' }}><b>{selectedVision.name}</b></p>
            <p style={{ margin: '4px 0', fontSize: 13, color: '#555' }}>
              {snippet(selectedVision.longDef)}
            </p>
            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <button
                onClick={goPhase1}
                style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: '#111', color: 'white' }}
              >
                {selectedVision.phase1Done ? 'Revoir / Modifier la phase 1' : 'Démarrer la phase 1'}
              </button>

              <button
                onClick={() => router.push('/phase2')}
                disabled={!canGoPhase2}
                style={{
                  padding: '8px 14px',
                  borderRadius: 8,
                  border: 'none',
                  background: canGoPhase2 ? '#2563eb' : 'gray',
                  color: 'white',
                  cursor: canGoPhase2 ? 'pointer' : 'not-allowed'
                }}
              >
                Aller à la phase 2
              </button>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

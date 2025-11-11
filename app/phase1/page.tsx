'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Vision {
  id: number;
  name: string;
  shortDef: string;
  phase1Done?: boolean;
}

export default function Phase1Page() {
  const router = useRouter();
  const [problemId, setProblemId] = useState<number | null>(null);
  const [vision, setVision] = useState<Vision | null>(null);

  useEffect(() => {
    const p = localStorage.getItem('currentProblem');
    const v = localStorage.getItem('currentVision');
    if (!p || !v) { router.push('/visions'); return; }
    setProblemId(JSON.parse(p).id);
    setVision(JSON.parse(v));
  }, [router]);

  const validatePhase1 = () => {
    if (!problemId || !vision) return;
    // marquer phase1Done=true dans le stockage des visions
    const all = JSON.parse(localStorage.getItem('visions') || '{}');
    const list: Vision[] = all[problemId] || [];
    const idx = list.findIndex(x => x.id === vision.id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], phase1Done: true };
      all[problemId] = list;
      localStorage.setItem('visions', JSON.stringify(all));
      localStorage.setItem('currentVision', JSON.stringify(list[idx]));
      setVision(list[idx]);
      alert('Phase 1 validée pour cette vision.');
    }
  };

  return (
    <main style={{ padding: 40 }}>
      <nav style={{ marginBottom: 20 }}>
        <Link href="/">Accueil</Link> → <Link href="/visions">Visions</Link> → <b>Phase 1</b>
      </nav>

      <h2>Phase 1 — {vision?.name || 'vision non sélectionnée'}</h2>
      <p>
        Version minimaliste pour valider le flux. Ici, on mettra ensuite tes champs
        (stock + flux constants, unités, sliders, borne max/min…).
      </p>

      <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
        <button onClick={validatePhase1}>Valider la phase 1</button>
        <button onClick={() => router.push('/visions')}>← Revenir aux visions</button>
        <Link href="/">Accueil</Link>
      </div>
    </main>
  );
}

'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Phase2Page() {
  const router = useRouter();
  const [vision, setVision] = useState<{ id: number; name: string } | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('currentVision');
    if (!saved) {
      router.push('/visions');
      return;
    }
    setVision(JSON.parse(saved));
  }, []);

  return (
    <main style={{ padding: 40 }}>
      <nav style={{ marginBottom: 20 }}>
        <Link href="/">Accueil</Link> → <Link href="/visions">Visions</Link> → <b>Phase 2</b>
      </nav>

      <h2>Phase 2 — {vision?.name || 'aucune vision sélectionnée'}</h2>
      <p>Contenu de la Phase 2 (à compléter selon vos spécifications).</p>

      <div style={{ marginTop: 20 }}>
        <button onClick={() => router.push('/visions')}>← Revenir aux visions</button>{' '}
        <Link href="/">Accueil</Link>
      </div>
    </main>
  );
}

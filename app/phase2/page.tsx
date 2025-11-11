'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Phase2Page() {
  const router = useRouter();
  const [vision, setVision] = useState<{ id: number; name: string; phase1Done?: boolean } | null>(null);

  useEffect(() => {
    const v = localStorage.getItem('currentVision');
    if (!v) { router.push('/visions'); return; }
    const parsed = JSON.parse(v);
    setVision(parsed);
    // Sécurité : pas d’accès si Phase 1 non validée
    if (!parsed.phase1Done) router.push('/phase1');
  }, [router]);

  return (
    <main style={{ padding: 40 }}>
      <nav style={{ marginBottom: 20 }}>
        <Link href="/">Accueil</Link> → <Link href="/visions">Visions</Link> → <b>Phase 2</b>
      </nav>

      <h2>Phase 2 — {vision?.name || 'aucune vision sélectionnée'}</h2>
      <p>Contenu de la Phase 2 (à compléter : modèle, graphiques, etc.).</p>

      <div style={{ marginTop: 20 }}>
        <button onClick={() => router.push('/visions')}>← Revenir aux visions</button>{' '}
        <Link href="/">Accueil</Link>
      </div>
    </main>
  );
}

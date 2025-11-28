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

type CurrentVisionPayload = {
  problem: Problem;
  vision: Vision;
};

export default function VisionViewPage() {
  const [current, setCurrent] = useState<CurrentVisionPayload | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const stored = localStorage.getItem('currentVision');
    if (stored) {
      try {
        const payload: CurrentVisionPayload = JSON.parse(stored);
        setCurrent(payload);
      } catch {
        setCurrent(null);
      }
    }
    setLoaded(true);
  }, []);

  if (!loaded) {
    return (
      <main style={{ padding: 40, fontFamily: 'system-ui, sans-serif' }}>
        <p>Chargement…</p>
      </main>
    );
  }

  if (!current) {
    return (
      <main style={{ padding: 40, fontFamily: 'system-ui, sans-serif' }}>
        <h1>Vision</h1>
        <p style={{ color: '#a00' }}>
          Aucune vision n’est sélectionnée. Retournez à la liste des visions et choisissez-en une.
        </p>
        <Link href="/visions">
          <u>Retour aux visions</u>
        </Link>
      </main>
    );
  }

  const { problem, vision } = current;

  return (
    <main style={{ padding: 40, maxWidth: 900, margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      <h1>Vision — vue détaillée</h1>

      <section
        style={{
          padding: 12,
          borderRadius: 8,
          border: '1px solid #ccc',
          marginBottom: 16,
          background: '#f9f9ff',
        }}
      >
        <div style={{ fontSize: 13, color: '#555' }}>Problème :</div>
        <div>
          <b>{problem.name}</b>
          {problem.shortDef && <span> — {problem.shortDef}</span>}
        </div>
      </section>

      <section
        style={{
          padding: 12,
          borderRadius: 8,
          border: '1px solid #ddd',
          marginBottom: 16,
          background: '#fff',
        }}
      >
        <div style={{ fontSize: 13, color: '#555' }}>Vision :</div>
        <div>
          <b>{vision.name}</b>
        </div>

        <div style={{ marginTop: 10 }}>
          <div style={{ fontSize: 13, color: '#555', marginBottom: 4 }}>Définition longue :</div>
          {vision.longDef ? (
            <div style={{ whiteSpace: 'pre-line' }}>{vision.longDef}</div>
          ) : (
            <div style={{ fontStyle: 'italic', color: '#777' }}>
              Aucun texte n’a encore été saisi pour la définition longue.
            </div>
          )}
        </div>
      </section>

      <section style={{ marginTop: 16 }}>
        <Link href="/visions">
          <u>Retour à la liste des visions</u>
        </Link>

        <span style={{ margin: '0 8px' }}>|</span>

        <Link href="/refinements">
          <u>Ouvrir les raffinements pour cette vision</u>
        </Link>
      </section>
    </main>
  );
}

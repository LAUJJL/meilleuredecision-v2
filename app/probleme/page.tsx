'use client';

import HelpPanel from "../components/HelpPanel";

export default function ProblemePage() {
  return (
    <main
      style={{
        padding: 40,
        maxWidth: 900,
        margin: '0 auto',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      {/* Bouton accueil en haut */}
      <div style={{ marginBottom: 24 }}>
        <a href="/" style={{ textDecoration: 'none', fontSize: 14 }}>
          ← Retour à l’accueil
        </a>
      </div>

      <h1>Définition du problème</h1>
<HelpPanel title="Aide — comment utiliser cette page">
  <p style={{ marginTop: 0 }}>
    Cette page présente le problème sous deux formes :
    une définition courte (repère rapide) et une définition longue (contexte complet).
  </p>

  <p>
    L’idée est simple : avant d’explorer des manières de traiter la situation,
    on s’assure que le problème est posé clairement (horizon, objectif, contexte).
  </p>

  <p style={{ marginBottom: 0 }}>
    Vous pouvez cliquer sur <b>Continuer</b> : l’étape suivante consiste à choisir une manière de traiter
    le problème (les “visions”) puis à l’analyser progressivement.
  </p>
</HelpPanel>

      <section
        style={{
          marginTop: 24,
          padding: 20,
          border: '1px solid #ddd',
          borderRadius: 12,
        }}
      >
        <h2 style={{ marginTop: 0 }}>Définition courte</h2>
        <p>
          <b>
            Comment faire évoluer une situation de trésorerie pour atteindre un
            objectif donné à un horizon donné.
          </b>
        </p>

        <h2>Définition longue</h2>
        <p>
          Je dispose aujourd’hui d’une trésorerie de départ et de flux réguliers
          d’encaissements et de décaissements.
        </p>
        <p>
          Je souhaite atteindre un niveau de trésorerie cible à un horizon de 12
          mois.
        </p>
        <p>
          Plusieurs manières de traiter la situation sont possibles (rester
          salarié, ajouter une activité, changer la manière d’analyser le
          problème).
        </p>
        <p>
          L’objectif est de comparer ces manières de faire, et d’en comprendre
          les implications.
        </p>
      </section>

      {/* Continuer en bas */}
      <div style={{ marginTop: 32 }}>
        <a
          href="/choisir-vision"
          style={{
            display: 'inline-block',
            padding: '10px 18px',
            borderRadius: 10,
            border: '1px solid #ccc',
            textDecoration: 'none',
            fontSize: 16,
          }}
        >
          Continuer
        </a>
      </div>
    </main>
  );
}

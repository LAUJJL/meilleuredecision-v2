'use client';

import HelpPanel from "../components/HelpPanel";

export default function ProblemePage() {
  // Paramètres de l'exemple (V1.5)
  const objectifTresorerie = 10000;      // €
  const horizonMois = 12;               // mois
  const tresorerieDepart = 3000;        // €
  const salaireMensuel = 3000;          // €
  const depensesMensuelles = 2500;      // €

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
          une définition courte (repère rapide) et une définition longue (paramètres + valeurs).
        </p>

        <p>
          L’idée est simple : avant d’explorer des manières de traiter la situation,
          on s’assure que le problème est posé clairement (horizon, objectif, situation actuelle).
        </p>

        <p style={{ marginBottom: 0 }}>
          Vous pouvez cliquer sur <b>Continuer</b> : l’étape suivante établit un premier état
          (objectif atteint ou non), puis vous proposera de choisir une manière de traiter
          le problème (les “visions”).
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

        <p style={{ marginTop: 0 }}>
          <b>Objectif</b> : atteindre <b>{objectifTresorerie.toLocaleString("fr-FR")} €</b> de trésorerie
          au bout de <b>{horizonMois}</b> mois.
        </p>

        <p style={{ marginBottom: 0 }}>
          <b>Situation actuelle</b> :
        </p>
        <ul style={{ marginTop: 8 }}>
          <li>Trésorerie de départ : <b>{tresorerieDepart.toLocaleString("fr-FR")} €</b></li>
          <li>Salaire mensuel : <b>{salaireMensuel.toLocaleString("fr-FR")} €</b></li>
          <li>Dépenses mensuelles : <b>{depensesMensuelles.toLocaleString("fr-FR")} €</b></li>
        </ul>

        <p style={{ marginTop: 12 }}>
          Plusieurs manières de traiter la situation sont possibles (rester salarié, ajouter une micro-activité, etc.).
        </p>
        <p style={{ marginBottom: 0 }}>
          L’objectif est de comparer ces manières de faire, et d’en comprendre les implications.
        </p>
      </section>

      {/* Continuer en bas */}
      <div style={{ marginTop: 32 }}>
        <a
          href="/evaluation"
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

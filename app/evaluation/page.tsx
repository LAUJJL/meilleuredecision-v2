'use client';

export default function EvaluationPage() {
  // Paramètres de l'exemple (doivent rester cohérents avec /probleme)
  const objectifTresorerie = 10000;      // €
  const horizonMois = 12;               // mois
  const tresorerieDepart = 3000;        // €
  const salaireMensuel = 3000;          // €
  const depensesMensuelles = 2500;      // €

  // Verdict "micro-étape" : on pose un état global, sans analyser les causes ici.
  // (Tu pourras raffiner plus tard, mais pour V1.5 on veut un état simple, visible.)
  const etat = "objectif non atteint";

  return (
    <main
      style={{
        padding: 40,
        maxWidth: 900,
        margin: "0 auto",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <a href="/probleme" style={{ textDecoration: "none" }}>
        ← Retour au problème
      </a>

      <h1 style={{ marginTop: 18 }}>Évaluation de l’objectif</h1>

      <section
        style={{
          marginTop: 24,
          padding: 20,
          border: "1px solid #ddd",
          borderRadius: 12,
        }}
      >
        <p style={{ marginTop: 0 }}>
          <b>Objectif</b> : atteindre <b>{objectifTresorerie.toLocaleString("fr-FR")} €</b> de trésorerie
          au bout de <b>{horizonMois}</b> mois.
        </p>

        <p style={{ marginBottom: 0 }}>
          <b>Situation actuelle (rappel)</b> :
        </p>
        <ul style={{ marginTop: 8 }}>
          <li>Trésorerie de départ : <b>{tresorerieDepart.toLocaleString("fr-FR")} €</b></li>
          <li>Salaire mensuel : <b>{salaireMensuel.toLocaleString("fr-FR")} €</b></li>
          <li>Dépenses mensuelles : <b>{depensesMensuelles.toLocaleString("fr-FR")} €</b></li>
        </ul>

        <p style={{ marginTop: 16, marginBottom: 6 }}>
          <b>État du modèle actuel</b> :
        </p>
        <p style={{ marginTop: 0, fontSize: 18 }}>
          ❌ <b>{etat}</b>
        </p>

        <p style={{ marginBottom: 0, color: "#555" }}>
          Ce verdict est établi à partir de la situation initiale, avant l’examen des décisions possibles.
        </p>
      </section>

      <div style={{ marginTop: 32 }}>
        <a
          href="/choisir-vision"
          style={{
            display: "inline-block",
            padding: "10px 18px",
            borderRadius: 10,
            border: "1px solid #ccc",
            textDecoration: "none",
            fontSize: 16,
          }}
        >
          Continuer
        </a>
      </div>
    </main>
  );
}

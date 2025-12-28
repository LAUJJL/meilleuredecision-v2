'use client';

import HelpPanel from "../components/HelpPanel";

export default function ProblemePage() {
  // Valeurs FIXES de l’exemple V1.5
  const tresorerieReelleDepart = 3000;
  const salaireMensuel = 3000;
  const depensesPersonnelles = 2500;
  const objectif = 10000;
  const horizonMois = 12;

  return (
    <main style={{ padding: 40, maxWidth: 900, margin: "0 auto", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 16 }}>
        <a href="/" style={{ textDecoration: "none", fontSize: 14 }}>
          ← Retour à l’accueil
        </a>

        {/* Continuer en haut */}
        <a
          href="/evaluation"
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

      <h1 style={{ marginTop: 18 }}>Définition du problème</h1>

      <HelpPanel title="Aide — comment lire cette page">
        <p style={{ marginTop: 0 }}>
          En V1.5, la structure du problème est imposée : un <b>stock</b> (ici la trésorerie)
          évolue sous l’effet d’<b>encaissements</b> et de <b>décaissements</b>.
        </p>
        <p>
          <b>R1</b> sert à comprendre la mécanique (on peut faire varier stock/flux).
          <b> R2 et R3</b> utilisent ensuite des valeurs fixes pour comparer les visions.
        </p>
        <p style={{ marginBottom: 0 }}>
          Cliquez sur <b>Continuer</b> : l’écran suivant donne un diagnostic global.
        </p>
      </HelpPanel>

      <section style={{ marginTop: 24, padding: 20, border: "1px solid #ddd", borderRadius: 12 }}>
        <h2 style={{ marginTop: 0 }}>Définition courte</h2>
        <p style={{ marginBottom: 0 }}>
          <b>Atteindre une trésorerie minimale à un horizon donné.</b>
        </p>

        <h2 style={{ marginTop: 18 }}>Définition longue (valeurs de l’exemple)</h2>

        <ul style={{ marginTop: 10 }}>
          <li>Trésorerie réelle de départ : <b>{tresorerieReelleDepart.toLocaleString("fr-FR")} €</b></li>
          <li>Salaire mensuel (constant) : <b>{salaireMensuel.toLocaleString("fr-FR")} €</b></li>
          <li>Dépenses personnelles mensuelles (constantes) : <b>{depensesPersonnelles.toLocaleString("fr-FR")} €</b></li>
          <li>Objectif de trésorerie à {horizonMois} mois : <b>{objectif.toLocaleString("fr-FR")} €</b></li>
        </ul>

        <p style={{ marginTop: 10, marginBottom: 0, color: "#555" }}>
          En V1.5, vous choisirez ensuite une vision (rester salarié ou ajouter une activité) et vous verrez
          le raisonnement se construire par raffinements.
        </p>
      </section>

      {/* Continuer en bas */}
      <div style={{ marginTop: 28 }}>
        <a
          href="/evaluation"
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

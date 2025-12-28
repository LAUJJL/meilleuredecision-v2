'use client';

export default function EvaluationPage() {
  const tresorerieReelleDepart = 3000;
  const salaireMensuel = 3000;
  const depensesPersonnelles = 2500;
  const objectif = 10000;
  const horizonMois = 12;

  // Diagnostic simple : stock final = stock départ + horizon*(enc - dec)
  const stockFinal = tresorerieReelleDepart + horizonMois * (salaireMensuel - depensesPersonnelles);
  const ecart = stockFinal - objectif;
  const atteint = ecart >= 0;

  const color = atteint ? "#166534" : "#b91c1c";

  return (
    <main style={{ padding: 40, maxWidth: 900, margin: "0 auto", fontFamily: "system-ui, sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 16 }}>
        <a href="/probleme" style={{ textDecoration: "none", fontSize: 14 }}>
          ← Retour au problème
        </a>

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

      <h1 style={{ marginTop: 18 }}>Évaluation de l’objectif</h1>

      <section style={{ marginTop: 18, padding: 20, border: "1px solid #ddd", borderRadius: 12 }}>
        <p style={{ marginTop: 0 }}>
          <b>Objectif :</b> atteindre <b>{objectif.toLocaleString("fr-FR")} €</b> de trésorerie
          au bout de <b>{horizonMois}</b> mois.
        </p>

        <p style={{ marginTop: 8, marginBottom: 0 }}><b>Valeurs de l’exemple :</b></p>
        <ul style={{ marginTop: 8 }}>
          <li>Trésorerie réelle de départ : <b>{tresorerieReelleDepart.toLocaleString("fr-FR")} €</b></li>
          <li>Salaire mensuel : <b>{salaireMensuel.toLocaleString("fr-FR")} €</b></li>
          <li>Dépenses personnelles mensuelles : <b>{depensesPersonnelles.toLocaleString("fr-FR")} €</b></li>
        </ul>

        <div style={{ marginTop: 14, padding: 12, border: "1px solid #eee", borderRadius: 12 }}>
          <div>
            Trésorerie finale estimée : <b>{stockFinal.toLocaleString("fr-FR")} €</b>
          </div>
          <div style={{ marginTop: 6 }}>
            Verdict :{" "}
            <b style={{ color }}>
              {atteint ? "objectif atteint" : "objectif non atteint"}
            </b>
            {" "}({ecart >= 0 ? "+" : ""}{Math.round(ecart).toLocaleString("fr-FR")} €)
          </div>
        </div>

        <p style={{ marginTop: 12, marginBottom: 0 }}>
          L’étape suivante présente les <b>visions possibles</b> (choix de structure).
        </p>
      </section>

      <div style={{ marginTop: 28 }}>
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

export default function Vision1Page() {
  return (
    <main style={{ maxWidth: 820, margin: "48px auto", padding: 16 }}>
      <h1 style={{ fontSize: 30, marginBottom: 12 }}>Vision 1 — Rester salarié</h1>

      <section style={{ border: "1px solid #e5e5e5", borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, margin: "0 0 8px 0" }}>Définition courte</h2>
        <p style={{ fontSize: 18, lineHeight: 1.6, margin: 0 }}>
          J’aborde le problème en restant uniquement salarié, sans ajouter d’activité complémentaire.
        </p>
      </section>

      <section style={{ border: "1px solid #e5e5e5", borderRadius: 12, padding: 16, marginBottom: 18 }}>
        <h2 style={{ fontSize: 18, margin: "0 0 8px 0" }}>Définition longue</h2>
        <p style={{ fontSize: 18, lineHeight: 1.6, marginTop: 0 }}>
          Dans cette vision, je reprends les éléments de départ (trésorerie initiale, revenus et dépenses)
          comme base pédagogique, en supposant qu’ils restent globalement stables sur l’horizon considéré.
        </p>
        <p style={{ fontSize: 18, lineHeight: 1.6, marginBottom: 0 }}>
          Aucune activité complémentaire n’est prise en compte dans cette vision.
          L’objectif fait partie du problème, mais ne sera introduit qu’au moment prévu par la méthode
          (pas en R1).
        </p>
      </section>

      <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
        <a
          href="/vision-1/r1"
          style={{ display: "inline-block", padding: "10px 14px", border: "1px solid #ccc", borderRadius: 10, textDecoration: "none", fontSize: 16 }}
        >
          Continuer
        </a>
        <a href="/mon-probleme" style={{ textDecoration: "none", fontSize: 16 }}>Retour</a>
      </div>
    </main>
  );
}

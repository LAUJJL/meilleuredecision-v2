export default function MonProblemePage() {
  return (
    <main style={{ maxWidth: 820, margin: "48px auto", padding: 16 }}>
      <h1 style={{ fontSize: 30, lineHeight: 1.2, marginBottom: 16 }}>
        Le problème étudié dans cet exemple
      </h1>

      <section
        style={{
          border: "1px solid #e5e5e5",
          borderRadius: 12,
          padding: 16,
          marginBottom: 16,
        }}
      >
        <h2 style={{ fontSize: 18, margin: "0 0 8px 0" }}>
          Définition courte
        </h2>
        <p style={{ fontSize: 18, lineHeight: 1.6, margin: 0 }}>
          Comment atteindre <strong>10&nbsp;000&nbsp;€</strong> de trésorerie au bout de{" "}
          <strong>12 mois</strong>&nbsp;?
        </p>
      </section>

      <section
        style={{
          border: "1px solid #e5e5e5",
          borderRadius: 12,
          padding: 16,
          marginBottom: 18,
        }}
      >
        <h2 style={{ fontSize: 18, margin: "0 0 8px 0" }}>
          Définition longue
        </h2>

        <p style={{ fontSize: 18, lineHeight: 1.6, marginTop: 0 }}>
          Je pars d’une trésorerie de <strong>3&nbsp;000&nbsp;€</strong>.
          Je suis salarié avec un salaire de <strong>3&nbsp;000&nbsp;€</strong> par mois
          et des dépenses mensuelles de <strong>2&nbsp;500&nbsp;€</strong>.
        </p>

        <p style={{ fontSize: 18, lineHeight: 1.6 }}>
          Mon objectif est d’atteindre <strong>10&nbsp;000&nbsp;€</strong> de trésorerie
          au bout de <strong>12 mois</strong>.
        </p>

        <p style={{ fontSize: 18, lineHeight: 1.6 }}>
          J’ai le choix entre rester salarié, ou adjoindre à mon activité de salarié une activité
          complémentaire qui pourrait, au bout d’un certain temps, apporter{" "}
          <strong>4&nbsp;000&nbsp;€</strong> de revenus supplémentaires, avec{" "}
          <strong>3&nbsp;000&nbsp;€</strong> de dépenses supplémentaires.
        </p>

        <p style={{ fontSize: 16, lineHeight: 1.6, marginBottom: 0 }}>
          Ces données servent de base pédagogique&nbsp;: elles peuvent varier et ne sont pas
          certaines pour le moment.
        </p>
      </section>

      <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
        <a
          href="/vision-1"

          style={{
            display: "inline-block",
            padding: "10px 14px",
            border: "1px solid #ccc",
            borderRadius: 10,
            textDecoration: "none",
            fontSize: 16,
          }}
        >
          Continuer
        </a>

        <a href="/probleme" style={{ textDecoration: "none", fontSize: 16 }}>
          Retour
        </a>
      </div>
    </main>
  );
}

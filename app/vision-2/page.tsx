export default function Vision2Page() {
  return (
    <main style={{ maxWidth: 820, margin: "48px auto", padding: 16 }}>
      <h1 style={{ fontSize: 30, marginBottom: 12 }}>
        Vision 2 — Micro-activité (objectif tôt)
      </h1>

      <section style={{ border: "1px solid #e5e5e5", borderRadius: 12, padding: 16, marginBottom: 16 }}>
        <h2 style={{ fontSize: 18, margin: "0 0 8px 0" }}>Définition courte</h2>
        <p style={{ fontSize: 18, lineHeight: 1.6, margin: 0 }}>
          J’aborde le problème en ajoutant une micro-activité à mon activité salariée,
          afin d’atteindre plus rapidement l’objectif de trésorerie.
        </p>
      </section>

      <section style={{ border: "1px solid #e5e5e5", borderRadius: 12, padding: 16, marginBottom: 18 }}>
        <h2 style={{ fontSize: 18, margin: "0 0 8px 0" }}>Définition longue</h2>
        <p style={{ fontSize: 18, lineHeight: 1.6 }}>
          Dans cette vision, je conserve mon activité salariée et j’envisage
          une activité complémentaire générant des encaissements et des décaissements supplémentaires.
        </p>
        <p style={{ fontSize: 18, lineHeight: 1.6, marginBottom: 0 }}>
          L’objectif minimal est introduit tôt afin de vérifier rapidement
          si cette vision permet ou non de l’atteindre, avant d’entrer dans
          une décomposition plus fine.
        </p>
      </section>

      <div style={{ display: "flex", gap: 14 }}>
        <a
          href="/vision-2/r1"
          style={{ padding: "10px 14px", border: "1px solid #ccc", borderRadius: 10, textDecoration: "none" }}
        >
          Continuer (R1)
        </a>
        <a href="/vision-1/r3" style={{ textDecoration: "none" }}>
          Retour (Vision 1)
        </a>
      </div>
    </main>
  );
}

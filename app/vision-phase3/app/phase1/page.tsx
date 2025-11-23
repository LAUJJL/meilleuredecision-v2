// app/phase1/page.tsx
export default function Phase1Page() {
  return (
    <main
      style={{
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        padding: "2rem",
        maxWidth: "800px",
        margin: "0 auto",
        lineHeight: 1.5,
      }}
    >
      <h1 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>
        Phase 1 — maquette simple
      </h1>

      <p style={{ marginBottom: "1rem" }}>
        Pour l’instant, cette page est <strong>volontairement minimaliste</strong>.
        Elle sert uniquement à tester la navigation entre :
      </p>

      <ul style={{ marginBottom: "1.5rem" }}>
        <li>la page du problème,</li>
        <li>la page des visions,</li>
        <li>et la Phase 2.</li>
      </ul>

      <p style={{ marginBottom: "1.5rem" }}>
        Ensuite, nous remettrons progressivement le contenu réel de la Phase 1
        (stock, flux, graphe…) de façon contrôlée.
      </p>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.75rem",
          marginTop: "1.5rem",
        }}
      >
        <a
          href="/"
          style={{
            padding: "0.6rem 1rem",
            borderRadius: "6px",
            border: "1px solid #ccc",
            textDecoration: "none",
            display: "inline-block",
          }}
        >
          ← Revenir au problème
        </a>

        <a
          href="/visions"
          style={{
            padding: "0.6rem 1rem",
            borderRadius: "6px",
            border: "1px solid #ccc",
            textDecoration: "none",
            display: "inline-block",
          }}
        >
          ← Revenir à la vision
        </a>

        <a
          href="/phase2"
          style={{
            padding: "0.6rem 1rem",
            borderRadius: "6px",
            border: "1px solid #0070f3",
            background: "#0070f3",
            color: "white",
            textDecoration: "none",
            display: "inline-block",
          }}
        >
          Passer à la Phase 2
        </a>
      </div>
    </main>
  );
}

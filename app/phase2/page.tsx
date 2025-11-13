// app/phase2/page.tsx
export default function Phase2Page() {
  return (
    <main
      style={{
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        padding: "2rem",
        maxWidth: "800px",
        margin: "0 auto",
      }}
    >
      <h1 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>
        Phase 2 — maquette simple
      </h1>

      <p style={{ marginBottom: "1.5rem" }}>
        Ici aussi, la page est pour l’instant une maquette. Elle nous sert
        uniquement à vérifier que le passage Phase 1 → Phase 2 fonctionne bien,
        et que l’on peut revenir aux écrans précédents.
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
          href="/phase1"
          style={{
            padding: "0.6rem 1rem",
            borderRadius: "6px",
            border: "1px solid #ccc",
            textDecoration: "none",
            display: "inline-block",
          }}
        >
          ← Revenir à la Phase 1
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
          href="/"
          style={{
            padding: "0.6rem 1rem",
            borderRadius: "6px",
            border: "1px solid #ccc",
            textDecoration: "none",
            display: "inline-block",
          }}
        >
          Accueil (problèmes)
        </a>
      </div>
    </main>
  );
}

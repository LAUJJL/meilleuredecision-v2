// app/choisir-vision/page.tsx
export default function ChoisirVisionPage() {
  return (
    <main style={{ padding: 40, maxWidth: 900, margin: "0 auto", fontFamily: "system-ui" }}>
      <a href="/probleme" style={{ textDecoration: "none" }}>← Retour au problème</a>

      <h1 style={{ marginTop: 18 }}>Choisir une manière de traiter le problème</h1>

      <p>
        Vous allez maintenant explorer trois manières de traiter la situation (trois “visions”).
        Commencez par la plus simple.
      </p>

      <div style={{ display: "grid", gap: 12, marginTop: 18 }}>
        <a href="/parcours?vision=1" style={btnStyle}>
          Vision 1 — Rester salarié
        </a>
        <a href="/parcours?vision=2" style={btnStyle}>
          Vision 2 — Micro-activité (objectif introduit tôt)
        </a>
        <a href="/parcours?vision=3" style={btnStyle}>
          Vision 3 — Micro-activité (objectif introduit tard)
        </a>
      </div>
    </main>
  );
}

const btnStyle: React.CSSProperties = {
  display: "block",
  padding: "14px 16px",
  border: "1px solid #ddd",
  borderRadius: 10,
  textDecoration: "none",
  color: "#111",
};

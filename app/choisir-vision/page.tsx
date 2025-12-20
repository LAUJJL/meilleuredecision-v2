// app/choisir-vision/page.tsx
import HelpPanel from "../components/HelpPanel";


export default function ChoisirVisionPage() {
  return (
    <main style={{ padding: 40, maxWidth: 900, margin: "0 auto", fontFamily: "system-ui" }}>
      <a href="/probleme" style={{ textDecoration: "none" }}>← Retour au problème</a>

      <h1 style={{ marginTop: 18 }}>Choisir une manière de traiter le problème</h1>

<HelpPanel title="Aide — qu’est-ce qu’une “vision” ?">
  <p style={{ marginTop: 0 }}>
    Une <b>vision</b> est une manière de traiter le problème, un point de vue de départ.
    Elle fixe ce que l’on suppose important, et la façon dont on organise l’analyse.
  </p>

  <p>
    Dans cet exemple, chaque vision correspond à une option pratique :
    <b> rester salarié</b> ou <b>ajouter une activité</b> (analysée de deux façons).
  </p>

  <p style={{ marginBottom: 0 }}>
    Conseil : commencez par la <b>Vision 1</b> (la plus simple), puis continuez avec les visions 2 et 3.
  </p>
</HelpPanel>


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

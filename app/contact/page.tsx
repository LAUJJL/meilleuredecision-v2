export default function ContactPage() {
  return (
    <main
      style={{
        maxWidth: 900,
        margin: "48px auto",
        padding: 16,
        fontFamily: "system-ui",
        lineHeight: 1.6,
        color: "#111",
      }}
    >
      <a href="/" style={{ textDecoration: "none" }}>
        ← Retour à l’accueil
      </a>

      <h1 style={{ marginTop: 18, fontSize: 30 }}>Contact</h1>

      <p>
        Ce site est en cours de développement et sert à explorer une méthode d’aide à la décision.
      </p>

      <p>
        Vous pouvez utiliser l’adresse ci-dessous pour :
      </p>

      <ul>
        <li>poser une question,</li>
        <li>signaler un point peu clair,</li>
        <li>faire un retour sur l’exemple proposé,</li>
        <li>être informé des versions suivantes.</li>
      </ul>

      <p style={{ marginTop: 18 }}>
  📧{" "}
  <a href="mailto:contact@decidermieux.com" style={{ textDecoration: "underline" }}>
    contact@decidermieux.com
  </a>
</p>

<p style={{ fontSize: 14, marginTop: 6 }}>
  Si le lien ne s’ouvre pas, copiez-collez l’adresse dans votre messagerie.
</p>


      <p style={{ marginTop: 24, fontSize: 14 }}>
        Il n’y a pas d’inscription automatique ni de suivi des visiteurs.
      </p>
    </main>
  );
}

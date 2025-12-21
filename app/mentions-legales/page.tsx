export default function MentionsLegalesPage() {
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

      <h1 style={{ marginTop: 18, fontSize: 30 }}>Mentions légales</h1>

      <h2 style={{ marginTop: 24, fontSize: 18 }}>Éditeur du site</h2>
      <p>
        Jean-Jacques Laublé
        <br />
        Site édité à titre personnel.
      </p>

      <h2 style={{ marginTop: 24, fontSize: 18 }}>Objet du site</h2>
      <p>
        Le site <b>decidermieux.com</b> présente une démarche d’aide à la réflexion et à la prise de
        décision, au travers d’un exemple guidé.
      </p>
      <p>Les contenus proposés ont une vocation pédagogique et exploratoire.</p>

      <h2 style={{ marginTop: 24, fontSize: 18 }}>Contact</h2>
      <p>
        <a href="mailto:contact@decidermieux.com">contact@decidermieux.com</a>
      </p>

      <h2 style={{ marginTop: 24, fontSize: 18 }}>Hébergement</h2>
      <p>
        Vercel Inc.
        <br />
        440 N Barranca Ave #4133
        <br />
        Covina, CA 91723
        <br />
        États-Unis
        <br />
        <a href="https://vercel.com" target="_blank" rel="noreferrer">
          https://vercel.com
        </a>
      </p>
    </main>
  );
}

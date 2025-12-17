export default function HomePage() {
  return (
    <main style={{ maxWidth: 820, margin: "48px auto", padding: 16 }}>
      <h1 style={{ fontSize: 34, lineHeight: 1.2, marginBottom: 16 }}>
        Aider à prendre de meilleures décisions
      </h1>

      <p style={{ fontSize: 18, lineHeight: 1.6, marginBottom: 18 }}>
        Ce site montre une méthode pour <strong>prendre de meilleures décisions</strong>, lorsque l’on
        hésite, que les enjeux sont importants, ou que l’on ne sait pas encore comment aborder un problème.
      </p>

      <p style={{ fontSize: 18, lineHeight: 1.6, marginBottom: 28 }}>
        Vous suivez un exemple guidé : on commence par définir le problème, puis on explore plusieurs manières de le traiter.
      </p>

      <h2 style={{ fontSize: 22, marginBottom: 12 }}>
        Démarrer l’exemple guidé
      </h2>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <a href="/probleme">Commencer l’exemple guidé</a>
  
      </div>

      <p style={{ fontSize: 13, color: "inherit", marginTop: 28, lineHeight: 1.5 }}>
        Ce site est volontairement simplifié. Il sert à illustrer une méthode et non à couvrir des situations complexes.
        <br />
        Ce qui sera fait ultérieurement : problèmes libres, modèles modifiables, davantage de visions et de raffinements.
      </p>
    </main>
  );
}

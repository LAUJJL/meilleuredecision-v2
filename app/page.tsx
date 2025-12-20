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

       <p style={{ fontSize: 16, lineHeight: 1.6, marginBottom: 18 }}>
  L’objectif de ce site est d’aider un visiteur, ou un groupe de visiteurs,
  à améliorer ses chances de prendre une bonne décision lorsqu’il existe
  plusieurs possibilités.
</p>

<p style={{ fontSize: 16, lineHeight: 1.6, marginBottom: 18 }}>
  Cette aide repose à la fois sur :
  <br />– des éléments qualitatifs (la manière de voir et de structurer la situation),
  <br />– et des éléments quantitatifs (des ordres de grandeur et leurs effets dans le temps).
</p>

<p style={{ fontSize: 16, lineHeight: 1.6, marginBottom: 24 }}>
  Cette première version n’a pas vocation à fournir une aide complète à la décision.
  Elle vise à faire comprendre les bases de la méthode, qui sera développée
  dans les versions suivantes pour traiter des problèmes réels proposés par le visiteur.
</p>

<p style={{ fontSize: 16, lineHeight: 1.6, marginBottom: 32 }}>
  Pour illustrer la démarche, nous utilisons volontairement un problème très simple.
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

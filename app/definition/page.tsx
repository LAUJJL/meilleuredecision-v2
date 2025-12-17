import Link from 'next/link';

export default async function DefinitionPage({
  searchParams,
}: {
  searchParams?: Promise<{ type?: string }>;
}) {
  const sp = (await searchParams) ?? {};
  const type = sp.type === 'long' ? 'long' : 'short';

  return (
    <main style={{ padding: 40, maxWidth: 980, margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 16 }}>
        <h1 style={{ margin: 0 }}>Définition du problème (prérempli)</h1>
        <Link href="/" style={{ textDecoration: 'underline' }}>
          Retour
        </Link>
      </header>

      <hr style={{ margin: '18px 0' }} />

      {type === 'short' ? (
        <section style={{ padding: 16, border: '1px solid #ddd', borderRadius: 10 }}>
          <h2 style={{ marginTop: 0 }}>Version courte</h2>
          <p style={{ marginTop: 0, color: '#333' }}>
            Problème de trésorerie : un <b>stock</b> évolue sur un horizon via des <b>encaissements</b> et{' '}
            <b>décaissements</b>. On fixe un <b>objectif minimal</b> de stock à l’horizon, puis on peut ajouter une{' '}
            <b>activité</b> qui modifie les flux à partir d’une période.
          </p>
        </section>
      ) : (
        <section style={{ padding: 16, border: '1px solid #ddd', borderRadius: 10 }}>
          <h2 style={{ marginTop: 0 }}>Version longue</h2>

          <p style={{ marginTop: 0, color: '#333' }}>
            Ce site illustre une méthode <b>top-down</b> : on part d’un problème général, on choisit une <b>vision</b>{' '}
            (cadrage avec hypothèses), puis on déroule des <b>raffinements</b> successifs.
          </p>

          <ul style={{ color: '#333', marginTop: 10 }}>
            <li>
              <b>R1 — Structure minimale commune</b> : stock + flux (encaissements/décaissements) + horizon.
            </li>
            <li>
              <b>R2 — Objectif minimal</b> : objectif_stock (valeur) évalué sur le modèle courant à l’horizon.
            </li>
            <li>
              <b>R3 — Activité ajoutée</b> : revenus/dépenses additionnels à partir d’une période, jusqu’à la fin.
            </li>
          </ul>

          <p style={{ color: '#333', marginBottom: 0 }}>
            Modèle d’évaluation : <b>stock_final</b> = stock à la fin de l’horizon, <b>écart</b> = stock_final −
            objectif_stock, et <b>atteint</b> = (écart ≥ 0). Cette évaluation dépend du modèle courant, donc peut varier
            lorsque l’on ajoute une activité (R3).
          </p>
        </section>
      )}

      <div style={{ marginTop: 14, color: '#2563eb' }}>
        <Link href="/definition?type=short" style={{ textDecoration: 'underline', marginRight: 12 }}>
          Courte
        </Link>
        <Link href="/definition?type=long" style={{ textDecoration: 'underline', marginRight: 12 }}>
          Longue
        </Link>
        <a href="/choisir-vision.html" style={{ textDecoration: 'underline' }}>
          Démarrer (prérempli)
        </a>
      </div>
    </main>
  );
}

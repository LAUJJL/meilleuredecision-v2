import Link from 'next/link';

export default async function MethodePage({
  searchParams,
}: {
  searchParams?: Promise<{ type?: string }>;
}) {
  const sp = (await searchParams) ?? {};
  const type = sp.type === 'long' ? 'long' : 'short';

  return (
    <main style={{ padding: 40, maxWidth: 980, margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 16 }}>
        <h1 style={{ margin: 0 }}>Méthode (top-down)</h1>
        <Link href="/" style={{ textDecoration: 'underline' }}>
          Accueil
        </Link>
      </header>

      <hr style={{ margin: '18px 0' }} />

      {type === 'short' ? (
        <section style={{ padding: 16, border: '1px solid #ddd', borderRadius: 10 }}>
          <h2 style={{ marginTop: 0 }}>Version courte</h2>
          <p style={{ marginTop: 0, color: '#333' }}>
            Top-down : Problème → Vision → Raffinements (R1/R2/R3). Une fois validé : lecture seule.
          </p>
        </section>
      ) : (
        <section style={{ padding: 16, border: '1px solid #ddd', borderRadius: 10 }}>
          <h2 style={{ marginTop: 0 }}>Version longue</h2>

          <ul style={{ color: '#333', marginTop: 10 }}>
            <li>
              <b>R1</b> : stock + encaissements + décaissements + horizon (tableau début/fin).
            </li>
            <li>
              <b>R2</b> : objectif minimal à l’horizon, avec évaluation dynamique.
            </li>
            <li>
              <b>R3</b> : activité ajoutée (revenus/dépenses additionnels) à partir d’une période.
            </li>
          </ul>

          <div style={{ marginTop: 10, padding: 12, border: '1px dashed #ccc', borderRadius: 10, color: '#333' }}>
            <div>objectif_stock : constante (valeur + unité)</div>
            <div>stock_final = stock_fin(horizon)</div>
            <div>écart = stock_final − objectif_stock</div>
            <div>atteint = (écart ≥ 0)</div>
            <div style={{ marginTop: 8, color: '#666' }}>
              Règle : stock_final / écart / atteint sont évalués sur le modèle courant.
            </div>
          </div>
        </section>
      )}

      <div style={{ marginTop: 14, color: '#2563eb' }}>
        <Link href="/methode?type=short" style={{ textDecoration: 'underline', marginRight: 12 }}>
          Courte
        </Link>
        <Link href="/methode?type=long" style={{ textDecoration: 'underline', marginRight: 12 }}>
          Longue
        </Link>
        <Link href="/refinements" style={{ textDecoration: 'underline' }}>
          Raffinements
        </Link>
      </div>
    </main>
  );
}

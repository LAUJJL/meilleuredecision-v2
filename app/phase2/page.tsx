import Link from "next/link";

export default function Phase2Page() {
  // … votre contenu Phase 2 (UI, graphiques, etc.)
  // surtout PAS d'import de "../../refinements/page"
  return (
    <main className="p-6">
      <h1 className="text-xl font-semibold">Phase 2</h1>

      {/* Exemple : bouton de retour vers les visions */}
      <div className="mt-4">
        <Link href="/refinements" className="px-3 py-2 border rounded">
          ← Revenir aux visions
        </Link>
      </div>

      {/* … le reste de la Phase 2 … */}
    </main>
  );
}

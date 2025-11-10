// app/phase2/page.tsx
import Link from "next/link";

export default function Phase2Page() {
  return (
    <main className="p-6">
      <h1 className="text-xl font-semibold">Phase 2</h1>

      {/* … votre contenu Phase 2 … */}

      <div className="mt-4">
        <Link href="/refinements" className="px-3 py-2 border rounded">
          ← Revenir aux visions
        </Link>
      </div>
    </main>
  );
}

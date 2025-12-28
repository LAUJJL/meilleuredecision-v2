// app/page.tsx
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">
        Décider mieux
      </h1>

      <p className="mt-4 text-lg">
        Une méthode simple pour clarifier un problème et comparer des options.
      </p>

      <p className="mt-3 text-base opacity-80">
        Exemple guidé : un problème de trésorerie, construit étape par étape.
      </p>

      <div className="mt-10">
        <Link
          href="/probleme"
          className="inline-flex items-center justify-center rounded-md border px-5 py-3 text-base font-medium shadow-sm"
        >
          ▶︎ Démarrer l’exemple guidé
        </Link>
      </div>

      <footer className="mt-16 flex gap-6 text-sm opacity-70">
        <Link href="/mentions-legales" className="hover:underline">
          Mentions légales
        </Link>
        <Link href="/contact" className="hover:underline">
          Contact
        </Link>
      </footer>
    </main>
  );
}

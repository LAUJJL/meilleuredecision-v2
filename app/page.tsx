// app/page.tsx
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      {/* Texte principal */}
      <section className="space-y-5">
        <h1 className="text-3xl font-semibold tracking-tight">
          Un problème flou peut devenir clair — étape par étape.
        </h1>

        <p className="text-lg">
          Clarifier un problème est la première condition pour décider mieux.
        </p>

        <p className="text-base opacity-80">
          Voyez comment un raisonnement se construit par raffinements successifs.
        </p>
      </section>

      {/* Action principale */}
      <section className="mt-10 space-y-3">
        <Link
          href="/probleme"
          className="inline-flex items-center justify-center rounded-md border px-5 py-3 text-base font-medium shadow-sm"
        >
          ▶︎ Voir un exemple guidé
        </Link>

        <p className="text-sm opacity-70">
          Aucune inscription. Aucun engagement.
        </p>
      </section>

      {/* Liens secondaires */}
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

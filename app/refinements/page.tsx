// app/refinements/page.tsx
// ⚠️ ROUTE SERVEUR UNIQUEMENT — NE PAS IMPORTER AILLEURS
// (Pas de "use client" ni de hooks ici)

import ClientPage from "./ClientPage";

export default function Page() {
  return <ClientPage />;
}

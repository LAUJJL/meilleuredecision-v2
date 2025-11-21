// app/visions/page.tsx
type SearchParams = {
  [key: string]: string | string[] | undefined;
};

export default function VisionsDebugPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const problemId =
    typeof searchParams.problemId === "string" ? searchParams.problemId : "";
  const problemName =
    typeof searchParams.problemName === "string"
      ? searchParams.problemName
      : "";
  const problemShort =
    typeof searchParams.problemShort === "string"
      ? searchParams.problemShort
      : "";

  return (
    <div style={{ maxWidth: 900, margin: "2rem auto", padding: "0 1rem" }}>
      <h1 style={{ fontSize: "1.6rem", marginBottom: "1rem" }}>
        Page visions – mode diagnostic
      </h1>

      <p>
        <strong>problemId :</strong> «{problemId || "(vide)"}»
      </p>
      <p>
        <strong>problemName :</strong> «{problemName || "(vide)"}»
      </p>
      <p>
        <strong>problemShort :</strong> «{problemShort || "(vide)"}»
      </p>

      <h2 style={{ marginTop: "2rem" }}>searchParams complet</h2>
      <pre
        style={{
          background: "#f5f5f5",
          padding: "1rem",
          borderRadius: 8,
          overflowX: "auto",
        }}
      >
        {JSON.stringify(searchParams, null, 2)}
      </pre>

      <p style={{ marginTop: "1.5rem", color: "#666" }}>
        Tant que cette page est en mode diagnostic, les visions ne sont pas
        affichées ni modifiées. L’objectif est uniquement de vérifier ce que
        Next.js reçoit depuis l’URL.
      </p>
    </div>
  );
}

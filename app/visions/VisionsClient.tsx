"use client";

type VisionsClientProps = {
  problemId: string;
  problemName: string;
  problemShort: string;
};

export default function VisionsClient({
  problemId,
  problemName,
  problemShort,
}: VisionsClientProps) {
  return (
    <main
      style={{
        maxWidth: "800px",
        margin: "2rem auto",
        padding: "1.5rem",
        border: "1px solid #ddd",
        borderRadius: "8px",
      }}
    >
      <h1>Visions du problème</h1>
      <p>Id : {problemId}</p>
      <p>Nom : {problemName}</p>
      <p>Définition courte : {problemShort}</p>
    </main>
  );
}

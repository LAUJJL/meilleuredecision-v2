// app/visions/page.tsx
import VisionsClient from "./VisionsClient";

type SearchParams = { [key: string]: string | string[] | undefined };

function firstValue(value: string | string[] | undefined): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && value.length > 0) return value[0];
  return "";
}

export default function VisionsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const problemId = firstValue(searchParams.problemId);
  const problemName = firstValue(searchParams.problemName);
  const problemShort = firstValue(searchParams.problemShort);

  return (
    <VisionsClient
      problemId={problemId}
      initialProblemName={problemName}
      initialProblemShort={problemShort}
    />
  );
}

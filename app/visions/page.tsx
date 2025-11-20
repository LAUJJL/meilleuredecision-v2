// app/visions/page.tsx
import VisionsClient from "./VisionsClient";

type SearchParams = { [key: string]: string | string[] | undefined };

function getSingle(value: string | string[] | undefined): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value) && value.length > 0) return value[0];
  return "";
}

export default function VisionsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const problemId = getSingle(searchParams.problemId);
  const problemNameFromUrl = getSingle(searchParams.problemName);
  const problemShortFromUrl = getSingle(searchParams.problemShort);

  return (
    <VisionsClient
      problemId={problemId}
      initialProblemName={problemNameFromUrl}
      initialProblemShort={problemShortFromUrl}
    />
  );
}

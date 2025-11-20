// app/visions/page.tsx
import VisionsClient from "./VisionsClient";

type SearchParams = { [key: string]: string | string[] | undefined };

export default function VisionsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const rawId = searchParams.problemId;
  const rawName = searchParams.problemName;
  const rawShort = searchParams.problemShort;

  const problemId =
    typeof rawId === "string" ? rawId : rawId?.[0] ?? "";
  const problemName =
    typeof rawName === "string" ? rawName : rawName?.[0] ?? "";
  const problemShort =
    typeof rawShort === "string" ? rawShort : rawShort?.[0] ?? "";

  return (
    <VisionsClient
      problemId={problemId}
      problemName={problemName}
      problemShort={problemShort}
    />
  );
}

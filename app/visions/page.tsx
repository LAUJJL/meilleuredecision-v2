import VisionsClient from "./VisionsClient";

type SearchParams = { [key: string]: string | string[] | undefined };

export default function VisionsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const rawName = searchParams.problemName;
  const rawShort = searchParams.problemShort;

  const problemName =
    typeof rawName === "string" ? rawName : rawName?.[0] ?? "";
  const problemShort =
    typeof rawShort === "string" ? rawShort : rawShort?.[0] ?? "";

  return (
    <VisionsClient problemName={problemName} problemShort={problemShort} />
  );
}

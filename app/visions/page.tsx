// app/visions/page.tsx
import VisionsClient from "./VisionsClient";

type SearchParams = {
  [key: string]: string | string[] | undefined;
};

export default function VisionsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const problemId =
    typeof searchParams.problemId === "string" ? searchParams.problemId : "";

  const problemNameParam =
    typeof searchParams.problemName === "string"
      ? searchParams.problemName.trim()
      : "";

  const problemShortParam =
    typeof searchParams.problemShort === "string"
      ? searchParams.problemShort.trim()
      : "";

  const problemName =
    problemNameParam && problemNameParam.length > 0
      ? problemNameParam
      : "(problème sans nom)";

  const problemShort = problemShortParam;

  return (
    <VisionsClient
      problemId={problemId}
      problemName={problemName}
      problemShort={problemShort}
    />
  );
}

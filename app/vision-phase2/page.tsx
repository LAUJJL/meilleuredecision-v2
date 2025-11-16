// app/vision-phase2/page.tsx
import Phase2Client from "./Phase2Client";

type SearchParams = { [key: string]: string | string[] | undefined };

export default function VisionPhase2Page({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return <Phase2Client searchParams={searchParams} />;
}

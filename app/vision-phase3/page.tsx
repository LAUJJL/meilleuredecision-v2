// app/vision-phase3/page.tsx
import Phase3Client from "./Phase3Client";

export default function Phase3Page() {
  // Phase3Client lit déjà le contexte (problemName, visionId, etc.)
  // depuis l’URL via window.location.search
  return <Phase3Client />;
}

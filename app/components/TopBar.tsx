export default function TopBar({
  right,
}: {
  right?: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        gap: 12,
      }}
    >
      <a href="/" style={{ textDecoration: "none" }}>
        ← Accueil
      </a>

      <div>{right}</div>
    </div>
  );
}

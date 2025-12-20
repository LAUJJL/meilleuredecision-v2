"use client";

import { useState } from "react";

export default function HelpPanel({
  title = "Aide",
  children,
}: {
  title?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <section style={{ marginTop: 14 }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          border: "1px solid #ddd",
          background: "white",
          borderRadius: 10,
          padding: "8px 12px",
          cursor: "pointer",
          fontSize: 14,
          fontWeight: 600,
        }}
        aria-expanded={open}
      >
        {open ? "▼" : "▶"} {title}
      </button>

      {open && (
        <div
          style={{
            marginTop: 10,
            border: "1px solid #eee",
            borderRadius: 12,
            padding: 14,
            lineHeight: 1.6,
            fontSize: 15,
          }}
        >
          {children}
        </div>
      )}
    </section>
  );
}

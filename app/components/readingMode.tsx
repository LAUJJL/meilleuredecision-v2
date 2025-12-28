'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type ReadingMode = "simple" | "details";
const STORAGE_KEY = "dm_reading_mode";

type Ctx = {
  mode: ReadingMode;
  setMode: (m: ReadingMode) => void;
  toggle: () => void;
};

const ReadingModeContext = createContext<Ctx | null>(null);

export function ReadingModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ReadingMode>("simple");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw === "details" || raw === "simple") setModeState(raw);
    } catch {
      // ignore
    }
  }, []);

  const setMode = (m: ReadingMode) => {
    setModeState(m);
    try {
      localStorage.setItem(STORAGE_KEY, m);
    } catch {
      // ignore
    }
  };

  const toggle = () => setMode(mode === "simple" ? "details" : "simple");

  const value = useMemo(() => ({ mode, setMode, toggle }), [mode]);

  return <ReadingModeContext.Provider value={value}>{children}</ReadingModeContext.Provider>;
}

export function useReadingMode() {
  const ctx = useContext(ReadingModeContext);
  if (!ctx) return { mode: "simple" as ReadingMode, setMode: (_m: ReadingMode) => {}, toggle: () => {} };
  return ctx;
}

export function ReadingModeBar() {
  const { mode, setMode } = useReadingMode();

  const btn = (active: boolean): React.CSSProperties => ({
    padding: "6px 10px",
    borderRadius: 10,
    border: "1px solid #ddd",
    background: active ? "#f3f4f6" : "white",
    cursor: "pointer",
    fontSize: 14,
  });

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        padding: 10,
        border: "1px solid #eee",
        borderRadius: 12,
        marginTop: 12,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ fontSize: 14, opacity: 0.8 }}>Mode :</div>
        <button style={btn(mode === "simple")} onClick={() => setMode("simple")}>
          Simple
        </button>
        <button style={btn(mode === "details")} onClick={() => setMode("details")}>
          Détails
        </button>
        <div style={{ marginLeft: "auto", fontSize: 13, opacity: 0.7 }}>
          (mémorisé sur cet appareil)
        </div>
      </div>

      <div style={{ fontSize: 13, opacity: 0.75, lineHeight: 1.35 }}>
        <b>Simple</b> = lecture rapide. <b>Détails</b> = affiche les équations, correspondances et explications techniques.
      </div>
    </div>
  );
}

export function DetailsOnly({ children }: { children: React.ReactNode }) {
  const { mode } = useReadingMode();
  if (mode !== "details") return null;
  return <>{children}</>;
}

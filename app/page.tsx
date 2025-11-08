// app/page.tsx
"use client";

import { useEffect } from "react";

export default function HomeRedirect() {
  useEffect(() => {
    window.location.href = "/projects";
  }, []);
  return null;
}

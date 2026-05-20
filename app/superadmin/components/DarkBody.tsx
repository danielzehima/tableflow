"use client";

import { useEffect } from "react";

export default function DarkBody() {
  useEffect(() => {
    const prev = document.body.style.background;
    document.body.style.background = "#020617";
    return () => {
      document.body.style.background = prev;
    };
  }, []);
  return null;
}

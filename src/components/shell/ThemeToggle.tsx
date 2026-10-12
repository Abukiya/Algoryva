"use client";
import { useEffect, useState } from "react";
import { Icon } from "@/components/Icon";

export function ThemeToggle({ className = "", tour }: { className?: string; tour?: string }) {
  const [dark, setDark] = useState(false);
  useEffect(() => { setDark(document.documentElement.dataset.theme === "dark"); }, []);
  const flip = () => {
    const next = dark ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem("theme", next); } catch { /* private mode: theme just won't persist */ }
    setDark(!dark);
  };
  return (
    <button type="button" onClick={flip} data-tour={tour} className={`btn btn-quiet btn-icon ${className}`} aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}>
      <Icon name={dark ? "sun" : "moon"} />
    </button>
  );
}

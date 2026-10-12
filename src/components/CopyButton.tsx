"use client";
import { useState } from "react";
import { Icon } from "@/components/Icon";

export function CopyButton({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return (
    <button type="button" onClick={async () => { try { await navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 1600); } catch { /* clipboard blocked: nothing to do */ } }}
      className="inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 font-sans font-semibold hover:bg-sunken hover:text-fg" aria-live="polite">
      <Icon name={done ? "check" : "copy"} size={13} />{done ? "Copied" : "Copy"}
    </button>
  );
}

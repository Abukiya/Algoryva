"use client";
import { useEffect, useState } from "react";
import { Icon } from "@/components/Icon";

const fmt = (ms: number) => { const s = Math.max(0, Math.floor(ms / 1000)); const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60; return `${h > 0 ? `${h}:` : ""}${String(m).padStart(h > 0 ? 2 : 1, "0")}:${String(r).padStart(2, "0")}`; };

/** Ticks once per second from the server-supplied deadline. Turns urgent in the last 10 minutes. The server remains the authority on whether a submission counts. */
export function Countdown({ endsAtIso, totalMin }: { endsAtIso: string; totalMin: number }) {
  const end = new Date(endsAtIso).getTime();
  const [left, setLeft] = useState<number | null>(null);
  useEffect(() => { const tick = () => setLeft(end - Date.now()); tick(); const id = setInterval(tick, 1000); return () => clearInterval(id); }, [end]);
  const over = left !== null && left <= 0, urgent = left !== null && left > 0 && left < 600_000;
  const pct = left === null ? 0 : Math.max(0, Math.min(100, (left / (totalMin * 60_000)) * 100));
  return (
    <div className={`rounded-2xl border p-4 ${over ? "border-line bg-sunken" : urgent ? "border-bad/40 bg-bad/[.06]" : "border-brand/30 bg-brand/[.06]"}`} role="timer" aria-label="Time remaining">
      <div className="flex items-center gap-2 text-xs font-semibold text-muted"><Icon name="timer" size={14} />{over ? "Time is up" : "Time left"}</div>
      <p className={`tnum mt-1 font-mono text-4xl font-bold leading-none ${urgent ? "text-bad" : ""}`} suppressHydrationWarning>{left === null ? "--:--" : over ? "0:00" : fmt(left)}</p>
      <div className="bar mt-3 h-1.5"><span style={{ width: `${pct}%`, transform: "none", animation: "none", background: urgent ? "rgb(var(--bad))" : undefined, transition: "width 1s linear" }} /></div>
    </div>
  );
}

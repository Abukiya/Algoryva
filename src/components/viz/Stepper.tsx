"use client";
import { useEffect, useState, type KeyboardEvent, type ReactNode } from "react";
import { Icon } from "@/components/Icon";
import { Inline } from "@/components/lesson/Inline";

/** Shared playback shell: step counter, caption (aria-live), prev/play/next/reset, speed, and arrow-key control. */
export function Stepper({ title, count, children, caption }: { title: string; count: number; children: (i: number) => ReactNode; caption: (i: number) => string }) {
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [ms, setMs] = useState(900);
  const last = count - 1;

  useEffect(() => {
    if (!playing) return;
    if (idx >= last) { setPlaying(false); return; }
    const t = setTimeout(() => setIdx((i) => Math.min(i + 1, last)), ms);
    return () => clearTimeout(t);
  }, [playing, idx, ms, last]);

  const stop = () => setPlaying(false);
  const go = (n: number) => { stop(); setIdx(Math.max(0, Math.min(last, n))); };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === "ArrowRight") { e.preventDefault(); go(idx + 1); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); go(idx - 1); }
    else if (e.key === "Home") { e.preventDefault(); go(0); }
  };

  return (
    <section aria-label={`Visualization: ${title}`} className="card my-6 overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3 sm:px-5">
        <h3 className="flex items-center gap-2 text-base font-extrabold"><Icon name="sparkle" size={16} className="text-brand" />{title}</h3>
        <span className="tnum chip">Step {idx + 1} of {count}</span>
      </div>
      <div tabIndex={0} onKeyDown={onKey} aria-label="Visualization stage. Use the left and right arrow keys to step." className="grid-paper bg-sunken/40 px-3 py-6 outline-none focus-visible:ring-2 focus-visible:ring-brand sm:px-5 sm:py-8">
        {children(idx)}
      </div>
      <p className="min-h-16 px-4 py-3 text-[15px] sm:px-5" aria-live="polite"><Inline text={caption(idx)} /></p>
      <div className="flex flex-wrap items-center gap-2 border-t border-line bg-sunken/40 px-3 py-3 sm:px-4">
        <button className="btn btn-secondary btn-sm btn-icon" onClick={() => go(idx - 1)} disabled={idx === 0} aria-label="Previous step"><Icon name="stepBack" size={15} /></button>
        <button className="btn btn-primary btn-sm min-w-24" onClick={() => { if (idx >= last) return; setPlaying((p) => !p); }} disabled={idx >= last}><Icon name={playing ? "pause" : "play"} size={14} />{playing ? "Pause" : "Play"}</button>
        <button className="btn btn-secondary btn-sm btn-icon" onClick={() => go(idx + 1)} disabled={idx >= last} aria-label="Next step"><Icon name="stepForward" size={15} /></button>
        <button className="btn btn-quiet btn-sm" onClick={() => go(0)}><Icon name="refresh" size={14} />Reset</button>
        <label className="ml-auto flex items-center gap-2 text-xs font-semibold text-muted">Speed
          <select value={ms} onChange={(e) => setMs(Number(e.target.value))} className="input h-8 w-auto py-0 text-xs">
            <option value={1600}>Slow</option><option value={900}>Normal</option><option value={400}>Fast</option>
          </select></label>
      </div>
    </section>
  );
}

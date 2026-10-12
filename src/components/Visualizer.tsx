"use client";
import { useEffect, useState } from "react";
import type { Frame } from "@/lib/viz/steps";
import { Icon } from "@/components/Icon";

const HIGHLIGHT = new Set(["lo", "hi", "mid", "i", "j", "win", "cmp", "swap"]);
const TONE: Record<string, string> = { lo: "border-lv2 bg-lv2/15", hi: "border-lv5 bg-lv5/15", mid: "border-brand bg-brand text-brand-fg", i: "border-lv2 bg-lv2/15", j: "border-lv5 bg-lv5/15", win: "border-lv3 bg-lv3/20", cmp: "border-lv3 bg-lv3/20", swap: "border-lv5 bg-lv5 text-white" };

export function Visualizer({ title, frames }: { title: string; frames: Frame[] }) {
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [ms, setMs] = useState(900);
  const last = frames.length - 1;
  const f = frames[idx];

  useEffect(() => {
    if (!playing) return;
    if (idx >= last) { setPlaying(false); return; }
    const t = setTimeout(() => setIdx((i) => Math.min(i + 1, last)), ms);
    return () => clearTimeout(t);
  }, [playing, idx, ms, last]);

  const stop = () => setPlaying(false);
  return (
    <section aria-label={`Visualization: ${title}`} className="card my-8 overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3">
        <h2 className="flex items-center gap-2 text-base font-extrabold"><Icon name="sparkle" size={16} className="text-brand" />{title}</h2>
        <span className="tnum chip">Step {idx + 1} of {frames.length}</span>
      </div>
      <div className="grid-paper bg-sunken/40 px-5 py-8">
        <div className="flex flex-wrap justify-center gap-2 sm:gap-3" role="img" aria-label={`Array ${f.values.join(", ")}`}>
          {f.values.map((v, i) => {
            const marks = f.marks[i] ?? [];
            const key = marks.find((m) => HIGHLIGHT.has(m));
            return (
              <div key={i} className="text-center">
                <div className={`tnum flex h-12 w-12 items-center justify-center rounded-xl border-2 font-mono text-base font-bold shadow-e1 transition-all duration-300 sm:h-14 sm:w-14 ${key ? `${TONE[key]} -translate-y-1` : "border-line-strong bg-surface"}`}>{v}</div>
                <div className="mt-1.5 h-4 font-mono text-[11px] font-semibold text-muted">{marks.join(" ")}</div>
                <div className="tnum font-mono text-[10px] text-muted/70">{i}</div>
              </div>
            );
          })}
        </div>
      </div>
      <p className="min-h-14 px-5 py-3 text-[15px]" aria-live="polite">{f.note}</p>
      <div className="flex flex-wrap items-center gap-2 border-t border-line bg-sunken/40 px-4 py-3">
        <button className="btn btn-secondary btn-sm btn-icon" onClick={() => { stop(); setIdx((i) => Math.max(0, i - 1)); }} disabled={idx === 0} aria-label="Previous step"><Icon name="stepBack" size={15} /></button>
        <button className="btn btn-primary btn-sm min-w-24" onClick={() => setPlaying((p) => (idx >= last ? false : !p))} disabled={idx >= last}><Icon name={playing ? "pause" : "play"} size={14} />{playing ? "Pause" : "Play"}</button>
        <button className="btn btn-secondary btn-sm btn-icon" onClick={() => { stop(); setIdx((i) => Math.min(last, i + 1)); }} disabled={idx >= last} aria-label="Next step"><Icon name="stepForward" size={15} /></button>
        <button className="btn btn-quiet btn-sm" onClick={() => { stop(); setIdx(0); }}><Icon name="refresh" size={14} />Reset</button>
        <label className="ml-auto flex items-center gap-2 text-xs font-semibold text-muted">Speed
          <select value={ms} onChange={(e) => setMs(Number(e.target.value))} className="input h-8 w-auto py-0 text-xs">
            <option value={1500}>Slow</option><option value={900}>Normal</option><option value={400}>Fast</option>
          </select></label>
      </div>
    </section>
  );
}

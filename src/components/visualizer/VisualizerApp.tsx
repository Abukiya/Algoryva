"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent, type KeyboardEvent } from "react";
import { Icon } from "@/components/Icon";
import { ArrayStage } from "@/components/viz/ArrayStage";
import { GraphStage } from "@/components/viz/GraphStage";
import { GridStage } from "@/components/viz/GridStage";
import { ALGORITHMS, CATEGORIES, clampIndex, defaultsOf, runAlgorithm } from "@/lib/visualizer/registry";
import { CHALLENGES } from "@/lib/visualizer/challenges";
import type { Algorithm, RunOutcome } from "@/lib/visualizer/types";

const SPEEDS = [
  { label: "Slow", ms: 1600 },
  { label: "Normal", ms: 900 },
  { label: "Fast", ms: 400 },
];

/** Fills every field of an algorithm, using empty text for any field a preset leaves out. */
function fill(algo: Algorithm, values: Record<string, string>): Record<string, string> {
  return Object.fromEntries(algo.fields.map((f) => [f.key, values[f.key] ?? ""]));
}

function randomArray(n: number): string {
  return Array.from({ length: n }, () => String(Math.floor(Math.random() * 120) - 20)).join(", ");
}

export function VisualizerApp({ initialId }: { initialId: string }) {
  const start = ALGORITHMS.find((a) => a.id === initialId) ?? ALGORITHMS[0];
  const [algoId, setAlgoId] = useState(start.id);
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState<Record<string, string>>(() => defaultsOf(start));
  const [ranWith, setRanWith] = useState<string>(() => JSON.stringify(defaultsOf(start)));
  const [outcome, setOutcome] = useState<RunOutcome>(() => runAlgorithm(start, defaultsOf(start)));
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [ms, setMs] = useState(900);
  const [showPseudo, setShowPseudo] = useState(true);
  const [showComplexity, setShowComplexity] = useState(true);
  const [level, setLevel] = useState<"beginner" | "advanced">("advanced");
  const [compareId, setCompareId] = useState("");
  const chooseLevel = (next: "beginner" | "advanced") => {
    setLevel(next);
    setShowPseudo(next === "advanced");
    setShowComplexity(next === "advanced");
  };

  const algo = ALGORITHMS.find((a) => a.id === algoId) ?? start;
  const gen = outcome.ok ? outcome.gen : null;
  const last = gen ? Math.max(0, gen.frames.length - 1) : 0;
  const i = clampIndex(idx, last);
  const frame = gen ? gen.frames[i] : undefined;
  const dirty = JSON.stringify(draft) !== ranWith;

  // One timer at a time: the effect re-runs on every step change, and its cleanup clears the previous timer.
  useEffect(() => {
    if (!playing) return;
    if (i >= last) {
      setPlaying(false);
      return;
    }
    const t = window.setTimeout(() => setIdx((n) => Math.min(n + 1, last)), ms);
    return () => window.clearTimeout(t);
  }, [playing, i, last, ms]);

  const go = (n: number) => {
    setPlaying(false);
    setIdx(clampIndex(n, last));
  };

  const togglePlay = () => {
    if (!gen || last === 0) return;
    if (playing) {
      setPlaying(false);
      return;
    }
    if (i >= last) setIdx(0);
    setPlaying(true);
  };

  const run = (algorithm: Algorithm, values: Record<string, string>) => {
    const full = fill(algorithm, values);
    setDraft(full);
    setRanWith(JSON.stringify(full));
    setOutcome(runAlgorithm(algorithm, full));
    setIdx(0);
    setPlaying(false);
  };

  const choose = (a: Algorithm) => {
    setAlgoId(a.id);
    run(a, defaultsOf(a));
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    run(algo, draft);
  };

  const onKey = (e: KeyboardEvent) => {
    if (e.key === "ArrowRight") { e.preventDefault(); go(i + 1); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); go(i - 1); }
    else if (e.key === "Home") { e.preventDefault(); go(0); }
    else if (e.key === "End") { e.preventDefault(); go(last); }
    else if (e.key === " ") { e.preventDefault(); togglePlay(); }
  };

  const q = query.trim().toLowerCase();
  const matches = (a: Algorithm) =>
    !q || a.title.toLowerCase().includes(q) || a.id.includes(q) || a.summary.toLowerCase().includes(q);
  const groups = CATEGORIES.map((c) => ({ ...c, items: ALGORITHMS.filter((a) => a.category === c.id && matches(a)) })).filter((g) => g.items.length > 0);

  return (
    <div className="page-wide">
      <header className="mb-6">
        <p className="text-xs font-extrabold uppercase tracking-wide text-brand">Algorithm visualizer</p>
        <h1 className="mt-1 text-3xl font-extrabold sm:text-4xl">See every step, with your own input</h1>
        <p className="mt-2 max-w-2xl text-soft">Pick an algorithm, enter your own numbers or use a preset, then step through the run. The pseudocode and the explanation follow each step.</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[16rem_minmax(0,1fr)] xl:grid-cols-[16rem_minmax(0,1fr)_18rem]">
        {/* Picker */}
        <aside aria-label="Choose an algorithm" className="min-w-0 lg:sticky lg:top-20 lg:h-fit">
          <label htmlFor="algo-search" className="sr-only">Search algorithms</label>
          <input id="algo-search" type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search algorithms" className="input mb-3 w-full" />
          <div className="max-h-72 space-y-4 overflow-y-auto pr-1 lg:max-h-[calc(100vh-14rem)]">
            {groups.length === 0 && <p className="text-sm text-muted">No algorithm matches “{query}”.</p>}
            {groups.map((g) => (
              <div key={g.id}>
                <p className="mb-1 px-2 text-xs font-bold uppercase tracking-wide text-muted">{g.label}</p>
                <ul className="space-y-0.5">
                  {g.items.map((a) => {
                    const active = a.id === algo.id;
                    return (
                      <li key={a.id}>
                        <button type="button" aria-pressed={active} onClick={() => choose(a)} className={`w-full rounded-lg px-2.5 py-2 text-left text-sm transition-colors ${active ? "bg-brand/10 font-bold text-fg" : "text-soft hover:bg-sunken hover:text-fg"}`}>
                          {a.title}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </aside>

        {/* Main column */}
        <div className="min-w-0 space-y-6">
          <section aria-labelledby="algo-title" className="card p-5">
            <h2 id="algo-title" className="text-2xl font-extrabold">{algo.title}</h2>
            <p className="mt-2 text-soft">{algo.summary}</p>
            {algo.precondition && (
              <p className="mt-3 flex items-start gap-2 rounded-lg bg-warn/10 px-3 py-2 text-sm font-semibold text-warn">
                <Icon name="alert" size={16} className="mt-0.5 shrink-0" />
                <span>Precondition: {algo.precondition}</span>
              </p>
            )}

            <form onSubmit={onSubmit} className="mt-5 space-y-4" aria-label="Algorithm input">
              {algo.fields.map((f) => {
                const id = `in-${algo.id}-${f.key}`;
                const helpId = `${id}-help`;
                return (
                  <div key={f.key}>
                    <label htmlFor={id} className="block text-sm font-bold">{f.label}</label>
                    <input id={id} value={draft[f.key] ?? ""} onChange={(e) => setDraft({ ...draft, [f.key]: e.target.value })} placeholder={f.placeholder} aria-describedby={helpId} spellCheck={false} autoComplete="off" className="input mt-1.5 w-full font-mono" />
                    <p id={helpId} className="mt-1 text-xs text-muted">{f.help}</p>
                    {f.key === "array" && (
                      <button type="button" onClick={() => setDraft({ ...draft, array: randomArray(8) })} className="btn btn-quiet btn-sm mt-1">Random array of 8</button>
                    )}
                  </div>
                );
              })}

              <div className="flex flex-wrap items-center gap-2">
                <button type="submit" className="btn btn-primary btn-sm"><Icon name="play" size={14} />Run</button>
                <button type="button" onClick={() => run(algo, algo.presets[0]?.values ?? {})} className="btn btn-quiet btn-sm"><Icon name="refresh" size={14} />Restore example</button>
              </div>
              {algo.presets.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="text-xs font-bold text-muted">Presets:</span>
                  {algo.presets.map((p) => (
                    <button key={p.label} type="button" onClick={() => run(algo, p.values)} className="chip hover:border-brand">{p.label}</button>
                  ))}
                </div>
              )}
            </form>

            {!outcome.ok && <p role="alert" className="mt-4 rounded-lg bg-bad/10 px-3 py-2 text-sm font-semibold text-bad">{outcome.error}</p>}
            {outcome.ok && dirty && <p className="mt-4 text-sm font-semibold text-warn">The inputs changed. Press Run to update the steps.</p>}
          </section>

          {algo.category === "sorting" && (
            <section aria-labelledby="compare-title" className="card p-5">
              <h3 id="compare-title" className="text-sm font-extrabold">Compare two sorts on the same input</h3>
              <label className="mt-3 flex flex-wrap items-center gap-2 text-sm font-semibold">Compare with
                <select value={compareId} onChange={(e) => setCompareId(e.target.value)} className="input h-9 w-auto py-0 text-sm" aria-label="Algorithm to compare with">
                  <option value="">None</option>
                  {ALGORITHMS.filter((a) => a.category === "sorting" && a.id !== algo.id).map((a) => (
                    <option key={a.id} value={a.id}>{a.title}</option>
                  ))}
                </select>
              </label>
              {compareId && (() => {
                const other = ALGORITHMS.find((a) => a.id === compareId);
                const input = JSON.parse(ranWith) as Record<string, string>;
                const rows = [algo, other].filter((a): a is Algorithm => Boolean(a)).map((a) => {
                  const o = runAlgorithm(a, input);
                  return { id: a.id, title: a.title, out: o };
                });
                return (
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead><tr className="text-xs text-muted"><th className="py-1 pr-3 font-bold">Algorithm</th><th className="py-1 pr-3 font-bold">Steps shown</th><th className="py-1 font-bold">Result</th></tr></thead>
                      <tbody>
                        {rows.map((r) => (
                          <tr key={r.id} className="border-t border-line">
                            <td className="py-2 pr-3 font-semibold">{r.title}</td>
                            <td className="tnum py-2 pr-3 font-mono">{r.out.ok ? r.out.gen.frames.length : "—"}</td>
                            <td className="py-2 font-mono text-xs">{r.out.ok ? r.out.gen.result : r.out.error}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <p className="mt-2 text-xs text-muted">Steps shown are the frames each visualization draws, one per comparison, swap, or placement. They are not a count of machine operations.</p>
                  </div>
                );
              })()}
            </section>
          )}

          {CHALLENGES[algo.id] && (
            <section aria-labelledby="challenge-title" className="card p-5">
              <h3 id="challenge-title" className="flex items-center gap-2 text-sm font-extrabold"><Icon name="target" size={14} className="text-brand" />Try it yourself</h3>
              <p className="mt-2 text-sm text-soft">{CHALLENGES[algo.id]}</p>
            </section>
          )}

          {/* Stage and playback */}
          {gen && frame && (
            <section aria-label="Visualization" className="card overflow-hidden">
              <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3 sm:px-5">
                <h3 className="text-sm font-extrabold">Step through the run</h3>
                <span className="tnum chip">Step {i + 1} of {gen.frames.length}</span>
              </div>
              <div tabIndex={0} onKeyDown={onKey} aria-label="Visualization stage. Use the left and right arrow keys to step, space to play or pause." className="grid-paper min-h-56 bg-sunken/40 px-3 py-6 outline-none focus-visible:ring-2 focus-visible:ring-brand sm:px-5 sm:py-8">
                {gen.kind === "array" && <ArrayStage f={gen.frames[i]} />}
                {gen.kind === "graph" && <GraphStage f={gen.frames[i]} />}
                {gen.kind === "grid" && <GridStage f={gen.frames[i]} />}
              </div>
              <p className="min-h-14 px-4 py-3 text-[15px] sm:px-5" aria-live="polite">{frame.note}</p>
              {i === last && <p className="px-4 pb-3 text-sm font-bold text-ok sm:px-5">Result: {gen.result}</p>}
              <div className="border-t border-line bg-sunken/40 px-3 py-3 sm:px-4">
                <input type="range" min={0} max={last} value={i} onChange={(e) => go(Number(e.target.value))} aria-label="Step position" disabled={last === 0} className="mb-3 w-full accent-brand" />
                <div className="flex flex-wrap items-center gap-2">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => go(0)} disabled={i === 0}>Start</button>
                  <button type="button" className="btn btn-secondary btn-sm btn-icon" onClick={() => go(i - 1)} disabled={i === 0} aria-label="Previous step"><Icon name="stepBack" size={15} /></button>
                  <button type="button" className="btn btn-primary btn-sm min-w-24" onClick={togglePlay} disabled={last === 0}><Icon name={playing ? "pause" : "play"} size={14} />{playing ? "Pause" : "Play"}</button>
                  <button type="button" className="btn btn-secondary btn-sm btn-icon" onClick={() => go(i + 1)} disabled={i >= last} aria-label="Next step"><Icon name="stepForward" size={15} /></button>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => go(last)} disabled={i >= last}>End</button>
                  <button type="button" className="btn btn-quiet btn-sm" onClick={() => go(0)}><Icon name="refresh" size={14} />Reset</button>
                  <label className="ml-auto flex items-center gap-2 text-xs font-semibold text-muted">Speed
                    <select value={ms} onChange={(e) => { setPlaying(false); setMs(Number(e.target.value)); }} className="input h-8 w-auto py-0 text-xs" aria-label="Playback speed">
                      {SPEEDS.map((s) => <option key={s.ms} value={s.ms}>{s.label}</option>)}
                    </select>
                  </label>
                </div>
                <p className="mt-3 text-xs text-muted">Labels under values name their role, such as lo, hi, mid, i, j, min, L and R. Faded items are already ruled out or already in place.</p>
              </div>
            </section>
          )}
        </div>

        {/* Pseudocode, complexity, lesson link */}
        <aside aria-label="Pseudocode and complexity" className="min-w-0 space-y-6 xl:col-start-3 xl:row-start-1">
          <fieldset className="card min-w-0 space-y-3 p-4 text-sm font-semibold">
            <legend className="sr-only">Panels</legend>
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold text-muted">Level</span>
              <select value={level} onChange={(e) => chooseLevel(e.target.value as "beginner" | "advanced")} className="input h-9 w-full min-w-0 py-0 text-sm" aria-label="Level">
                <option value="beginner">Beginner</option>
                <option value="advanced">Advanced</option>
              </select>
            </label>
            <p className="text-xs font-normal text-muted">Beginner shows the steps and explanations. Advanced also shows the pseudocode and complexity.</p>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2"><input type="checkbox" checked={showPseudo} onChange={(e) => setShowPseudo(e.target.checked)} className="h-4 w-4 shrink-0 accent-brand" />Show pseudocode</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={showComplexity} onChange={(e) => setShowComplexity(e.target.checked)} className="h-4 w-4 shrink-0 accent-brand" />Show complexity</label>
            </div>
          </fieldset>
          {showPseudo && (
          <section className="card p-4">
            <h3 className="text-sm font-extrabold">Pseudocode</h3>
            <ol className="mt-3 space-y-0.5 overflow-x-auto font-mono text-[13px] leading-6">
              {algo.pseudocode.map((line, k) => {
                const on = frame?.line === k;
                return (
                  <li key={k} aria-current={on ? "step" : undefined} className={`whitespace-pre rounded px-2 transition-colors ${on ? "bg-brand/15 font-bold text-fg" : "text-soft"}`}>{line}</li>
                );
              })}
            </ol>
          </section>
          )}

          {showComplexity && (
          <section className="card p-4" aria-label="Complexity">
            <h3 className="text-sm font-extrabold">Complexity</h3>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between gap-3"><dt className="text-muted">Time</dt><dd className="tnum font-mono font-bold">{algo.complexity.time}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-muted">Space</dt><dd className="tnum font-mono font-bold">{algo.complexity.space}</dd></div>
            </dl>
            {algo.complexity.note && <p className="mt-3 text-xs text-muted">{algo.complexity.note}</p>}
          </section>
          )}

          {algo.lessonSlug && (
            <section className="card p-4">
              <h3 className="text-sm font-extrabold">Learn the idea</h3>
              <p className="mt-2 text-sm text-soft">The lesson explains why this works, with worked examples and common mistakes.</p>
              <Link href={`/learn/${algo.lessonSlug}`} className="btn btn-secondary btn-sm mt-3"><Icon name="book" size={14} />Read the lesson</Link>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}

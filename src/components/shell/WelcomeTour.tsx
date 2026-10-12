"use client";
import { useEffect, useRef, useState } from "react";
import { INTRO_SEEN_KEY, INTRO_STEPS, stepAfter } from "@/lib/intro";

/** Event the sidebar's Intro button dispatches to reopen the tour. */
export const OPEN_INTRO_EVENT = "open-intro";

/** The real controls the last step points at. Each one is found by its data-tour hook; hidden copies are skipped. */
const SPOTS = [
  { selector: '[data-tour="collapse"]', label: "Collapse the sidebar" },
  { selector: '[data-tour="theme"]', label: "Switch dark mode" },
];

type Spot = { label: string; rect: DOMRect };

function visibleRect(selector: string): DOMRect | null {
  for (const el of Array.from(document.querySelectorAll<HTMLElement>(selector))) {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) return r;
  }
  return null;
}

/**
 * A short first-visit intro in a dialog. It opens once, can be skipped at any step (button or Escape), and remembers that it was seen.
 * The last step draws a ring and an arrow to the real collapse and dark-mode controls. The Intro button in the sidebar reopens it.
 */
export function WelcomeTour() {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [spots, setSpots] = useState<Spot[]>([]);
  const primary = useRef<HTMLButtonElement>(null);
  const last = index === INTRO_STEPS.length - 1;

  useEffect(() => {
    let seen = false;
    try { seen = localStorage.getItem(INTRO_SEEN_KEY) === "1"; } catch { /* private mode: the intro may show again */ }
    if (!seen) setOpen(true);
    const reopen = () => { setIndex(0); setOpen(true); };
    window.addEventListener(OPEN_INTRO_EVENT, reopen);
    return () => window.removeEventListener(OPEN_INTRO_EVENT, reopen);
  }, []);

  const finish = () => {
    try { localStorage.setItem(INTRO_SEEN_KEY, "1"); } catch { /* private mode: it just won't persist */ }
    setOpen(false);
  };

  useEffect(() => {
    if (!open) return;
    primary.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") finish(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Measure the controls only on the last step, and again whenever the layout moves.
  useEffect(() => {
    if (!open || !last) { setSpots([]); return; }
    const measure = () => {
      const found: Spot[] = [];
      for (const s of SPOTS) {
        const rect = visibleRect(s.selector);
        if (rect) found.push({ label: s.label, rect });
      }
      setSpots(found);
    };
    measure();
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
  }, [open, last]);

  if (!open) return null;
  const step = INTRO_STEPS[index];

  return (
    <>
      {last && spots.map((s) => {
        const above = s.rect.top > window.innerHeight / 2;
        const left = Math.min(Math.max(s.rect.left + s.rect.width / 2 - 100, 8), window.innerWidth - 216);
        const top = above ? s.rect.top - 46 : s.rect.bottom + 14;
        return (
          <div key={s.label} aria-hidden="true" className="pointer-events-none">
            <div className="fixed z-[60] rounded-lg ring-2 ring-brand" style={{ left: s.rect.left - 5, top: s.rect.top - 5, width: s.rect.width + 10, height: s.rect.height + 10 }} />
            <div className="fixed z-[60] flex items-center gap-2 whitespace-nowrap rounded-full bg-fg px-3 py-1.5 text-xs font-bold text-bg shadow-e3" style={{ left, top }}>
              {!above && <span className="text-base leading-none">↑</span>}
              {s.label}
              {above && <span className="text-base leading-none">↓</span>}
            </div>
          </div>
        );
      })}

      <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
        <div role="dialog" aria-modal="true" aria-labelledby="intro-title" className="card card-pad w-full max-w-md">
          <p className="text-xs font-bold text-muted" aria-live="polite">Step {index + 1} of {INTRO_STEPS.length}</p>
          <h2 id="intro-title" className="mt-1 text-xl font-extrabold">{step.title}</h2>
          <p className="mt-2 text-soft">{step.body}</p>
          {last && <p className="mt-3 text-sm font-semibold text-brand">Follow the arrows: they point at the sidebar collapse and the dark mode button.</p>}

          <div className="mt-6 flex items-center justify-between gap-2">
            <button type="button" onClick={finish} className="btn btn-quiet btn-sm">Skip</button>
            <div className="flex gap-2">
              {index > 0 && <button type="button" onClick={() => setIndex(stepAfter(index, -1))} className="btn btn-secondary btn-sm">Back</button>}
              <button ref={primary} type="button" onClick={() => (last ? finish() : setIndex(stepAfter(index, 1)))} className="btn btn-primary btn-sm">{last ? "Start learning" : "Next"}</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

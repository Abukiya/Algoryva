"use client";
import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { Icon } from "@/components/Icon";

const TOC_KEY = "lesson-toc-collapsed";
const RAIL_KEY = "lesson-rail-collapsed";

/** A collapse flag remembered in the browser. It starts expanded on the server, so the page never renders collapsed by mistake. */
function useStoredFlag(key: string): [boolean, (v: boolean) => void] {
  const [on, setOn] = useState(false);
  useEffect(() => {
    try { setOn(localStorage.getItem(key) === "1"); } catch { /* private mode: it just won't persist */ }
  }, [key]);
  const set = (v: boolean) => {
    setOn(v);
    try { localStorage.setItem(key, v ? "1" : "0"); } catch { /* private mode: it just won't persist */ }
  };
  return [on, set];
}

/** The header of a side panel, or a narrow button that opens it again when it is collapsed. */
function SideBar({ side, label, collapsed, onToggle }: { side: "left" | "right"; label: string; collapsed: boolean; onToggle: () => void }) {
  const icon = <Icon name="panelLeft" size={16} className={side === "right" ? "shrink-0 scale-x-[-1]" : "shrink-0"} />;
  if (collapsed) {
    return (
      <button type="button" onClick={onToggle} aria-expanded={false} aria-label={`Show ${label}`} title={`Show ${label}`}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-line bg-surface px-3 py-2 text-sm font-semibold text-soft transition hover:text-fg xl:flex-col xl:px-0 xl:py-4">
        {icon}<span className="xl:[writing-mode:vertical-rl]">{label}</span>
      </button>
    );
  }
  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      {side === "left" ? <p className="text-xs font-bold text-muted">{label}</p> : <span />}
      <button type="button" onClick={onToggle} aria-expanded aria-label={`Hide ${label}`} title={`Hide ${label}`} className="btn btn-quiet btn-sm">{icon}<span className="sr-only">Hide {label}</span></button>
    </div>
  );
}

/**
 * The lesson layout: contents on the left, the lesson in the middle, and "Where you are" on the right.
 * Either side can collapse, and the middle column takes the space. "Focus reading" collapses both.
 */
export function LessonFrame({ toc, rail, children }: { toc: ReactNode; rail: ReactNode; children: ReactNode }) {
  const [tocOff, setTocOff] = useStoredFlag(TOC_KEY);
  const [railOff, setRailOff] = useStoredFlag(RAIL_KEY);
  const focus = tocOff && railOff;
  const toggleFocus = () => { setTocOff(!focus); setRailOff(!focus); };
  const vars = {
    "--toc-lg": tocOff ? "2.75rem" : "13rem",
    "--toc-xl": tocOff ? "2.75rem" : "15rem",
    "--rail": railOff ? "2.75rem" : "16rem",
    "--main": tocOff || railOff ? "60rem" : "46rem",
  } as CSSProperties;

  return (
    <>
      <div className="mb-4 flex justify-end">
        <button type="button" onClick={toggleFocus} aria-pressed={focus} className="btn btn-quiet btn-sm">
          <Icon name="book" size={14} />{focus ? "Show side panels" : "Focus reading"}
        </button>
      </div>
      <div style={vars} className="grid gap-8 lg:grid-cols-[var(--toc-lg)_minmax(0,1fr)] xl:grid-cols-[var(--toc-xl)_minmax(0,var(--main))_var(--rail)] xl:justify-center">
        <aside aria-label="On this page" className="min-w-0 lg:sticky lg:top-20 lg:h-fit">
          <SideBar side="left" label="On this page" collapsed={tocOff} onToggle={() => setTocOff(!tocOff)} />
          <div className={tocOff ? "hidden" : undefined}>{toc}</div>
        </aside>
        {children}
        <aside aria-label="Path and related topics" className="min-w-0 xl:sticky xl:top-20 xl:h-fit">
          <SideBar side="right" label="Where you are" collapsed={railOff} onToggle={() => setRailOff(!railOff)} />
          <div className={railOff ? "hidden" : "space-y-6"}>{rail}</div>
        </aside>
      </div>
    </>
  );
}

import type { Frame, Marks } from "@/lib/viz/steps";

const KEY = new Set(["lo", "hi", "mid", "i", "j", "win", "cmp", "swap", "L", "R", "root", "moved", "add", "new", "from", "hit", "min", "pivot", "done"]);
const TONE: Record<string, string> = {
  lo: "border-lv2 bg-lv2/15", hi: "border-lv5 bg-lv5/15", mid: "border-brand bg-brand text-brand-fg",
  i: "border-lv2 bg-lv2/15", j: "border-lv5 bg-lv5/15", win: "border-lv3 bg-lv3/20", cmp: "border-lv3 bg-lv3/20",
  swap: "border-lv5 bg-lv5 text-white", L: "border-lv2 bg-lv2/15", R: "border-lv5 bg-lv5/15",
  root: "border-brand bg-brand text-brand-fg", moved: "border-lv4 bg-lv4/20", add: "border-lv3 bg-lv3/20",
  new: "border-brand bg-brand/15", from: "border-lv2 bg-lv2/15",
  hit: "border-ok bg-ok text-white", min: "border-lv4 bg-lv4/25", pivot: "border-warn bg-warn/25", done: "border-ok bg-ok/15",
};

function Row({ values, marks, dim, label, small }: { values: (number | string)[]; marks: Marks; dim?: Set<number>; label?: string; small?: boolean }) {
  return (
    <div>
      {label && <p className="mb-2 text-center text-xs font-bold text-muted">{label}</p>}
      <div className="flex justify-start gap-1.5 overflow-x-auto px-1 pb-1 sm:justify-center sm:gap-2.5" style={{ scrollbarWidth: "thin" }}>
        {values.map((v, i) => {
          const m = marks[i] ?? [];
          const key = m.find((x) => KEY.has(x));
          const faded = dim?.has(i) && !key;
          return (
            <div key={i} className="shrink-0 text-center">
              <div className={`tnum flex items-center justify-center rounded-xl border-2 font-mono font-bold shadow-e1 transition-all duration-300 ${small ? "h-10 w-10 text-sm sm:h-11 sm:w-11" : "h-11 w-11 text-base sm:h-14 sm:w-14"} ${key ? `${TONE[key]} -translate-y-1` : "border-line-strong bg-surface"} ${faded ? "opacity-30" : ""}`}>{String(v)}</div>
              <div className="mt-1 h-4 font-mono text-[11px] font-semibold text-muted">{m.join(" ")}</div>
              <div className="tnum font-mono text-[10px] text-muted/70">{i}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ArrayStage({ f }: { f: Frame }) {
  const dim = f.dim ? new Set(f.dim) : undefined;
  return (
    <div role="img" aria-label={`Array ${f.values.join(", ")}${f.aux ? `. ${f.aux.map((a) => `${a.label}: ${a.values.join(", ")}`).join(". ")}` : ""}${f.structure ? `. ${f.structure.label}: ${f.structure.items.join(", ") || "empty"}` : ""}`} className="space-y-5">
      <Row values={f.values} marks={f.marks} dim={dim} />
      {f.aux?.map((a) => <Row key={a.label} label={a.label} values={a.values} marks={a.marks} small />)}
      {f.structure && (
        <div className="mx-auto flex max-w-full flex-wrap items-center justify-center gap-2 rounded-xl border border-dashed border-line-strong bg-surface/70 px-3 py-2">
          <span className="text-xs font-bold text-muted">{f.structure.label}</span>
          {f.structure.items.length === 0 ? <span className="text-xs text-muted">empty</span> : f.structure.items.map((it, k) => <span key={k} className="tnum rounded-md border border-brand/40 bg-brand/10 px-2 py-0.5 font-mono text-sm font-bold">{it}</span>)}
        </div>
      )}
    </div>
  );
}

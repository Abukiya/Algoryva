import type { GraphFrame } from "@/lib/viz/steps";

const FILL: Record<string, string> = {
  queued: "rgb(var(--lv3) / .28)", cur: "rgb(var(--brand))", done: "rgb(var(--ok) / .30)", hit: "rgb(var(--lv1) / .30)",
};
const STROKE: Record<string, string> = { queued: "rgb(var(--lv3))", cur: "rgb(var(--brand))", done: "rgb(var(--ok))", hit: "rgb(var(--lv1))" };

export function GraphStage({ f }: { f: GraphFrame }) {
  const byId = new Map(f.nodes.map((n) => [n.id, n]));
  const maxY = Math.max(...f.nodes.map((n) => n.y)) + 40, pill = f.nodes.some((n) => (n.label ?? n.id).length > 2);
  const hw = pill ? 24 : 15;
  const seen = f.nodes.filter((n) => f.state[n.id]).map((n) => `${n.label ?? n.id} ${f.state[n.id]}`).join(", ");
  return (
    <div className="space-y-4">
      <svg viewBox={`0 0 300 ${maxY}`} role="img" aria-label={`Graph. ${seen || "No node reached yet"}. ${f.structure.label}: ${f.structure.items.join(", ") || "empty"}`} className="mx-auto w-full max-w-md overflow-visible">
        <defs><marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 10 5 0 10z" fill="rgb(var(--line-strong))" /></marker></defs>
        {f.edges.map((e) => {
          const a = byId.get(e.a)!, b = byId.get(e.b)!;
          const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1, r = e.directed ? (pill ? 14 : 17) : 0;
          const tx = e.directed ? b.x - (dx / len) * r : b.x, ty = e.directed ? b.y - (dy / len) * r : b.y;
          const lit = f.state[e.a] && f.state[e.b];
          const stroke = e.mark === "pick" ? "rgb(var(--brand))" : e.mark === "cur" ? "rgb(var(--lv3))" : lit ? "rgb(var(--brand) / .55)" : "rgb(var(--line-strong))";
          const width = e.mark === "pick" ? 3.4 : e.mark === "cur" ? 3 : lit ? 2.2 : 1.6;
          return (
            <g key={`${e.a}-${e.b}`} opacity={e.mark === "skip" ? 0.4 : 1}>
              <line x1={a.x} y1={a.y} x2={tx} y2={ty} stroke={stroke} strokeWidth={width} strokeDasharray={e.mark === "skip" ? "4 3" : undefined} markerEnd={e.directed ? "url(#arr)" : undefined} />
              {e.w !== undefined && <text x={(a.x + b.x) / 2} y={(a.y + b.y) / 2 - 3} textAnchor="middle" fontSize={10} fontWeight={800} fill="rgb(var(--fg))" stroke="rgb(var(--surface))" strokeWidth={3} paintOrder="stroke">{e.w}</text>}
            </g>
          );
        })}
        {f.nodes.map((n) => {
          const st = f.state[n.id];
          const label = n.label ?? n.id;
          return (
            <g key={n.id} opacity={st ? 1 : pill ? 0.28 : 1} style={{ transition: "opacity .3s" }}>
              {pill
                ? <rect x={n.x - hw} y={n.y - 12} width={hw * 2} height={24} rx={12} fill={st ? FILL[st] : "rgb(var(--surface))"} stroke={st ? STROKE[st] : "rgb(var(--line-strong))"} strokeWidth={2} />
                : <circle cx={n.x} cy={n.y} r={hw} fill={st ? FILL[st] : "rgb(var(--surface))"} stroke={st ? STROKE[st] : "rgb(var(--line-strong))"} strokeWidth={2.2} />}
              <text x={n.x} y={n.y + 4} textAnchor="middle" fontSize={pill ? 10 : 13} fontWeight={700} fontFamily="var(--font-mono, monospace)" fill={st === "cur" ? "rgb(var(--brand-fg))" : "rgb(var(--fg))"}>{label}</text>
              {f.text[n.id] && <text x={n.x} y={n.y + (pill ? 25 : 29)} textAnchor="middle" fontSize={10} fontWeight={700} fill="rgb(var(--soft))">{f.text[n.id]}</text>}
            </g>
          );
        })}
      </svg>
      <div className="mx-auto flex max-w-full flex-wrap items-center justify-center gap-2 rounded-xl border border-dashed border-line-strong bg-surface/70 px-3 py-2">
        <span className="text-xs font-bold text-muted">{f.structure.label}</span>
        {f.structure.items.length === 0 ? <span className="text-xs text-muted">empty</span> : f.structure.items.map((it, k) => <span key={k} className="tnum rounded-md border border-brand/40 bg-brand/10 px-2 py-0.5 font-mono text-sm font-bold">{it}</span>)}
      </div>
      {f.order.length > 0 && <p className="text-center text-xs font-semibold text-muted">Finished / visited in order: <span className="font-mono text-fg">{f.order.join("  ")}</span></p>}
      <ul className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-[11px] font-semibold text-muted" aria-label="Colour key">
        <li><span className="mr-1 inline-block h-2.5 w-2.5 rounded-full" style={{ background: STROKE.queued }} />waiting</li>
        <li><span className="mr-1 inline-block h-2.5 w-2.5 rounded-full" style={{ background: STROKE.cur }} />current</li>
        <li><span className="mr-1 inline-block h-2.5 w-2.5 rounded-full" style={{ background: STROKE.done }} />finished</li>
      </ul>
    </div>
  );
}

// The landing hero's signature: the curriculum drawn as the dependency graph it actually is.
// Pure SVG + CSS. Edges trace in once, nodes light up in prerequisite order; reduced-motion shows the finished graph.
const NODES = [
  { id: "py", x: 60, y: 210, label: "Python", lv: 1 },
  { id: "arr", x: 190, y: 130, label: "Arrays", lv: 2 },
  { id: "sort", x: 190, y: 290, label: "Sorting", lv: 2 },
  { id: "tp", x: 330, y: 70, label: "Two pointers", lv: 3 },
  { id: "pre", x: 330, y: 160, label: "Prefix sum", lv: 3 },
  { id: "bs", x: 330, y: 290, label: "Binary search", lv: 3 },
  { id: "sw", x: 470, y: 70, label: "Sliding window", lv: 3 },
  { id: "gr", x: 330, y: 370, label: "Greedy", lv: 4 },
  { id: "tr", x: 470, y: 250, label: "Trees", lv: 4 },
] as const;
const EDGES: [string, string][] = [["py", "arr"], ["py", "sort"], ["arr", "tp"], ["arr", "pre"], ["sort", "bs"], ["tp", "sw"], ["sort", "gr"], ["bs", "tr"]];
const at = (id: string) => NODES.find((n) => n.id === id)!;

export function HeroGraph() {
  return (
    <svg viewBox="0 0 560 400" className="h-auto w-full" role="img" aria-label="Part of the curriculum as a graph: Python leads to Arrays and Sorting, which lead to Two pointers, Prefix sum, Binary search, Greedy and Trees.">
      <style>{`
        .hg-edge{stroke-dasharray:1;stroke-dashoffset:1;animation:hg-trace .7s ease-out forwards}
        .hg-node{opacity:0;animation:hg-in .5s cubic-bezier(.2,.9,.3,1.2) forwards;transform-box:fill-box;transform-origin:center}
        @keyframes hg-trace{to{stroke-dashoffset:0}}
        @keyframes hg-in{from{opacity:0;transform:scale(.7)}to{opacity:1;transform:scale(1)}}
        @media (prefers-reduced-motion:reduce){.hg-edge,.hg-node{animation:none;opacity:1;stroke-dashoffset:0}}
      `}</style>
      {EDGES.map(([a, b], i) => {
        const A = at(a), B = at(b), mx = (A.x + B.x) / 2;
        return <path key={a + b} pathLength={1} d={`M${A.x} ${A.y} C${mx} ${A.y} ${mx} ${B.y} ${B.x} ${B.y}`} fill="none" stroke="rgb(var(--line-strong))" strokeWidth="2" className="hg-edge" style={{ animationDelay: `${0.25 + i * 0.16}s` }} />;
      })}
      {NODES.map((n, i) => {
        const w = n.label.length * 7.2 + 34;
        return (
          <g key={n.id} className="hg-node" style={{ animationDelay: `${0.1 + i * 0.16}s` }}>
            <rect x={n.x - w / 2} y={n.y - 18} width={w} height="36" rx="11" fill="rgb(var(--surface))" stroke={`rgb(var(--lv${n.lv}))`} strokeWidth="2" />
            <circle cx={n.x - w / 2 + 14} cy={n.y} r="4.5" fill={`rgb(var(--lv${n.lv}))`} />
            <text x={n.x - w / 2 + 26} y={n.y + 4.5} fontSize="13" fontWeight="700" fill="rgb(var(--fg))" style={{ fontFamily: "var(--font-sans)" }}>{n.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

import type { GridFrame } from "@/lib/viz/steps";

export function GridStage({ f }: { f: GridFrame }) {
  const isDep = (r: number, c: number) => f.deps?.some(([a, b]) => a === r && b === c);
  const isActive = (r: number, c: number) => f.active?.[0] === r && f.active?.[1] === c;
  return (
    <div className="overflow-x-auto">
      <table role="img" aria-label={`DP table. ${f.active ? `Filling row ${f.active[0]}, column ${f.active[1]}.` : ""}`} className="mx-auto border-separate border-spacing-1 text-center font-mono text-sm font-bold">
        <thead><tr><th className="w-8" />{f.colLabels.map((c, j) => <th key={j} className="h-8 w-9 text-muted">{String(c) || "∅"}</th>)}</tr></thead>
        <tbody>
          {f.cells.map((row, i) => (
            <tr key={i}>
              <th className="pr-1 text-muted">{String(f.rowLabels[i]) || "∅"}</th>
              {row.map((v, j) => (
                <td key={j} className={`tnum h-9 w-9 rounded-lg border-2 transition-colors duration-300 ${isActive(i, j) ? "border-brand bg-brand text-brand-fg" : isDep(i, j) ? "border-lv3 bg-lv3/25" : v === null ? "border-dashed border-line text-muted/40" : "border-line-strong bg-surface"}`}>{v === null ? "·" : v}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-3 text-center text-[11px] font-semibold text-muted"><span className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-brand" />cell being filled <span className="mx-2" /><span className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-lv3" />cells it depends on</p>
    </div>
  );
}

import { Icon } from "@/components/Icon";

const DIFF: Record<string, { pips: number; cls: string; label: string }> = {
  EASY: { pips: 1, cls: "text-ok", label: "Easy" },
  MEDIUM: { pips: 2, cls: "text-warn", label: "Medium" },
  HARD: { pips: 3, cls: "text-bad", label: "Hard" },
  EXPERT: { pips: 4, cls: "text-lv6", label: "Expert" },
};

/** Difficulty as pips + word, so it never relies on colour alone. */
export function Difficulty({ value }: { value: string }) {
  const d = DIFF[value] ?? DIFF.EASY;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${d.cls}`}>
      <span className="flex gap-0.5" aria-hidden="true">{[0, 1, 2, 3].map((i) => <i key={i} className={`h-3 w-1 rounded-full ${i < d.pips ? "bg-current" : "bg-line-strong"}`} />)}</span>{d.label}
    </span>
  );
}

/** Original problems are hosted here (filled brand chip); external ones live elsewhere (outlined, with an arrow). */
export function KindBadge({ kind, source }: { kind: "INTERNAL" | "EXTERNAL"; source: string | null }) {
  return kind === "INTERNAL"
    ? <span className="chip chip-brand"><Icon name="code" size={12} />Original</span>
    : <span className="chip capitalize"><Icon name="arrowUpRight" size={12} />{source}</span>;
}

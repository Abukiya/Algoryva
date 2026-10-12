import Link from "next/link";
import type { TopicDef } from "@/lib/curriculum";
import { bySlug } from "@/lib/curriculum";
import { LEVEL_META } from "@/lib/levels";
import { readMinutes, type TopicState } from "@/lib/topic-state";
import { Icon } from "@/components/Icon";
import { isComplete } from "@/content/lessons-v2";

const STATE_LABEL: Record<TopicState, string> = { done: "Completed", current: "Up next", open: "Available", locked: "Locked", soon: "Coming soon" };

/** One topic on the roadmap/learn pages. State is shown by icon + label + border, never by colour alone. */
export function TopicCard({ topic, state, compact = false }: { topic: TopicDef; state: TopicState; compact?: boolean }) {
  const lv = `rgb(var(--lv${LEVEL_META[topic.level].n}))`;
  const mins = readMinutes(topic.slug);
  const missing = state === "locked" ? topic.prereqs.map((p) => bySlug.get(p)!.title) : [];
  const disabled = state === "soon";
  const base = "relative flex gap-3 rounded-2xl border p-3.5 transition duration-150";
  const tone = state === "current" ? "border-brand bg-brand/[.06] shadow-e2" : state === "done" ? "border-ok/30 bg-surface" : state === "locked" || disabled ? "border-line bg-sunken/50" : "border-line bg-surface hover:-translate-y-px hover:border-line-strong hover:shadow-e2";
  const body = (
    <>
      <span className={`mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 ${state === "done" ? "border-ok bg-ok text-white" : state === "current" ? "animate-beacon border-brand bg-surface text-brand" : "border-line-strong bg-surface text-muted"}`} style={state === "open" ? { borderColor: lv, color: lv } : undefined}>
        <Icon name={state === "done" ? "check" : state === "locked" ? "lock" : state === "soon" ? "clock" : "arrowRight"} size={state === "done" ? 17 : 15} strokeWidth={2.2} />
      </span>
      <span className="min-w-0 flex-1">
        <span className={`block font-bold leading-snug ${state === "locked" || disabled ? "text-soft" : ""}`}>{topic.title}</span>
        <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
          <span className={state === "current" ? "font-bold text-brand" : state === "done" ? "font-semibold text-ok" : ""}>{STATE_LABEL[state]}</span>
          {mins && !disabled && <span className="inline-flex items-center gap-1"><Icon name="clock" size={12} />{isComplete(topic.slug) ? `${mins} min` : `${mins} min read`}</span>}
          {!disabled && (isComplete(topic.slug) ? <span className="chip chip-brand !px-1.5 !py-0 text-[10px]">Full lesson</span> : <span className="chip !px-1.5 !py-0 text-[10px]">Outline</span>)}
        </span>
        {!compact && missing.length > 0 && <span className="mt-1.5 block text-xs text-muted">Needs {missing.join(", ")}</span>}
      </span>
    </>
  );
  return disabled
    ? <div className={`${base} ${tone}`} aria-label={`${topic.title}, coming soon`}>{body}</div>
    : <Link href={`/learn/${topic.slug}`} className={`${base} ${tone}`}>{body}</Link>;
}

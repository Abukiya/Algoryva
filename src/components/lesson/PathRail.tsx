import Link from "next/link";
import { TOPICS, bySlug, dependentsOf, type TopicDef } from "@/lib/curriculum";
import { LEVEL_META } from "@/lib/levels";
import type { TopicState } from "@/lib/topic-state";
import { Icon } from "@/components/Icon";
import { isComplete } from "@/content/lessons-v2";

const ICON: Record<TopicState, { name: "check" | "arrowRight" | "lock" | "clock"; cls: string; label: string }> = {
  done: { name: "check", cls: "text-ok", label: "Completed" },
  current: { name: "arrowRight", cls: "text-brand", label: "Up next" },
  open: { name: "arrowRight", cls: "text-muted", label: "Available" },
  locked: { name: "lock", cls: "text-muted", label: "Locked" },
  soon: { name: "clock", cls: "text-muted", label: "Planned" },
};

/** "Where am I": the topics of this level in order, with state, plus what this topic needs and unlocks. */
export function PathRail({ topic, states }: { topic: TopicDef; states: Map<string, TopicState> }) {
  const lv = LEVEL_META[topic.level];
  const siblings = TOPICS.filter((t) => t.level === topic.level);
  const at = siblings.findIndex((t) => t.slug === topic.slug) + 1;
  const done = siblings.filter((t) => states.get(t.slug) === "done").length;
  const list = (items: TopicDef[]) => items.length
    ? <ul className="mt-2 space-y-1.5">{items.map((p) => { const st = states.get(p.slug) ?? "open"; return <li key={p.slug} className="flex items-center gap-2"><Icon name={ICON[st].name} size={13} className={ICON[st].cls} strokeWidth={2.4} /><Link className="text-sm font-semibold hover:text-brand" href={`/learn/${p.slug}`}>{p.title}</Link><span className="sr-only">{ICON[st].label}</span></li>; })}</ul>
    : <p className="mt-2 text-sm text-muted">None</p>;
  return (
    <div className="space-y-6">
      <section aria-labelledby="where-h">
        <h2 id="where-h" className="text-sm font-extrabold">Where you are</h2>
        <p className="mt-1 text-xs text-muted"><span style={{ color: `rgb(var(--lv${lv.n}))` }} className="font-bold">{lv.label}</span> · topic {at} of {siblings.length} · {done} done</p>
        <ol className="mt-2 space-y-0.5 border-l border-line">
          {siblings.map((t) => {
            const st = states.get(t.slug) ?? "open", here = t.slug === topic.slug;
            return (
              <li key={t.slug}>
                <Link href={`/learn/${t.slug}`} aria-current={here ? "page" : undefined} className={`-ml-px flex items-center gap-2 border-l-2 py-1 pl-3 text-[13px] ${here ? "border-brand font-extrabold text-fg" : "border-transparent text-soft hover:border-line-strong hover:text-fg"}`}>
                  <Icon name={ICON[st].name} size={12} className={ICON[st].cls} strokeWidth={2.6} />
                  <span className="min-w-0 truncate">{t.title}</span>
                  {t.status === "PUBLISHED" && !isComplete(t.slug) && <span className="chip ml-auto shrink-0 !px-1.5 !py-0 text-[10px]">outline</span>}
                  <span className="sr-only">{ICON[st].label}</span>
                </Link>
              </li>
            );
          })}
        </ol>
      </section>
      <div><h2 className="text-sm font-extrabold">Builds on</h2>{list(topic.prereqs.map((p) => bySlug.get(p)!))}</div>
      <div><h2 className="text-sm font-extrabold">Unlocks</h2>{list(dependentsOf(topic.slug))}</div>
    </div>
  );
}

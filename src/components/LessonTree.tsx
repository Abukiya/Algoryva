import Link from "next/link";
import { Icon } from "@/components/Icon";
import { lessonTree, STATE_LABEL } from "@/lib/lesson-tree";
import type { TopicState } from "@/lib/topic-state";

const TONE: Record<TopicState, string> = {
  done: "border-ok/40 bg-ok/10 text-ok",
  current: "border-brand bg-brand/10 font-bold text-brand",
  open: "border-line bg-surface",
  locked: "border-line bg-sunken text-muted",
  soon: "border-line bg-sunken text-muted",
};

/**
 * Every lesson, grouped by level, as chips. The dashboard passes the learner's states; the login and signup pages pass none and set
 * `linked` to false, so the tree reads as a preview and does not pull anyone away from the form.
 */
export function LessonTree({ states, linked = true, legend = false }: { states?: ReadonlyMap<string, TopicState>; linked?: boolean; legend?: boolean }) {
  const groups = lessonTree(states);
  return (
    <div className="space-y-4" aria-label="Lesson tree">
      {groups.map((g) => (
        <div key={g.level}>
          <p className="flex items-baseline gap-2 text-xs font-bold text-muted">{g.label}<span className="tnum font-semibold">{g.items.length}</span></p>
          <ul className="mt-1.5 flex flex-wrap gap-1.5">
            {g.items.map((t) => {
              const chip = (
                <span className={`chip gap-1 ${TONE[t.state]}`}>
                  {t.state === "done" && <Icon name="check" size={12} />}
                  {t.state === "locked" && <Icon name="lock" size={12} />}
                  {t.title}
                  <span className="sr-only"> ({STATE_LABEL[t.state]})</span>
                </span>
              );
              return <li key={t.slug}>{linked && t.href ? <Link href={t.href} className="hover:opacity-90">{chip}</Link> : chip}</li>;
            })}
          </ul>
        </div>
      ))}
      {legend && (
        <p className="text-xs text-muted">
          <span className="font-semibold text-ok">Completed</span> · <span className="font-semibold text-brand">Up next</span> · Available · <Icon name="lock" size={11} className="inline align-[-1px]" /> Locked until its prerequisites are done
        </p>
      )}
    </div>
  );
}

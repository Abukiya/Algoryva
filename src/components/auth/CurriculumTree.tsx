import { LEVELS, TOPICS } from "@/lib/curriculum";
import { LEVEL_META, levelColor } from "@/lib/levels";

/** The live curriculum as a tree: one panel per level, every published topic listed in order. Built from TOPICS, so it never goes stale. */
export function CurriculumTree() {
  const live = TOPICS.filter((t) => t.status === "PUBLISHED");
  return (
    <div className="max-h-[68vh] overflow-y-auto pr-1">
      <p className="text-xs font-bold uppercase tracking-wide text-muted">The curriculum · {live.length} topics</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {LEVELS.map((level) => {
          const topics = live.filter((t) => t.level === level);
          if (topics.length === 0) return null;
          const m = LEVEL_META[level];
          return (
            <section key={level} aria-labelledby={`tree-${level}`} className="rounded-2xl border border-line bg-surface p-3.5">
              <h3 id={`tree-${level}`} className="flex items-center justify-between gap-2 text-sm font-extrabold" style={{ color: levelColor(level) }}>
                <span>{m.label}</span>
                <span className="tnum text-xs font-semibold text-muted">{topics.length}</span>
              </h3>
              <ul className="mt-2 space-y-1.5">
                {topics.map((t) => (
                  <li key={t.slug} className="flex items-start gap-2 text-[13px] leading-snug">
                    <span aria-hidden="true" className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: levelColor(level) }} />
                    <span>{t.title}</span>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </div>
  );
}

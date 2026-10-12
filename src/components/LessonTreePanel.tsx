import { LessonTree } from "@/components/LessonTree";
import { TOPICS } from "@/lib/curriculum";

/**
 * The heading and the lesson tree shown on the landing page and beside the login and signup forms, so all three read the same.
 * The caller supplies the card around it. `linked` makes each lesson a link (the landing page), and `scroll` caps the height (the narrow auth panel).
 */
export function LessonTreePanel({ linked = false, scroll = false }: { linked?: boolean; scroll?: boolean }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wide text-muted">{TOPICS.length} lessons, in order</p>
      <div className={scroll ? "mt-3 max-h-[60vh] overflow-y-auto pr-1" : "mt-3"}><LessonTree linked={linked} /></div>
    </div>
  );
}

import { LEVELS, TOPICS, type Level, type TopicDef } from "@/lib/curriculum";
import { LEVEL_META } from "@/lib/levels";
import type { TopicState } from "@/lib/topic-state";

export type TreeItem = { slug: string; title: string; state: TopicState; href: string | null };
export type TreeGroup = { level: Level; label: string; items: TreeItem[] };

/**
 * The lesson tree shown on the dashboard and beside the login and signup forms: every topic in the curriculum, grouped by level, in curriculum order.
 * It is built from TOPICS, so a new lesson appears everywhere with no other change. Coming-soon topics are included and marked.
 * `states` carries a signed-in learner's progress. Without it (guests), a published topic is "open" and a coming-soon topic is "soon".
 * Locked and coming-soon topics have no link.
 */
export function lessonTree(states?: ReadonlyMap<string, TopicState>, topics: readonly TopicDef[] = TOPICS): TreeGroup[] {
  return LEVELS.map((level) => ({
    level,
    label: LEVEL_META[level].label,
    items: topics.filter((t) => t.level === level).map((t): TreeItem => {
      const state: TopicState = states?.get(t.slug) ?? (t.status === "COMING_SOON" ? "soon" : "open");
      return { slug: t.slug, title: t.title, state, href: state === "locked" || state === "soon" ? null : `/learn/${t.slug}` };
    }),
  })).filter((g) => g.items.length > 0);
}

export const STATE_LABEL: Record<TopicState, string> = { done: "completed", current: "up next", open: "available", locked: "locked", soon: "coming soon" };

import { TOPICS, type TopicDef } from "@/lib/curriculum";
import { LESSONS } from "@/content/lessons";
import { LESSONS_V2 } from "@/content/lessons-v2";
import { unlockState } from "@/lib/recommend";

export type TopicState = "done" | "current" | "open" | "locked" | "soon";

/** Guests have no progress, so nothing is shown as locked for them. done: completed. current: the first unlocked unfinished topic in curriculum order. open: unlocked but not the current one. locked: prerequisites missing. soon: not written yet. */
export function topicStates(completed: ReadonlySet<string>, guest = false): Map<string, TopicState> {
  const out = new Map<string, TopicState>();
  let currentTaken = false;
  for (const t of TOPICS) {
    if (t.status === "COMING_SOON") { out.set(t.slug, "soon"); continue; }
    if (completed.has(t.slug)) { out.set(t.slug, "done"); continue; }
    if (!guest && !unlockState(t.slug, completed).unlocked) { out.set(t.slug, "locked"); continue; }
    out.set(t.slug, currentTaken ? "open" : "current");
    currentTaken = true;
  }
  return out;
}

/** Reading time: the authored estimate for complete lessons, otherwise a rough count from the outline text; 200 words per minute, at least 1. Admin-authored lessons are not counted. */
export function readMinutes(slug: string): number | null {
  if (LESSONS_V2[slug]) return LESSONS_V2[slug].minutes;
  const blocks = LESSONS[slug]?.blocks;
  if (!blocks) return null;
  const words = blocks.reduce((n, b) => n + b.text.split(/\s+/).length + (b.code ? b.code.split(/\s+/).length / 2 : 0), 0);
  return Math.max(1, Math.round(words / 200));
}

export const publishedTopics = (): TopicDef[] => TOPICS.filter((t) => t.status === "PUBLISHED");

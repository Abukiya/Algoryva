import { TOPICS, bySlug, type TopicDef } from "./curriculum";

/** Topic is unlocked when every prerequisite is completed. Coming-soon topics are never recommended. */
export function unlockState(slug: string, completed: ReadonlySet<string>) {
  const topic = bySlug.get(slug);
  if (!topic) throw new Error(`Unknown topic: ${slug}`);
  const missing = topic.prereqs.filter((p) => !completed.has(p));
  return { unlocked: missing.length === 0, missing: missing.map((m) => bySlug.get(m)!.title) };
}

/** Deterministic next-topic rule: first published, uncompleted, unlocked topic in curriculum order. */
export function nextTopics(completed: ReadonlySet<string>, limit = 3): TopicDef[] {
  return TOPICS.filter((t) => t.status === "PUBLISHED" && !completed.has(t.slug) && unlockState(t.slug, completed).unlocked).slice(0, limit);
}

const LADDER_DAYS = [1, 3, 7, 14, 30];
export function nextReviewDate(from: Date, step: number): Date {
  const days = LADDER_DAYS[Math.min(step, LADDER_DAYS.length - 1)];
  return new Date(from.getTime() + days * 86_400_000);
}

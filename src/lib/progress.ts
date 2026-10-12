import "server-only";
import { db } from "@/lib/db";
import { bySlug } from "@/lib/curriculum";
import { recordActivity } from "@/lib/activity";
import { nextReviewDate, unlockState } from "@/lib/recommend";

export async function getCompletedSlugs(userId: string): Promise<Set<string>> {
  const rows = await db.topicProgress.findMany({
    where: { userId, completedAt: { not: null } },
    select: { topic: { select: { slug: true } } },
  });
  return new Set(rows.map((r) => r.topic.slug));
}

/** Server-enforced: a topic can only be completed when it is published and all prerequisites are done. */
export async function completeTopic(userId: string, slug: string) {
  const def = bySlug.get(slug);
  if (!def || def.status !== "PUBLISHED") return { ok: false as const, error: "Topic is not available." };
  const state = unlockState(slug, await getCompletedSlugs(userId));
  if (!state.unlocked) return { ok: false as const, error: `Complete first: ${state.missing.join(", ")}` };
  const topic = await db.topic.findUnique({ where: { slug }, select: { id: true } });
  if (!topic) return { ok: false as const, error: "Topic not seeded." };
  await db.$transaction([
    db.topicProgress.upsert({
      where: { userId_topicId: { userId, topicId: topic.id } },
      update: { completedAt: new Date() },
      create: { userId, topicId: topic.id, completedAt: new Date() },
    }),
    db.reviewItem.upsert({
      where: { userId_topicId: { userId, topicId: topic.id } },
      update: {},
      create: { userId, topicId: topic.id, step: 0, dueAt: nextReviewDate(new Date(), 0) },
    }),
  ]);
  await recordActivity(userId, "topic_complete");
  return { ok: true as const };
}

export async function dueReviews(userId: string) {
  const items = await db.reviewItem.findMany({ where: { userId, dueAt: { lte: new Date() } }, orderBy: { dueAt: "asc" }, take: 10 });
  const topics = await db.topic.findMany({ where: { id: { in: items.map((i) => i.topicId) } }, select: { id: true, slug: true, title: true } });
  const byId = new Map(topics.map((t) => [t.id, t]));
  return items.flatMap((i) => { const t = byId.get(i.topicId); return t ? [{ topicId: i.topicId, slug: t.slug, title: t.title }] : []; });
}

/** rating: "again" restarts the ladder, "good" advances it. Scoped to the user so other users' items can't be touched. */
export async function completeReview(userId: string, topicId: string, rating: "again" | "good") {
  const item = await db.reviewItem.findUnique({ where: { userId_topicId: { userId, topicId } } });
  if (!item) return;
  const step = rating === "good" ? item.step + 1 : 0;
  await db.reviewItem.update({ where: { id: item.id }, data: { step, dueAt: nextReviewDate(new Date(), step) } });
  await recordActivity(userId, "review");
}

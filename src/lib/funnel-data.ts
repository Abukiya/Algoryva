import "server-only";
import { db } from "@/lib/db";
import { TOPICS } from "@/lib/curriculum";
import { buildFunnel, type FunnelRow } from "@/lib/funnel";

/** Loads the funnel for every published topic, in curriculum order. */
export async function loadFunnel(): Promise<FunnelRow[]> {
  const order = new Map(TOPICS.map((t, i) => [t.slug, i]));
  const live = new Set(TOPICS.filter((t) => t.status === "PUBLISHED").map((t) => t.slug));
  const [topics, started, completed, quiz, passed] = await Promise.all([
    db.topic.findMany({ select: { id: true, slug: true, title: true } }),
    db.topicProgress.groupBy({ by: ["topicId"], _count: { _all: true } }),
    db.topicProgress.groupBy({ by: ["topicId"], where: { completedAt: { not: null } }, _count: { _all: true } }),
    db.quizResult.groupBy({ by: ["topicId"], _count: { _all: true }, _sum: { attempts: true } }),
    db.quizResult.groupBy({ by: ["topicId"], where: { passedAt: { not: null } }, _count: { _all: true } }),
  ]);
  const count = (rows: { topicId: string; _count: { _all: number } }[]) => new Map(rows.map((r) => [r.topicId, r._count._all]));
  const attempts = new Map(quiz.map((r) => [r.topicId, r._sum.attempts ?? 0]));
  const ordered = topics
    .filter((t) => live.has(t.slug))
    .sort((a, b) => (order.get(a.slug) ?? 0) - (order.get(b.slug) ?? 0));
  return buildFunnel(ordered, count(started), count(completed), count(quiz), count(passed), attempts);
}

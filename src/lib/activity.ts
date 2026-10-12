import "server-only";
import { db } from "@/lib/db";
import { computeStreak } from "@/lib/streak";

export async function recordActivity(userId: string, type: "topic_complete" | "problem_solved" | "review" | "quiz_pass") {
  await db.activity.create({ data: { userId, type } });
}

export async function getStreak(userId: string) {
  const rows = await db.activity.findMany({ where: { userId, createdAt: { gte: new Date(Date.now() - 400 * 86_400_000) } }, select: { createdAt: true } });
  return computeStreak(rows.map((r) => r.createdAt));
}

/** Activity counts for the last 7 UTC days, oldest first. Used by the dashboard week strip. */
export async function getWeekActivity(userId: string) {
  const day = 86_400_000, today = Math.floor(Date.now() / day);
  const rows = await db.activity.findMany({ where: { userId, createdAt: { gte: new Date((today - 6) * day) } }, select: { createdAt: true } });
  const counts = new Map<number, number>();
  rows.forEach((r) => { const d = Math.floor(r.createdAt.getTime() / day); counts.set(d, (counts.get(d) ?? 0) + 1); });
  return Array.from({ length: 7 }, (_, i) => { const d = today - 6 + i; return { date: new Date(d * day), count: counts.get(d) ?? 0, isToday: d === today }; });
}

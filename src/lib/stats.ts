import "server-only";
import { db } from "@/lib/db";
import { getStreak } from "@/lib/activity";
import { getCompletedSlugs } from "@/lib/progress";
import type { Stats } from "@/lib/gamification";

export async function getStats(userId: string): Promise<Stats> {
  const [completed, solves, reviews, streak, mistakes, notes] = await Promise.all([
    getCompletedSlugs(userId),
    db.problemSolve.findMany({ where: { userId }, select: { problem: { select: { difficulty: true } } } }),
    db.activity.count({ where: { userId, type: "review" } }),
    getStreak(userId),
    db.mistake.count({ where: { userId } }),
    db.note.count({ where: { userId } }),
  ]);
  const d = (k: string) => solves.filter((s) => s.problem.difficulty === k).length;
  return { topics: completed.size, solvedEasy: d("EASY"), solvedMedium: d("MEDIUM"), solvedHard: solves.length - d("EASY") - d("MEDIUM"), reviews, longestStreak: streak.longest, mistakes, notes };
}

import "server-only";
import { db } from "@/lib/db";
import { endsAt, isRunning, rank, scoreEntry } from "@/lib/contest-scoring";

export async function getOrStartEntry(userId: string, contestId: string) {
  return db.contestEntry.upsert({ where: { contestId_userId: { contestId, userId } }, update: {}, create: { contestId, userId } });
}

export async function contestState(contestId: string, durationMin: number, userId?: string) {
  const entry = userId ? await db.contestEntry.findUnique({ where: { contestId_userId: { contestId, userId } } }) : null;
  if (!entry) return { started: false as const };
  return { started: true as const, entry, running: isRunning(entry.startedAt, durationMin), endsAt: endsAt(entry.startedAt, durationMin) };
}

export async function leaderboard(contestId: string) {
  const entries = await db.contestEntry.findMany({ where: { contestId }, include: { user: { select: { username: true } }, solves: { select: { solvedAt: true } } } });
  return rank(entries.map((e) => ({ name: e.user.username, ...scoreEntry(e.startedAt, e.solves) })));
}

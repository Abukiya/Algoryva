import "server-only";
import type { Difficulty, Prisma } from "@prisma/client";
import { db } from "@/lib/db";

export const PAGE_SIZE = 20;
// Difficulty enum order is EASY < MEDIUM < HARD < EXPERT, so ordering by the column sorts by difficulty.
const ORDER: Record<NonNullable<Filters["sort"]>, Prisma.ProblemOrderByWithRelationInput[]> = {
  default: [{ position: "asc" }, { title: "asc" }],
  easiest: [{ difficulty: "asc" }, { position: "asc" }],
  hardest: [{ difficulty: "desc" }, { position: "asc" }],
  title: [{ title: "asc" }],
};
export type Filters = { q?: string; topic?: string; difficulty?: Difficulty; platform?: string; status?: "solved" | "unsolved"; sort?: "default" | "easiest" | "hardest" | "title"; page: number };

export async function listProblems(f: Filters, userId?: string) {
  const where: Prisma.ProblemWhereInput = { status: "PUBLISHED" };
  if (f.q) where.title = { contains: f.q, mode: "insensitive" };
  if (f.topic) where.topics = { some: { topic: { slug: f.topic } } };
  if (f.difficulty) where.difficulty = f.difficulty;
  if (f.platform === "original") where.kind = "INTERNAL";
  else if (f.platform === "external") where.kind = "EXTERNAL";
  else if (f.platform) where.source = f.platform;
  if (userId && f.status) where.solves = f.status === "solved" ? { some: { userId } } : { none: { userId } };
  const [items, total] = await Promise.all([
    db.problem.findMany({
      where, orderBy: ORDER[f.sort ?? "default"],
      skip: (f.page - 1) * PAGE_SIZE, take: PAGE_SIZE,
      select: { id: true, slug: true, title: true, kind: true, difficulty: true, source: true, externalUrl: true, topics: { select: { topic: { select: { slug: true, title: true } } } } },
    }),
    db.problem.count({ where }),
  ]);
  const solved = userId
    ? new Set((await db.problemSolve.findMany({ where: { userId, problemId: { in: items.map((i) => i.id) } }, select: { problemId: true } })).map((s) => s.problemId))
    : new Set<string>();
  return { items, total, solved, pages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

const SELECT = { id: true, slug: true, title: true, kind: true, difficulty: true, source: true } as const;

export async function searchProblems(q: string) {
  return db.problem.findMany({
    where: { status: "PUBLISHED", OR: [{ title: { contains: q, mode: "insensitive" } }, { topics: { some: { topic: { title: { contains: q, mode: "insensitive" } } } } }] },
    orderBy: [{ position: "asc" }], take: 20, select: SELECT,
  });
}

/** Rule-based: unsolved problems from topics the user has completed, easiest first (enum order EASY < MEDIUM < HARD < EXPERT). */
export async function recommendProblems(userId: string, completedTopicSlugs: string[], limit = 5) {
  if (completedTopicSlugs.length === 0) return [];
  return db.problem.findMany({
    where: { status: "PUBLISHED", topics: { some: { topic: { slug: { in: completedTopicSlugs } } } }, solves: { none: { userId } } },
    orderBy: [{ difficulty: "asc" }, { position: "asc" }], take: limit, select: { ...SELECT, externalUrl: true },
  });
}

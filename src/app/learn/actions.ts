"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { LESSONS_V2 } from "@/content/lessons-v2";
import { passMark } from "@/lib/mastery";
import { recordActivity } from "@/lib/activity";

export type QuizOutcome = { ok: true; score: number; total: number; passed: boolean; firstPass: boolean } | { ok: false; error: string };

/** The score is recomputed here from the lesson data, so the client cannot claim a pass. */
export async function submitQuiz(slug: string, answers: number[]): Promise<QuizOutcome> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Log in to save your result." };
  const lesson = LESSONS_V2[slug];
  if (!lesson) return { ok: false, error: "This lesson has no mastery check." };
  if (!Array.isArray(answers) || answers.length !== lesson.checks.length || answers.some((a) => !Number.isInteger(a))) return { ok: false, error: "Answer every question first." };
  const score = lesson.checks.reduce((n, c, i) => n + (answers[i] === c.answer ? 1 : 0), 0);
  const total = lesson.checks.length, passed = score >= passMark(total);
  const topic = await db.topic.findUnique({ where: { slug }, select: { id: true } });
  if (!topic) return { ok: false, error: "Topic not seeded." };
  const prev = await db.quizResult.findUnique({ where: { userId_topicId: { userId: user.id, topicId: topic.id } } });
  const firstPass = passed && !prev?.passedAt;
  await db.quizResult.upsert({
    where: { userId_topicId: { userId: user.id, topicId: topic.id } },
    create: { userId: user.id, topicId: topic.id, bestScore: score, total, passedAt: passed ? new Date() : null },
    update: { bestScore: Math.max(prev?.bestScore ?? 0, score), total, attempts: { increment: 1 }, ...(firstPass ? { passedAt: new Date() } : {}) },
  });
  if (firstPass) await recordActivity(user.id, "quiz_pass");
  revalidatePath(`/learn/${slug}`);
  return { ok: true, score, total, passed, firstPass };
}

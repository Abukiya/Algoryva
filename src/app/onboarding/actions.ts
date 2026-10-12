"use server";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import type { Level } from "@prisma/client";

const EXPERIENCE = ["beginner", "some", "comfortable", "competitive"] as const;
const LANGS = ["python", "cpp", "java", "js"] as const;
// Levels treated as already known, per experience. Runs once per account.
const KNOWN: Record<(typeof EXPERIENCE)[number], Level[]> = {
  beginner: [], some: [], comfortable: ["FOUNDATION"], competitive: ["FOUNDATION", "BEGINNER", "CORE"],
};

export async function completeOnboarding(form: FormData) {
  const user = await requireUser();
  if (user.onboarded) redirect("/dashboard");
  const experience = EXPERIENCE.find((e) => e === form.get("experience")) ?? "beginner";
  const language = LANGS.find((l) => l === form.get("language")) ?? "python";
  const known = KNOWN[experience];
  const topics = known.length ? await db.topic.findMany({ where: { level: { in: known }, status: "PUBLISHED" }, select: { id: true } }) : [];
  await db.$transaction([
    ...topics.map((t) => db.topicProgress.upsert({ where: { userId_topicId: { userId: user.id, topicId: t.id } }, update: {}, create: { userId: user.id, topicId: t.id, completedAt: new Date() } })),
    db.user.update({ where: { id: user.id }, data: { experience, preferredLanguage: language, onboarded: true } }),
  ]);
  redirect("/dashboard");
}

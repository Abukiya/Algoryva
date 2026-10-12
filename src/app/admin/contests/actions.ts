"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";
import { slugify } from "@/lib/url";
import type { ContentStatus } from "@prisma/client";

export type SaveState = { error?: string } | undefined;

export async function saveContest(_: SaveState, form: FormData): Promise<SaveState> {
  await requireAdmin();
  const id = String(form.get("id") ?? "") || undefined;
  const title = String(form.get("title") ?? "").trim();
  if (title.length < 3 || title.length > 120) return { error: "Title must be 3-120 characters." };
  const description = String(form.get("description") ?? "").trim().slice(0, 2000);
  const durationMin = Number.parseInt(String(form.get("durationMin") ?? ""), 10);
  if (!Number.isInteger(durationMin) || durationMin < 5 || durationMin > 600) return { error: "Duration must be 5-600 minutes." };
  const status: ContentStatus = form.get("status") === "PUBLISHED" ? "PUBLISHED" : "DRAFT";
  const problemIds = [...new Set(form.getAll("problemIds").map(String))];
  if (problemIds.length < 1 || problemIds.length > 12) return { error: "Choose 1-12 problems." };
  const found = await db.problem.count({ where: { id: { in: problemIds } } });
  if (found !== problemIds.length) return { error: "A selected problem no longer exists." };

  const data = { title, description, durationMin, status };
  const contestId = await db.$transaction(async (tx) => {
    const c = id ? await tx.contest.update({ where: { id }, data }) : await tx.contest.create({ data: { ...data, slug: slugify(title) } });
    await tx.contestProblem.deleteMany({ where: { contestId: c.id } });
    await tx.contestProblem.createMany({ data: problemIds.map((problemId, i) => ({ contestId: c.id, problemId, position: i, label: String.fromCharCode(65 + i) })) });
    return c.id;
  });
  revalidatePath("/contests"); revalidatePath(`/admin/contests/${contestId}`);
  redirect("/admin/contests");
}

export async function deleteContest(form: FormData) {
  await requireAdmin();
  await db.contest.delete({ where: { id: String(form.get("id") ?? "") } });
  revalidatePath("/contests"); revalidatePath("/admin/contests");
}

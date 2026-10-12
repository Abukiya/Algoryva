"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";
import { parseMistake } from "@/lib/mistake-validation";

export type SaveState = { error?: string } | undefined;

export async function createMistake(_: SaveState, form: FormData): Promise<SaveState> {
  const user = await requireUser();
  const r = parseMistake(form);
  if (!r.ok) return { error: r.error };
  if (r.value.problemId && !(await db.problem.findFirst({ where: { id: r.value.problemId, status: "PUBLISHED" }, select: { id: true } }))) return { error: "Unknown problem." };
  await db.mistake.create({ data: { ...r.value, userId: user.id } });
  revalidatePath("/mistakes");
  redirect("/mistakes");
}

export async function deleteMistake(form: FormData) {
  const user = await requireUser();
  await db.mistake.deleteMany({ where: { id: String(form.get("id") ?? ""), userId: user.id } }); // scoped to owner (no IDOR)
  revalidatePath("/mistakes");
}

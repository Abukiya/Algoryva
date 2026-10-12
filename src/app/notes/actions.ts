"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth/session";

export type NoteState = { error?: string; ok?: boolean } | undefined;

export async function createNote(_: NoteState, form: FormData): Promise<NoteState> {
  const user = await requireUser();
  const title = String(form.get("title") ?? "").trim();
  const body = String(form.get("body") ?? "").trim();
  const tags = [...new Set(String(form.get("tags") ?? "").split(",").map((t) => t.trim().toLowerCase()).filter(Boolean))];
  if (title.length < 1 || title.length > 120) return { error: "Title must be 1-120 characters." };
  if (body.length < 1 || body.length > 20000) return { error: "Note must be 1-20000 characters." };
  if (tags.length > 5 || tags.some((t) => !/^[a-z0-9-]{1,24}$/.test(t))) return { error: "Up to 5 tags, letters/numbers/dashes only." };
  await db.note.create({ data: { userId: user.id, title, body, tags } });
  revalidatePath("/notes");
  return { ok: true };
}

export async function deleteNote(form: FormData) {
  const user = await requireUser();
  await db.note.deleteMany({ where: { id: String(form.get("id") ?? ""), userId: user.id } });
  revalidatePath("/notes");
}

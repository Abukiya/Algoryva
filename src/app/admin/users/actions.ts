"use server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth/session";

export async function setRole(form: FormData) {
  const admin = await requireAdmin();
  const id = String(form.get("id") ?? "");
  const role = form.get("role") === "ADMIN" ? "ADMIN" : "USER";
  if (id === admin.id) return; // an admin cannot change their own role
  await db.user.update({ where: { id }, data: { role } });
  revalidatePath("/admin/users");
}

export async function setSuspended(form: FormData) {
  const admin = await requireAdmin();
  const id = String(form.get("id") ?? "");
  if (id === admin.id) return;
  const suspended = form.get("suspend") === "1";
  await db.$transaction([
    db.user.update({ where: { id }, data: { suspended } }),
    ...(suspended ? [db.session.deleteMany({ where: { userId: id } })] : []),
  ]);
  revalidatePath("/admin/users");
}

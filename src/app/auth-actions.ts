"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth/password";
import { requireUser } from "@/lib/auth/session";
import { consumeToken, createToken } from "@/lib/auth/tokens";
import { sendEmail } from "@/lib/mailer";
import { normalizeEmail } from "@/lib/auth/validation";
import { HOUR, anyBlocked, isBlocked, record, recordAll, trustedClientIp, type Limit } from "@/lib/rate-limit";

export type AuthState = { error?: string; message?: string } | undefined;
const base = () => process.env.SITE_URL ?? "http://localhost:3000";

export async function requestPasswordReset(_: AuthState, form: FormData): Promise<AuthState> {
  const email = normalizeEmail(String(form.get("email") ?? ""));
  // Nothing can match an empty address. Answer neutrally without writing a shared empty-string bucket.
  if (!email) return { message: "If that email has an account, a reset link is on its way." };
  // Per-email limit always applies. A per-IP limit is added only when a trusted proxy IP is available.
  const ip = await trustedClientIp();
  const limits: Limit[] = [{ key: `forgot-email:${email}`, max: 5, windowMs: HOUR }];
  if (ip) limits.push({ key: `forgot-ip:${ip}`, max: 5, windowMs: HOUR });
  if (await anyBlocked(limits)) return { error: "Too many requests. Try again later." };
  await recordAll(limits.map((l) => l.key));
  const user = await db.user.findUnique({ where: { email }, select: { id: true, suspended: true } });
  if (user && !user.suspended) {
    const token = await createToken(user.id, "reset", HOUR);
    await sendEmail(email, "Reset your Algoryva password", `Use this link within one hour to choose a new Algoryva password:\n${base()}/reset-password?token=${token}\n\nIf you did not ask for this, ignore this email.`);
  }
  return { message: "If that email has an account, a reset link is on its way." }; // same answer either way
}

export async function resetPassword(_: AuthState, form: FormData): Promise<AuthState> {
  const password = String(form.get("password") ?? "");
  if (password.length < 10 || password.length > 128) return { error: "Password must be 10-128 characters." };
  const userId = await consumeToken(String(form.get("token") ?? ""), "reset");
  if (!userId) return { error: "This reset link is invalid or has expired." };
  const passwordHash = await hashPassword(password);
  await db.$transaction([db.user.update({ where: { id: userId }, data: { passwordHash } }), db.session.deleteMany({ where: { userId } })]);
  redirect("/login");
}

export async function resendVerification() {
  const user = await requireUser();
  const row = await db.user.findUnique({ where: { id: user.id }, select: { email: true, emailVerifiedAt: true } });
  if (!row || row.emailVerifiedAt) return;
  const key = `verify:${user.id}`;
  if (await isBlocked(key, 3, HOUR)) return;
  await record(key);
  const token = await createToken(user.id, "verify", 24 * HOUR);
  await sendEmail(row.email, "Verify your Algoryva email", `Confirm your email address to finish setting up Algoryva:\n${base()}/verify-email?token=${token}`);
  revalidatePath("/dashboard");
}

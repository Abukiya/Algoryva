export type Result<T> = { ok: true; value: T } | { ok: false; error: string };
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME = /^[a-zA-Z0-9_]{3,24}$/;

/** Canonical email form for lookups and rate-limit keys. Every email-keyed path must use this. */
export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

export function parseRegister(form: FormData): Result<{ email: string; username: string; password: string }> {
  const email = normalizeEmail(String(form.get("email") ?? ""));
  const username = String(form.get("username") ?? "").trim();
  const password = String(form.get("password") ?? "");
  if (!EMAIL.test(email) || email.length > 254) return { ok: false, error: "Enter a valid email address." };
  if (!USERNAME.test(username)) return { ok: false, error: "Username must be 3-24 letters, numbers or underscores." };
  if (password.length < 10 || password.length > 128) return { ok: false, error: "Password must be 10-128 characters." };
  return { ok: true, value: { email, username, password } };
}

export function parseLogin(form: FormData): Result<{ email: string; password: string }> {
  const email = normalizeEmail(String(form.get("email") ?? ""));
  const password = String(form.get("password") ?? "");
  if (!email || !password) return { ok: false, error: "Enter your email and password." };
  return { ok: true, value: { email, password } };
}

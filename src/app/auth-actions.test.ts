import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const store = vi.hoisted(() => ({ attempts: [] as { key: string; createdAt: Date }[] }));
const mocks = vi.hoisted(() => ({
  headers: vi.fn(),
  userFindUnique: vi.fn(),
  sendEmail: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ headers: mocks.headers }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("@/lib/db", () => ({
  db: {
    user: { findUnique: mocks.userFindUnique },
    authAttempt: {
      count: vi.fn(async ({ where }: { where: { key: string; createdAt: { gte: Date } } }) =>
        store.attempts.filter((a) => a.key === where.key && a.createdAt >= where.createdAt.gte).length),
      create: vi.fn(async ({ data }: { data: { key: string } }) => {
        store.attempts.push({ key: data.key, createdAt: new Date() });
        return data;
      }),
      deleteMany: vi.fn(async () => ({ count: 0 })),
    },
  },
}));
vi.mock("@/lib/auth/password", () => ({ hashPassword: vi.fn(async () => "hash") }));
vi.mock("@/lib/auth/session", () => ({ requireUser: vi.fn(async () => ({ id: "user-1" })) }));
vi.mock("@/lib/auth/tokens", () => ({ consumeToken: vi.fn(), createToken: vi.fn(async () => "token") }));
vi.mock("@/lib/mailer", () => ({ sendEmail: mocks.sendEmail }));

import { requestPasswordReset } from "./auth-actions";

function form(fields: Record<string, string>) {
  const f = new FormData();
  for (const [k, v] of Object.entries(fields)) f.set(k, v);
  return f;
}

const NEUTRAL = { message: "If that email has an account, a reset link is on its way." };
const BLOCKED = { error: "Too many requests. Try again later." };

describe("requestPasswordReset rate limiting (AUD-002)", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    delete process.env.TRUST_PROXY;
    delete process.env.TRUSTED_PROXY_HOPS;
    store.attempts.length = 0;
    vi.clearAllMocks();
    mocks.userFindUnique.mockResolvedValue(null);
    mocks.headers.mockResolvedValue(new Headers());
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("normalises the email for both the lookup and the rate-limit key", async () => {
    await requestPasswordReset(undefined, form({ email: "  User@Example.COM " }));
    expect(mocks.userFindUnique).toHaveBeenCalledWith({ where: { email: "user@example.com" }, select: { id: true, suspended: true } });
    expect(store.attempts.map((a) => a.key)).toEqual(["forgot-email:user@example.com"]);
  });

  it("with trust off, rotating x-forwarded-for does not bypass the 5-per-hour per-email limit", async () => {
    for (let i = 0; i < 5; i++) {
      mocks.headers.mockResolvedValue(new Headers({ "x-forwarded-for": `198.51.100.${i + 1}` }));
      expect(await requestPasswordReset(undefined, form({ email: "victim@example.com" }))).toEqual(NEUTRAL);
    }
    mocks.headers.mockResolvedValue(new Headers({ "x-forwarded-for": "198.51.100.99" }));
    expect(await requestPasswordReset(undefined, form({ email: "VICTIM@example.com" }))).toEqual(BLOCKED);
  });

  it("with trust off, one spoofed header across many emails is not an IP-wide block", async () => {
    mocks.headers.mockResolvedValue(new Headers({ "x-forwarded-for": "203.0.113.7" }));
    for (let i = 0; i < 6; i++) {
      expect(await requestPasswordReset(undefined, form({ email: `person${i}@example.com` }))).toEqual(NEUTRAL);
    }
    expect(store.attempts.every((a) => a.key.startsWith("forgot-email:"))).toBe(true);
  });

  it("with trust on, adds a per-IP key from a valid forwarded address", async () => {
    vi.stubEnv("TRUST_PROXY", "true");
    mocks.headers.mockResolvedValue(new Headers({ "x-forwarded-for": "203.0.113.7" }));
    await requestPasswordReset(undefined, form({ email: "a@example.com" }));
    expect(store.attempts.map((a) => a.key).sort()).toEqual(["forgot-email:a@example.com", "forgot-ip:203.0.113.7"]);
  });

  it("returns the neutral message and writes no rate-limit row for an empty address", async () => {
    expect(await requestPasswordReset(undefined, form({ email: "   " }))).toEqual(NEUTRAL);
    expect(store.attempts).toEqual([]);
    expect(mocks.userFindUnique).not.toHaveBeenCalled();
  });
});

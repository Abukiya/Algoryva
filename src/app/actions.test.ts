import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// In-memory AuthAttempt table so isBlocked/record run the real rate-limit logic.
const store = vi.hoisted(() => ({ attempts: [] as { key: string; createdAt: Date }[] }));
const mocks = vi.hoisted(() => ({
  headers: vi.fn(),
  userFindUnique: vi.fn(),
  userFindFirst: vi.fn(),
  hashPassword: vi.fn(),
  verifyPassword: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ headers: mocks.headers }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/db", () => ({
  db: {
    user: { findUnique: mocks.userFindUnique, findFirst: mocks.userFindFirst, create: vi.fn() },
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
vi.mock("@/lib/auth/password", () => ({ hashPassword: mocks.hashPassword, verifyPassword: mocks.verifyPassword }));
vi.mock("@/lib/auth/session", () => ({
  createSession: vi.fn(),
  destroySession: vi.fn(),
  requireUser: vi.fn(async () => ({ id: "user-1" })),
}));
vi.mock("@/lib/auth/tokens", () => ({ createToken: vi.fn(async () => "token") }));
vi.mock("@/lib/mailer", () => ({ sendEmail: vi.fn() }));
vi.mock("@/lib/progress", () => ({ completeReview: vi.fn(), completeTopic: vi.fn() }));

import { login, register } from "./actions";

function form(fields: Record<string, string>) {
  const f = new FormData();
  for (const [k, v] of Object.entries(fields)) f.set(k, v);
  return f;
}

function setHeaders(init: Record<string, string>) {
  mocks.headers.mockResolvedValue(new Headers(init));
}

const LOGIN_BLOCKED = "Too many failed attempts. Try again in 15 minutes.";
const LOGIN_FAILED = "Invalid email or password.";

describe("login rate limiting (AUD-002)", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    delete process.env.TRUST_PROXY;
    delete process.env.TRUSTED_PROXY_HOPS;
    store.attempts.length = 0;
    vi.clearAllMocks();
    mocks.userFindUnique.mockResolvedValue(null);
    mocks.hashPassword.mockResolvedValue("hash");
    mocks.verifyPassword.mockResolvedValue(false);
    setHeaders({});
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("with trust off, rotating x-forwarded-for does not escape the per-email lockout", async () => {
    for (let i = 0; i < 5; i++) {
      setHeaders({ "x-forwarded-for": `198.51.100.${i + 1}` });
      expect(await login(undefined, form({ email: "Victim@Example.com", password: "wrong-password-1" }))).toEqual({ error: LOGIN_FAILED });
    }
    setHeaders({ "x-forwarded-for": "198.51.100.200" });
    expect(await login(undefined, form({ email: "victim@example.com", password: "wrong-password-1" }))).toEqual({ error: LOGIN_BLOCKED });
  });

  it("with trust off, records only the normalised per-email key and never an IP key", async () => {
    setHeaders({ "x-forwarded-for": "203.0.113.7", "x-real-ip": "203.0.113.8" });
    await login(undefined, form({ email: " Victim@Example.com ", password: "wrong-password-1" }));
    expect(store.attempts.map((a) => a.key)).toEqual(["login-email:victim@example.com"]);
  });

  it("with trust off, does not share an IP bucket across different emails", async () => {
    setHeaders({ "x-forwarded-for": "203.0.113.7" });
    for (let i = 0; i < 5; i++) {
      await login(undefined, form({ email: `user${i}@example.com`, password: "wrong-password-1" }));
    }
    expect(await login(undefined, form({ email: "fresh@example.com", password: "wrong-password-1" }))).toEqual({ error: LOGIN_FAILED });
  });

  it("with trust on, adds a per-IP key from a valid forwarded address", async () => {
    vi.stubEnv("TRUST_PROXY", "true");
    setHeaders({ "x-forwarded-for": "203.0.113.7" });
    await login(undefined, form({ email: "a@example.com", password: "wrong-password-1" }));
    expect(store.attempts.map((a) => a.key).sort()).toEqual(["login-email:a@example.com", "login-ip:203.0.113.7"]);
  });

  it("with trust on, a malformed header falls back to email-only keys instead of trusting it", async () => {
    vi.stubEnv("TRUST_PROXY", "true");
    setHeaders({ "x-forwarded-for": "unknown" });
    await login(undefined, form({ email: "a@example.com", password: "wrong-password-1" }));
    expect(store.attempts.map((a) => a.key)).toEqual(["login-email:a@example.com"]);
  });

  it("with trust on, blocks a single IP after 20 failures across different emails", async () => {
    vi.stubEnv("TRUST_PROXY", "true");
    setHeaders({ "x-forwarded-for": "203.0.113.7" });
    for (let i = 0; i < 20; i++) {
      expect(await login(undefined, form({ email: `u${i}@example.com`, password: "wrong-password-1" }))).toEqual({ error: LOGIN_FAILED });
    }
    expect(await login(undefined, form({ email: "u99@example.com", password: "wrong-password-1" }))).toEqual({ error: LOGIN_BLOCKED });
  });
});

describe("register rate limiting (AUD-002)", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    delete process.env.TRUST_PROXY;
    delete process.env.TRUSTED_PROXY_HOPS;
    store.attempts.length = 0;
    vi.clearAllMocks();
    // An existing account exits before any user is created, so these tests never write a user row.
    mocks.userFindFirst.mockResolvedValue({ id: "existing" });
    setHeaders({});
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  const signup = (email: string) =>
    register(undefined, form({ email, username: "alice_01", password: "correct-horse-battery" }));

  it("with trust off, rotating x-forwarded-for does not reset the per-email sign-up limit", async () => {
    for (let i = 0; i < 30; i++) {
      setHeaders({ "x-forwarded-for": `198.51.100.${i + 1}` });
      expect(await signup("new@example.com")).toEqual({ error: "That email or username is already in use." });
    }
    setHeaders({ "x-forwarded-for": "198.51.100.250" });
    expect(await signup("new@example.com")).toMatchObject({ error: expect.stringContaining("Too many sign-up") });
  });

  it("with trust off, records only the normalised per-email key", async () => {
    setHeaders({ "x-forwarded-for": "203.0.113.7" });
    await signup(" New@Example.COM ");
    expect(store.attempts.map((a) => a.key)).toEqual(["register-email:new@example.com"]);
  });

  it("with trust on, a valid forwarded address adds a per-IP key", async () => {
    vi.stubEnv("TRUST_PROXY", "true");
    setHeaders({ "x-forwarded-for": "203.0.113.7" });
    await signup("new@example.com");
    expect(store.attempts.map((a) => a.key).sort()).toEqual(["register-email:new@example.com", "register-ip:203.0.113.7"]);
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  headers: vi.fn(),
  authAttemptCount: vi.fn(),
  authAttemptCreate: vi.fn(),
  authAttemptDeleteMany: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ headers: mocks.headers }));
vi.mock("@/lib/db", () => ({
  db: {
    authAttempt: {
      count: mocks.authAttemptCount,
      create: mocks.authAttemptCreate,
      deleteMany: mocks.authAttemptDeleteMany,
    },
  },
}));

import {
  anyBlocked,
  clientIpFromForwardedFor,
  proxyTrustEnabled,
  recordAll,
  trustedClientIp,
  trustedProxyHops,
} from "./rate-limit";

describe("proxyTrustEnabled (AUD-002)", () => {
  it("is off when TRUST_PROXY is unset", () => {
    expect(proxyTrustEnabled({})).toBe(false);
  });

  it("is on only for the exact string 'true'", () => {
    expect(proxyTrustEnabled({ TRUST_PROXY: "true" })).toBe(true);
    for (const v of ["1", "TRUE", "yes", " true", "false", ""]) {
      expect(proxyTrustEnabled({ TRUST_PROXY: v })).toBe(false);
    }
  });
});

describe("trustedProxyHops (AUD-002)", () => {
  it("defaults to 1 when unset or empty", () => {
    expect(trustedProxyHops({})).toBe(1);
    expect(trustedProxyHops({ TRUSTED_PROXY_HOPS: "" })).toBe(1);
  });

  it("accepts positive integers", () => {
    expect(trustedProxyHops({ TRUSTED_PROXY_HOPS: "2" })).toBe(2);
  });

  it("fails closed (null) for zero, negatives, decimals, words and oversized values", () => {
    for (const v of ["0", "-1", "1.5", "abc", "1000", " 2"]) {
      expect(trustedProxyHops({ TRUSTED_PROXY_HOPS: v })).toBeNull();
    }
  });
});

describe("clientIpFromForwardedFor (AUD-002)", () => {
  it("returns the only entry when one proxy overwrites the header", () => {
    expect(clientIpFromForwardedFor("203.0.113.7", 1)).toBe("203.0.113.7");
  });

  it("reads from the right, so a client-supplied left-hand entry is ignored", () => {
    expect(clientIpFromForwardedFor("9.9.9.9, 203.0.113.7", 1)).toBe("203.0.113.7");
  });

  it("counts the requested number of hops from the right", () => {
    expect(clientIpFromForwardedFor("9.9.9.9, 203.0.113.7, 10.0.0.1", 2)).toBe("203.0.113.7");
  });

  it("accepts IPv6 and normalises its case", () => {
    expect(clientIpFromForwardedFor("2001:DB8::1", 1)).toBe("2001:db8::1");
  });

  it("returns null when the header is absent or empty", () => {
    expect(clientIpFromForwardedFor(null, 1)).toBeNull();
    expect(clientIpFromForwardedFor(undefined, 1)).toBeNull();
    expect(clientIpFromForwardedFor("", 1)).toBeNull();
  });

  it("returns null when the hop count is invalid", () => {
    expect(clientIpFromForwardedFor("203.0.113.7", null)).toBeNull();
    expect(clientIpFromForwardedFor("203.0.113.7", 0)).toBeNull();
  });

  it("returns null when there are fewer entries than hops", () => {
    expect(clientIpFromForwardedFor("203.0.113.7", 2)).toBeNull();
  });

  it("returns null for malformed addresses (node:net isIP rejects them)", () => {
    for (const v of ["unknown", "not-an-ip", "999.1.1.1", "203.0.113.7:8080", "[::1]"]) {
      expect(clientIpFromForwardedFor(v, 1)).toBeNull();
    }
  });

  it("returns null when the selected entry is empty, e.g. a trailing comma", () => {
    expect(clientIpFromForwardedFor("203.0.113.7, ", 1)).toBeNull();
  });
});

describe("trustedClientIp (AUD-002)", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    delete process.env.TRUST_PROXY;
    delete process.env.TRUSTED_PROXY_HOPS;
    mocks.headers.mockReset();
    mocks.headers.mockResolvedValue(new Headers());
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("never reads headers when trust is off, so spoofed values are ignored", async () => {
    mocks.headers.mockResolvedValue(new Headers({ "x-forwarded-for": "203.0.113.7" }));
    expect(await trustedClientIp()).toBeNull();
    expect(mocks.headers).not.toHaveBeenCalled();
  });

  it("returns the validated address when trust is on", async () => {
    vi.stubEnv("TRUST_PROXY", "true");
    mocks.headers.mockResolvedValue(new Headers({ "x-forwarded-for": "198.51.100.9, 203.0.113.7" }));
    expect(await trustedClientIp()).toBe("203.0.113.7");
  });

  it("never falls back to X-Real-IP, even when trust is on", async () => {
    vi.stubEnv("TRUST_PROXY", "true");
    mocks.headers.mockResolvedValue(new Headers({ "x-real-ip": "203.0.113.7" }));
    expect(await trustedClientIp()).toBeNull();
  });

  it("returns null for a malformed header when trust is on", async () => {
    vi.stubEnv("TRUST_PROXY", "true");
    mocks.headers.mockResolvedValue(new Headers({ "x-forwarded-for": "unknown" }));
    expect(await trustedClientIp()).toBeNull();
  });

  it("honours TRUSTED_PROXY_HOPS when trust is on", async () => {
    vi.stubEnv("TRUST_PROXY", "true");
    vi.stubEnv("TRUSTED_PROXY_HOPS", "2");
    mocks.headers.mockResolvedValue(new Headers({ "x-forwarded-for": "9.9.9.9, 203.0.113.7, 10.0.0.1" }));
    expect(await trustedClientIp()).toBe("203.0.113.7");
  });
});

describe("anyBlocked and recordAll (AUD-002)", () => {
  beforeEach(() => {
    mocks.authAttemptCount.mockReset();
    mocks.authAttemptCreate.mockReset();
    mocks.authAttemptCreate.mockResolvedValue({});
    mocks.authAttemptDeleteMany.mockResolvedValue({ count: 0 });
  });

  it("is blocked when any one limit is exceeded", async () => {
    mocks.authAttemptCount.mockResolvedValueOnce(0).mockResolvedValueOnce(5);
    expect(
      await anyBlocked([
        { key: "a", max: 5, windowMs: 1000 },
        { key: "b", max: 5, windowMs: 1000 },
      ]),
    ).toBe(true);
  });

  it("is not blocked when every limit is below its maximum", async () => {
    mocks.authAttemptCount.mockResolvedValue(4);
    expect(await anyBlocked([{ key: "a", max: 5, windowMs: 1000 }])).toBe(false);
  });

  it("records one row per key", async () => {
    await recordAll(["x:1", "y:2"]);
    expect(mocks.authAttemptCreate).toHaveBeenCalledWith({ data: { key: "x:1" } });
    expect(mocks.authAttemptCreate).toHaveBeenCalledWith({ data: { key: "y:2" } });
    expect(mocks.authAttemptCreate).toHaveBeenCalledTimes(2);
  });
});

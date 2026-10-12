import "server-only";
import { isIP } from "node:net";
import { headers } from "next/headers";
import { db } from "@/lib/db";

export const HOUR = 3_600_000;
export type Limit = { key: string; max: number; windowMs: number };

/**
 * Environment shape for these helpers. Names the two variables they read. The index signature keeps the
 * type from being a "weak" all-optional type (which rejects process.env with TS2559) and lets tests pass
 * plain objects without NODE_ENV, which NodeJS.ProcessEnv requires under Next.js typings.
 */
export type RateLimitEnv = {
  readonly TRUST_PROXY?: string;
  readonly TRUSTED_PROXY_HOPS?: string;
  readonly [key: string]: string | undefined;
};

/** Proxy trust is OFF unless TRUST_PROXY is exactly "true". See README "Rate limits and proxies". */
export function proxyTrustEnabled(env: RateLimitEnv = process.env): boolean {
  return env.TRUST_PROXY === "true";
}

/**
 * Number of trusted proxies that append to X-Forwarded-For. Defaults to 1 when unset or empty.
 * Any other value returns null, and callers then get no trusted IP (fail closed).
 */
export function trustedProxyHops(env: RateLimitEnv = process.env): number | null {
  const raw = env.TRUSTED_PROXY_HOPS;
  if (raw === undefined || raw === "") return 1;
  if (!/^[1-9]\d{0,2}$/.test(raw)) return null;
  return Number(raw);
}

/**
 * Pure: picks the client address from an X-Forwarded-For value. Counts `hops` entries from the right,
 * because client-supplied entries sit on the left. Returns null when the header is absent, the hop count
 * is invalid, the entry is missing, or the entry is not a valid IPv4/IPv6 address (node:net isIP).
 */
export function clientIpFromForwardedFor(xff: string | null | undefined, hops: number | null): string | null {
  if (!xff || hops === null || hops < 1) return null;
  const parts = xff.split(",").map((p) => p.trim());
  const ip = parts[parts.length - hops];
  if (!ip || isIP(ip) === 0) return null;
  return ip.toLowerCase();
}

/**
 * Client IP for IP-keyed limits. Returns null unless proxy trust is enabled and the header yields a valid
 * address. When trust is off, headers are not read at all. X-Real-IP is never read.
 */
export async function trustedClientIp(env: RateLimitEnv = process.env): Promise<string | null> {
  if (!proxyTrustEnabled(env)) return null;
  const xff = (await headers()).get("x-forwarded-for");
  return clientIpFromForwardedFor(xff, trustedProxyHops(env));
}

/** True if any limit is currently exceeded. Stops at the first blocked key. */
export async function anyBlocked(limits: Limit[]): Promise<boolean> {
  for (const l of limits) if (await isBlocked(l.key, l.max, l.windowMs)) return true;
  return false;
}

export async function recordAll(keys: string[]) {
  for (const key of keys) await record(key);
}
export async function isBlocked(key: string, max: number, windowMs: number) {
  return (await db.authAttempt.count({ where: { key, createdAt: { gte: new Date(Date.now() - windowMs) } } })) >= max;
}
export async function record(key: string) {
  await db.authAttempt.create({ data: { key } });
  if (Math.random() < 0.02) await db.authAttempt.deleteMany({ where: { createdAt: { lt: new Date(Date.now() - 86_400_000) } } });
}

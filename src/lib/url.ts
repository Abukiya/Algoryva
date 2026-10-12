const HOSTS: Record<string, string> = {
  "leetcode.com": "leetcode", "codeforces.com": "codeforces", "hackerrank.com": "hackerrank",
  "atcoder.jp": "atcoder", "cses.fi": "cses",
};
export const PLATFORMS = Object.values(HOSTS);

export type NormalizedUrl = { ok: true; url: string; platform: string } | { ok: false; error: string };

/** Canonicalizes a problem URL so the same problem cannot be added twice under different spellings. */
export function normalizeProblemUrl(raw: string): NormalizedUrl {
  let u: URL;
  try { u = new URL(raw.trim()); } catch { return { ok: false, error: "Enter a valid URL." }; }
  if (u.protocol !== "https:") return { ok: false, error: "URL must start with https://." };
  const host = u.hostname.toLowerCase().replace(/^www\./, "");
  const platform = HOSTS[host];
  if (!platform) return { ok: false, error: `Supported sites: ${Object.keys(HOSTS).join(", ")}.` };
  const p = u.pathname.split("/").filter(Boolean);
  let path: string | null = null;
  if (platform === "leetcode" && p[0] === "problems" && p[1]) path = `/problems/${p[1].toLowerCase()}`;
  else if (platform === "codeforces") {
    if (p[0] === "problemset" && p[1] === "problem" && p[2] && p[3]) path = `/problemset/problem/${p[2]}/${p[3].toUpperCase()}`;
    else if ((p[0] === "contest" || p[0] === "gym") && p[2] === "problem" && p[3]) path = `/problemset/problem/${p[1]}/${p[3].toUpperCase()}`;
  } else if (platform === "hackerrank" && p[0] === "challenges" && p[1]) path = `/challenges/${p[1].toLowerCase()}/problem`;
  else if ((platform === "atcoder" || platform === "cses") && p.length >= 2) path = `/${p.join("/")}`;
  if (!path) return { ok: false, error: `That does not look like a ${platform} problem URL.` };
  return { ok: true, url: `https://${host}${path}`, platform };
}

export function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
}

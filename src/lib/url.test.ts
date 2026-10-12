import { describe, expect, it } from "vitest";
import { normalizeProblemUrl } from "./url";

describe("normalizeProblemUrl", () => {
  it("canonicalizes LeetCode variants to one URL", () => {
    const a = normalizeProblemUrl("https://leetcode.com/problems/two-sum/?envType=study-plan");
    const b = normalizeProblemUrl("https://www.leetcode.com/problems/two-sum/description");
    expect(a.ok && b.ok && a.url === b.url).toBe(true);
  });
  it("treats Codeforces contest and problemset URLs as the same problem", () => {
    const a = normalizeProblemUrl("https://codeforces.com/contest/664/problem/a");
    const b = normalizeProblemUrl("https://codeforces.com/problemset/problem/664/A");
    expect(a.ok && b.ok && a.url === b.url).toBe(true);
  });
  it("rejects http, unknown hosts and non-problem pages", () => {
    expect(normalizeProblemUrl("http://leetcode.com/problems/x").ok).toBe(false);
    expect(normalizeProblemUrl("https://example.com/problems/x").ok).toBe(false);
    expect(normalizeProblemUrl("https://leetcode.com/contest/").ok).toBe(false);
  });
});

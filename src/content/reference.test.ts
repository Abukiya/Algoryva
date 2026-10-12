import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import { ORIGINAL_PROBLEMS } from "./originalProblems";
import { HIDDEN_TESTS } from "./hiddenTests";

/** Problems whose reference solution lives in scripts/original_problem_tools.py. */
const WITH_REFERENCE = ["cheapest-route", "negative-cycle-check", "cable-network", "extra-cables", "knapsack-value", "coin-combinations", "longest-increasing-subsequence",
  "range-sum-updates", "inversion-count", "range-minimum-static", "range-spread", "range-min-update", "range-add-range-sum",
  "bit-count-total", "lonely-number", "subset-xor-count", "kmp-occurrences", "shortest-period", "prefix-count",
  "modular-inverse", "ncr-queries", "grid-paths-modulo", "coprime-count",
  "min-assignment", "shortest-tour", "digit-sum-count", "tree-independent-set", "no-adjacent-equal-digits",
  "orientation-test", "polygon-double-area", "hull-corners", "segment-touch", "interior-lattice-points",
  "range-sum-queries", "pair-with-target-sum", "first-position-at-least-x", "longest-window-under-budget", "balanced-brackets", "count-islands", "stair-ways"];
const py = spawnSync("python3", ["--version"]).status === 0;

function solve(slug: string, input: string): string {
  const r = spawnSync("python3", ["scripts/original_problem_tools.py", "solve", slug], { input: input + "\n", encoding: "utf8", timeout: 20_000 });
  expect(r.status, r.stderr).toBe(0);
  return r.stdout.trim();
}

describe.skipIf(!py)("reference solutions reproduce every sample and hidden test", () => {
  for (const slug of WITH_REFERENCE) {
    it(slug, () => {
      const p = ORIGINAL_PROBLEMS.find((x) => x.slug === slug)!;
      expect(p, `${slug} is not in ORIGINAL_PROBLEMS`).toBeTruthy();
      for (const s of p.samples) expect(solve(slug, s.input), `sample ${JSON.stringify(s.input)}`).toBe(s.output.trim());
      const hidden = HIDDEN_TESTS[slug] ?? [];
      expect(hidden.length).toBeGreaterThanOrEqual(5);
      for (const t of hidden) expect(solve(slug, t.input), `hidden ${JSON.stringify(t.input)}`).toBe(t.expected.trim());
    });
  }
});

import { describe, expect, it } from "vitest";
import { computeStreak } from "./streak";

const d = (s: string) => new Date(`${s}T12:00:00Z`);
describe("computeStreak", () => {
  it("counts consecutive days ending today", () => {
    expect(computeStreak([d("2026-01-01"), d("2026-01-02"), d("2026-01-03")], d("2026-01-03")).current).toBe(3);
  });
  it("keeps the streak alive if the last activity was yesterday", () => {
    expect(computeStreak([d("2026-01-01"), d("2026-01-02")], d("2026-01-03")).current).toBe(2);
  });
  it("resets after a missed day and tracks the longest run", () => {
    const r = computeStreak([d("2026-01-01"), d("2026-01-02"), d("2026-01-03"), d("2026-01-06")], d("2026-01-06"));
    expect(r).toEqual({ current: 1, longest: 3 });
    expect(computeStreak([d("2026-01-01")], d("2026-01-05")).current).toBe(0);
  });
  it("ignores multiple events in one day", () => {
    expect(computeStreak([d("2026-01-01"), d("2026-01-01")], d("2026-01-01")).current).toBe(1);
  });
});

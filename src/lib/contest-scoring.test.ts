import { describe, expect, it } from "vitest";
import { isRunning, rank, scoreEntry } from "./contest-scoring";

const t = (m: number) => new Date(Date.UTC(2026, 0, 1, 0, m));
describe("contest scoring", () => {
  it("sums penalty minutes", () => expect(scoreEntry(t(0), [{ solvedAt: t(10) }, { solvedAt: t(25) }])).toEqual({ solved: 2, penaltyMin: 35 }));
  it("ranks by solved then penalty", () => {
    const r = rank([{ name: "b", solved: 1, penaltyMin: 5 }, { name: "a", solved: 2, penaltyMin: 90 }, { name: "c", solved: 1, penaltyMin: 3 }]);
    expect(r.map((x) => x.name)).toEqual(["a", "c", "b"]);
  });
  it("knows when a contest window closes", () => {
    expect(isRunning(t(0), 60, t(59))).toBe(true);
    expect(isRunning(t(0), 60, t(60))).toBe(false);
  });
});

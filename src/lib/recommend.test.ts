import { describe, expect, it } from "vitest";
import { nextTopics, unlockState } from "./recommend";

describe("recommend", () => {
  it("starts a new learner at python-basics", () => {
    expect(nextTopics(new Set())[0].slug).toBe("python-basics");
  });
  it("explains why a topic is locked", () => {
    const s = unlockState("prefix-sum", new Set());
    expect(s.unlocked).toBe(false);
    expect(s.missing).toContain("Arrays, Lists & Matrices");
  });
  it("never recommends coming-soon topics", () => {
    const all = new Set(["python-basics"]);
    expect(nextTopics(all, 100).every((t) => t.status === "PUBLISHED")).toBe(true);
  });
});

import { nextReviewDate } from "./recommend";
describe("review ladder", () => {
  const d = new Date("2026-01-01T00:00:00Z");
  it("uses 1, 3, 7, 14, 30 day steps and caps at 30", () => {
    expect(nextReviewDate(d, 0).toISOString()).toBe("2026-01-02T00:00:00.000Z");
    expect(nextReviewDate(d, 4).toISOString()).toBe("2026-01-31T00:00:00.000Z");
    expect(nextReviewDate(d, 99).toISOString()).toBe("2026-01-31T00:00:00.000Z");
  });
});

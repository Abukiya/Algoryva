import { describe, expect, it } from "vitest";
import { INTRO_STEPS, stepAfter } from "./intro";

describe("intro", () => {
  it("stays short: five steps, each with a title and a short body", () => {
    expect(INTRO_STEPS.length).toBe(5);
    for (const s of INTRO_STEPS) {
      expect(s.title.length).toBeGreaterThan(0);
      expect(s.body.split(" ").length).toBeLessThan(40);
    }
  });

  it("moves between steps and never leaves the range", () => {
    expect(stepAfter(0, -1)).toBe(0);
    expect(stepAfter(0, 1)).toBe(1);
    expect(stepAfter(INTRO_STEPS.length - 1, 1)).toBe(INTRO_STEPS.length - 1);
    expect(stepAfter(2, 1, 5)).toBe(3);
  });
});

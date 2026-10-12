import { describe, expect, it } from "vitest";
import { masteryOf, passMark, practiceTarget } from "./mastery";

const base = { completed: false, quizPassed: false, solved: 0, available: 5, reviewStep: 0 };
describe("mastery", () => {
  it("opening or even completing a lesson is not mastery", () => {
    expect(masteryOf(base).stage).toBe("new");
    expect(masteryOf({ ...base, completed: true }).stage).toBe("completed");
    expect(masteryOf({ ...base, completed: true }).percent).toBeLessThan(50);
  });
  it("practised needs the quiz and enough solved problems", () => {
    expect(masteryOf({ ...base, completed: true, quizPassed: true, solved: 2 }).stage).toBe("completed");
    expect(masteryOf({ ...base, completed: true, quizPassed: true, solved: 3 }).stage).toBe("practised");
  });
  it("mastered additionally needs a successful review", () => {
    const m = masteryOf({ ...base, completed: true, quizPassed: true, solved: 3, reviewStep: 1 });
    expect(m.stage).toBe("mastered");
    expect(m.percent).toBe(100);
  });
  it("topics with no practice problems can still be mastered", () => {
    const m = masteryOf({ completed: true, quizPassed: true, solved: 0, available: 0, reviewStep: 1 });
    expect(m.stage).toBe("mastered");
    expect(m.percent).toBe(100);
  });
  it("practice target is capped at three and never exceeds what exists", () => {
    expect(practiceTarget(10)).toBe(3);
    expect(practiceTarget(2)).toBe(2);
    expect(practiceTarget(0)).toBe(1);
  });
  it("pass mark is 80% rounded up", () => {
    expect(passMark(5)).toBe(4);
    expect(passMark(6)).toBe(5);
    expect(passMark(4)).toBe(4);
  });
  it("next step always points somewhere useful", () => {
    expect(masteryOf(base).next).toMatch(/lesson/);
    expect(masteryOf({ ...base, completed: true }).next).toMatch(/mastery check/);
    expect(masteryOf({ ...base, completed: true, quizPassed: true, solved: 1 }).next).toMatch(/2 more/);
  });
});

import { describe, expect, it } from "vitest";
import { computeXp, earnedBadges, levelFor, type Stats } from "./gamification";

const zero: Stats = { topics: 0, solvedEasy: 0, solvedMedium: 0, solvedHard: 0, reviews: 0, longestStreak: 0, mistakes: 0, notes: 0 };
describe("gamification", () => {
  it("weights XP by activity", () => expect(computeXp({ ...zero, topics: 2, solvedEasy: 1, solvedHard: 1, reviews: 2 })).toBe(100 + 10 + 50 + 10));
  it("levels grow with XP", () => {
    expect(levelFor(0).level).toBe(1);
    expect(levelFor(50).level).toBe(2);
    expect(levelFor(200).level).toBe(3);
  });
  it("awards badges from stats", () => {
    expect(earnedBadges(zero)).toEqual([]);
    expect(earnedBadges({ ...zero, topics: 1, longestStreak: 7 }).map((b) => b.id)).toEqual(["first-topic", "week-streak"]);
  });
});

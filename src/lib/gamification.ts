export type Stats = { topics: number; solvedEasy: number; solvedMedium: number; solvedHard: number; reviews: number; longestStreak: number; mistakes: number; notes: number };

export const computeXp = (s: Stats) => s.topics * 50 + s.solvedEasy * 10 + s.solvedMedium * 25 + s.solvedHard * 50 + s.reviews * 5;

export function levelFor(xp: number) {
  const level = Math.floor(Math.sqrt(xp / 50)) + 1;
  const floor = (level - 1) ** 2 * 50, ceil = level ** 2 * 50;
  return { level, xp, into: xp - floor, needed: ceil - floor };
}

const solved = (s: Stats) => s.solvedEasy + s.solvedMedium + s.solvedHard;
export const BADGES: { id: string; name: string; description: string; earned: (s: Stats) => boolean }[] = [
  { id: "first-topic", name: "First Topic", description: "Complete a topic", earned: (s) => s.topics >= 1 },
  { id: "first-solve", name: "First Solve", description: "Mark a problem solved", earned: (s) => solved(s) >= 1 },
  { id: "ten-solves", name: "Ten Solves", description: "Solve 10 problems", earned: (s) => solved(s) >= 10 },
  { id: "hard-solve", name: "Hard Problem", description: "Solve a hard problem", earned: (s) => s.solvedHard >= 1 },
  { id: "week-streak", name: "7-Day Streak", description: "Be active 7 days in a row", earned: (s) => s.longestStreak >= 7 },
  { id: "ten-topics", name: "Ten Topics", description: "Complete 10 topics", earned: (s) => s.topics >= 10 },
  { id: "reviewer", name: "Reviewer", description: "Complete 5 reviews", earned: (s) => s.reviews >= 5 },
  { id: "reflective", name: "Reflective", description: "Log 5 mistakes", earned: (s) => s.mistakes >= 5 },
];
export const earnedBadges = (s: Stats) => BADGES.filter((b) => b.earned(s));

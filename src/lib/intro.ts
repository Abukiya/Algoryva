/** The short first-visit intro. Kept in one place so the dialog and its tests read the same steps. */
export const INTRO_SEEN_KEY = "intro-seen";

export const INTRO_STEPS = [
  { title: "Welcome to Algoryva", body: "Learn algorithms in order, practise them, and track what you know. This takes about thirty seconds." },
  { title: "Learn in order", body: "Each topic lists what it builds on. Full lessons have visuals and a mastery check. The Roadmap shows the whole tree." },
  { title: "Practise and tick off", body: "Original problems are judged here. External problems open on LeetCode in a new tab. Solve them there, come back, and tick the box." },
  { title: "Track and review", body: "Today shows what is next and what is due for review. Log mistakes and notes as you go, and the Visualizer steps through algorithms." },
  { title: "Your controls", body: "Press / to search. Collapse the sidebar for more room, and switch dark mode whenever you like." },
] as const;

/** The step index after moving by `delta`, kept inside the steps. */
export function stepAfter(index: number, delta: number, count: number = INTRO_STEPS.length): number {
  return Math.min(Math.max(index + delta, 0), count - 1);
}

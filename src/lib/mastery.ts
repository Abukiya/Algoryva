/**
 * Mastery is deliberately not "opened the page". It combines four signals, none of which blocks progress:
 *   completed  - the learner marked the topic complete (server-enforced prerequisites still apply)
 *   quiz       - passed the lesson's mastery check (>= 80%)
 *   practice   - distinct topic problems solved
 *   review     - at least one spaced review rated "good" (ReviewItem.step >= 1)
 */
export type MasteryInput = { completed: boolean; quizPassed: boolean; solved: number; available: number; reviewStep: number };
export type MasteryStage = "new" | "completed" | "practised" | "mastered";
export type Mastery = { stage: MasteryStage; percent: number; next: string; signals: { label: string; done: boolean; detail?: string }[] };

export const PASS_RATIO = 0.8;
export const passMark = (total: number) => Math.ceil(total * PASS_RATIO);

/** How many solved problems count as enough practice: three, or all of them when fewer exist. */
export const practiceTarget = (available: number) => Math.max(1, Math.min(3, available));

export function masteryOf(m: MasteryInput): Mastery {
  const target = practiceTarget(m.available);
  const practiceDone = m.available > 0 && m.solved >= target;
  const reviewed = m.reviewStep >= 1;
  const signals = [
    { label: "Completed the lesson", done: m.completed },
    { label: "Passed the mastery check", done: m.quizPassed },
    { label: m.available > 0 ? `Solved ${target} practice problem${target === 1 ? "" : "s"}` : "Practice problems", done: practiceDone, detail: m.available > 0 ? `${Math.min(m.solved, target)} of ${target}` : "none published yet" },
    { label: "Recalled it in a spaced review", done: reviewed },
  ];
  // Topics without practice problems cannot require practice, so the weight moves to the other signals.
  const weights = m.available > 0 ? [25, 25, 30, 20] : [35, 40, 0, 25];
  const percent = signals.reduce((n, s, i) => n + (s.done ? weights[i] : 0), 0);
  let stage: MasteryStage = "new";
  if (m.completed) stage = "completed";
  if (m.completed && m.quizPassed && (practiceDone || m.available === 0)) stage = "practised";
  if (stage === "practised" && reviewed) stage = "mastered";
  const next = !m.completed ? "Finish the lesson and mark it complete."
    : !m.quizPassed ? "Take the mastery check at the end of the lesson."
    : !practiceDone && m.available > 0 ? `Solve ${target - m.solved} more practice problem${target - m.solved === 1 ? "" : "s"}.`
    : !reviewed ? "Come back for your scheduled review and recall it from memory."
    : "Mastered. Keep it fresh with reviews.";
  return { stage, percent, next, signals };
}

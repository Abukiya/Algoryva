/** The lesson funnel: how far learners get through each topic, and how the quizzes go. Pure, so it can be tested and exported. */
export type FunnelTopic = { id: string; slug: string; title: string };
export type FunnelRow = {
  slug: string; title: string;
  started: number; completed: number; completionPct: number;
  quizTakers: number; quizPassed: number; passRatePct: number; attempts: number;
};

const pct = (part: number, whole: number) => (whole > 0 ? Math.round((part / whole) * 100) : 0);

export function buildFunnel(
  topics: FunnelTopic[],
  started: Map<string, number>, completed: Map<string, number>,
  quizTakers: Map<string, number>, quizPassed: Map<string, number>, attempts: Map<string, number>,
): FunnelRow[] {
  return topics.map((t) => {
    const s = started.get(t.id) ?? 0;
    const c = completed.get(t.id) ?? 0;
    const q = quizTakers.get(t.id) ?? 0;
    const p = quizPassed.get(t.id) ?? 0;
    return {
      slug: t.slug, title: t.title,
      started: s, completed: c, completionPct: pct(c, s),
      quizTakers: q, quizPassed: p, passRatePct: pct(p, q),
      attempts: attempts.get(t.id) ?? 0,
    };
  });
}

/** One CSV cell. Values that start with = + - @ are prefixed so spreadsheets do not run them as formulas. */
export function csvCell(v: string | number): string {
  let s = String(v);
  if (/^[=+\-@]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function funnelCsv(rows: FunnelRow[]): string {
  const header = ["topic", "started", "completed", "completion_pct", "quiz_takers", "quiz_passed", "pass_rate_pct", "attempts"];
  const lines = rows.map((r) => [r.title, r.started, r.completed, r.completionPct, r.quizTakers, r.quizPassed, r.passRatePct, r.attempts].map(csvCell).join(","));
  return [header.join(","), ...lines].join("\n") + "\n";
}

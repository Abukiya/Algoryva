export const MISTAKE_TYPES = ["CONCEPTUAL", "IMPLEMENTATION", "COMPLEXITY", "EDGE_CASE", "MISREAD", "DEBUGGING", "TIME_MANAGEMENT"] as const;
export const REASONS = ["COULD_NOT_SOLVE", "SOLVED_AFTER_EDITORIAL", "SOLVED_AFTER_HINT", "IMPLEMENTATION_ERROR", "MISUNDERSTOOD", "RAN_OUT_OF_TIME"] as const;
export type MistakeType = (typeof MISTAKE_TYPES)[number];
export type Reason = (typeof REASONS)[number];
export type MistakeInput = { type: MistakeType; reason: Reason | null; problemId: string | null; outsideTitle: string | null; outsideUrl: string | null; misunderstood: string; correctIdea: string; recognizeNextTime: string };
export type MistakeResult = { ok: true; value: MistakeInput } | { ok: false; error: string };

const s = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
export function parseMistake(f: FormData): MistakeResult {
  const type = MISTAKE_TYPES.find((t) => t === s(f, "type"));
  if (!type) return { ok: false, error: "Choose a mistake type." };
  const reasonRaw = s(f, "reason");
  const reason = reasonRaw ? REASONS.find((r) => r === reasonRaw) : null;
  if (reasonRaw && !reason) return { ok: false, error: "Unknown reason." };
  const fields = { misunderstood: s(f, "misunderstood"), correctIdea: s(f, "correctIdea"), recognizeNextTime: s(f, "recognizeNextTime") };
  for (const v of Object.values(fields)) if (v.length < 3 || v.length > 2000) return { ok: false, error: "Each text field needs 3-2000 characters." };
  const problemId = s(f, "problemId") || null;
  const outsideTitle = s(f, "outsideTitle");
  const outsideRaw = s(f, "outsideUrl");
  if (problemId && outsideTitle) return { ok: false, error: "Pick a problem from the list or type one outside the site, not both." };
  if (outsideTitle && (outsideTitle.length < 2 || outsideTitle.length > 120)) return { ok: false, error: "The outside problem's title needs 2-120 characters." };
  if (!outsideTitle && outsideRaw) return { ok: false, error: "Add a title for the outside problem, or leave the link empty." };
  let outsideUrl: string | null = null;
  if (outsideRaw) {
    if (outsideRaw.length > 300) return { ok: false, error: "The link is too long (300 characters at most)." };
    let u: URL;
    try { u = new URL(outsideRaw); } catch { return { ok: false, error: "Enter a valid link, starting with https://." }; }
    if (u.protocol !== "https:") return { ok: false, error: "The link must start with https://." };
    outsideUrl = u.toString();
  }
  return { ok: true, value: { type, reason: reason ?? null, problemId, outsideTitle: outsideTitle || null, outsideUrl, ...fields } };
}

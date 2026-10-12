import { bySlug } from "@/lib/curriculum";
import { normalizeProblemUrl } from "@/lib/url";

export type ProblemInput = {
  id?: string; kind: "INTERNAL" | "EXTERNAL"; title: string; difficulty: "EASY" | "MEDIUM" | "HARD" | "EXPERT";
  status: "DRAFT" | "PUBLISHED"; position: number; topics: string[];
  external?: { url: string; platform: string };
  internal?: { statement: string; inputSpec: string; outputSpec: string; constraints: string; sampleInput: string; sampleOutput: string };
};
export type ParseResult = { ok: true; value: ProblemInput } | { ok: false; error: string };

const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const DIFFS = ["EASY", "MEDIUM", "HARD", "EXPERT"] as const;

export function parseProblem(f: FormData): ParseResult {
  const kind = str(f, "kind");
  if (kind !== "INTERNAL" && kind !== "EXTERNAL") return { ok: false, error: "Choose a problem type." };
  const title = str(f, "title");
  if (title.length < 3 || title.length > 120) return { ok: false, error: "Title must be 3-120 characters." };
  const difficulty = DIFFS.find((d) => d === str(f, "difficulty"));
  if (!difficulty) return { ok: false, error: "Choose a difficulty." };
  const status = str(f, "status") === "PUBLISHED" ? "PUBLISHED" : "DRAFT";
  const position = Number.parseInt(str(f, "position") || "0", 10);
  if (!Number.isInteger(position) || position < 0 || position > 9999) return { ok: false, error: "Position must be 0-9999." };
  const topics = [...new Set(f.getAll("topics").map(String))];
  if (topics.length < 1 || topics.length > 6) return { ok: false, error: "Choose 1-6 topics." };
  if (topics.some((t) => !bySlug.has(t))) return { ok: false, error: "Unknown topic." };
  const id = str(f, "id") || undefined;
  const base = { id, kind, title, difficulty, status, position, topics } as const;

  if (kind === "EXTERNAL") {
    const n = normalizeProblemUrl(str(f, "externalUrl"));
    if (!n.ok) return { ok: false, error: n.error };
    return { ok: true, value: { ...base, external: { url: n.url, platform: n.platform } } };
  }
  const statement = str(f, "statement");
  if (statement.length < 20 || statement.length > 20000) return { ok: false, error: "Statement must be 20-20000 characters." };
  const opt = (k: string) => { const v = str(f, k); return v.length > 5000 ? null : v; };
  const inputSpec = opt("inputSpec"), outputSpec = opt("outputSpec"), constraints = opt("constraints"), sampleInput = opt("sampleInput"), sampleOutput = opt("sampleOutput");
  if (inputSpec === null || outputSpec === null || constraints === null || sampleInput === null || sampleOutput === null) return { ok: false, error: "A field is too long (max 5000 characters)." };
  if (Boolean(sampleInput) !== Boolean(sampleOutput)) return { ok: false, error: "Provide both sample input and sample output, or neither." };
  return { ok: true, value: { ...base, internal: { statement, inputSpec, outputSpec, constraints, sampleInput, sampleOutput } } };
}

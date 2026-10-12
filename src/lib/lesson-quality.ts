import type { LessonV2, Section } from "@/content/lesson-types";
import { REQUIRED_KINDS } from "@/content/lesson-types";

/** Returns human-readable problems; an empty array means the lesson meets the published standard. */
export function lessonProblems(l: LessonV2, opts: { needsNaive?: boolean; vizIds?: ReadonlySet<string> } = {}): string[] {
  const out: string[] = [];
  const kinds = new Set<Section["kind"]>(l.sections.map((s) => s.kind));
  for (const k of REQUIRED_KINDS) if (!kinds.has(k)) out.push(`missing section kind: ${k}`);
  if (opts.needsNaive && !kinds.has("naive")) out.push("technique lessons must show the naive approach (kind: naive)");
  if (l.objectives.length < 3) out.push("needs at least 3 learning objectives");
  if (l.hook.trim().length < 20) out.push("hook (why this exists) is too short");
  if (l.checks.length < 4) out.push("needs at least 4 mastery questions");
  if (l.summary.length < 3) out.push("needs at least 3 summary lines");
  if (l.cheatSheet.length < 2) out.push("needs a cheat sheet");
  const ids = new Set<string>();
  for (const s of l.sections) {
    if (ids.has(s.id)) out.push(`duplicate section id: ${s.id}`);
    ids.add(s.id);
    if (s.kind === "viz" && opts.vizIds && !opts.vizIds.has(s.viz)) out.push(`unknown visualization: ${s.viz}`);
    if (s.kind === "code" && s.walkthrough.length < 2) out.push(`code section ${s.id} needs a walkthrough`);
    if (s.kind === "recognize" && s.signals.length < 3) out.push(`recognize section ${s.id} needs at least 3 signals`);
  }
  l.checks.forEach((c, i) => {
    if (c.options.length < 2 || c.answer < 0 || c.answer >= c.options.length) out.push(`check ${i + 1} has an invalid answer index`);
    if (c.why.trim().length < 10) out.push(`check ${i + 1} needs an explanation`);
  });
  const words = JSON.stringify(l.sections).split(/\s+/).length;
  if (words < 700) out.push(`only about ${words} words: too thin for a complete lesson`);
  return out;
}

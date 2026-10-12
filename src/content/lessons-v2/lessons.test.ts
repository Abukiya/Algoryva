import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import { LESSONS_V2, TECHNIQUE_TOPICS } from "./index";
import { lessonProblems } from "@/lib/lesson-quality";
import { VIZ_IDS } from "@/lib/viz";
import { bySlug, TOPICS } from "@/lib/curriculum";
import type { LessonV2 } from "../lesson-types";

const all = Object.values(LESSONS_V2);
const py = spawnSync("python3", ["--version"]).status === 0;

/** Every runnable snippet in a lesson, in page order. */
function snippets(l: LessonV2): { where: string; code: string }[] {
  const out: { where: string; code: string }[] = [];
  for (const s of l.sections) {
    if (s.kind === "code" || s.kind === "worked") out.push({ where: s.id, code: s.code });
    if (s.kind === "naive" && s.code) out.push({ where: s.id, code: s.code });
  }
  return out;
}

describe("lesson content", () => {
  it("has at least one complete lesson", () => expect(all.length).toBeGreaterThan(0));
  it("every PUBLISHED topic has a complete lesson, so no hollow topic is ever shown as ready", () => {
    const missing = TOPICS.filter((t) => t.status === "PUBLISHED" && !LESSONS_V2[t.slug]).map((t) => t.slug);
    expect(missing).toEqual([]);
  });
  for (const l of all) {
    describe(l.topic, () => {
      it("is attached to a real, published topic", () => {
        expect(bySlug.get(l.topic)?.status).toBe("PUBLISHED");
      });
      it("meets the lesson quality standard", () => {
        expect(lessonProblems(l, { needsNaive: TECHNIQUE_TOPICS.has(l.topic), vizIds: VIZ_IDS })).toEqual([]);
      });
      it.skipIf(!py)("has Python that runs and prints what its `# expected` comments claim", () => {
        for (const { where, code } of snippets(l)) {
          const r = spawnSync("python3", ["-c", code], { encoding: "utf8", timeout: 10_000 });
          expect(r.status, `${l.topic}/${where}: ${r.stderr}`).toBe(0);
          // Lines shaped `print(...)   # value` promise an output; compare them in order.
          const promised = code.split("\n").flatMap((ln) => { const m = /^\s*print\(.*\)\s+#\s*(.+)$/.exec(ln); return m ? [m[1].trim()] : []; });
          const printed = r.stdout.trim().split("\n").map((x) => x.trim()).filter(Boolean);
          promised.forEach((p, i) => expect(printed[i], `${l.topic}/${where} line ${i + 1}`).toBe(p));
        }
      });
    });
  }
});

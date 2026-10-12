import { describe, expect, it } from "vitest";
import { buildFunnel, csvCell, funnelCsv } from "./funnel";
import { outlineStats } from "./lesson-stats";

describe("lesson funnel", () => {
  const rows = buildFunnel(
    [{ id: "t1", slug: "arrays", title: "Arrays" }, { id: "t2", slug: "graphs", title: "Graphs" }],
    new Map([["t1", 10], ["t2", 0]]), new Map([["t1", 4]]),
    new Map([["t1", 3]]), new Map([["t1", 2]]), new Map([["t1", 5]]),
  );
  it("computes completion and pass rates, and gives zero when there is no base", () => {
    expect(rows[0]).toMatchObject({ started: 10, completed: 4, completionPct: 40, quizTakers: 3, quizPassed: 2, passRatePct: 67, attempts: 5 });
    expect(rows[1]).toMatchObject({ completionPct: 0, passRatePct: 0 });
  });
  it("escapes CSV cells and blocks spreadsheet formulas", () => {
    expect(csvCell("a,b")).toBe('"a,b"');
    expect(csvCell('say "hi"')).toBe('"say ""hi"""');
    expect(csvCell("=HYPERLINK(1)")).toBe("'=HYPERLINK(1)");
  });
  it("writes a header and one line per topic", () => {
    const lines = funnelCsv(rows).trim().split("\n");
    expect(lines[0]).toBe("topic,started,completed,completion_pct,quiz_takers,quiz_passed,pass_rate_pct,attempts");
    expect(lines.length).toBe(3);
  });
});

describe("lesson outline stats", () => {
  it("counts sections, words outside code, reading time and code blocks", () => {
    const md = "## Idea\nOne two three.\n```py\nprint('ignored words here')\n```\n## Example\nFour five.";
    const s = outlineStats(md);
    expect(s.sections).toBe(2);
    expect(s.headings).toEqual(["Idea", "Example"]);
    // Outside the code block: "## Idea One two three. ## Example Four five." is nine whitespace-separated tokens.
    expect(s.words).toBe(9);
    expect(s.codeBlocks).toBe(1);
    expect(s.minutes).toBeGreaterThanOrEqual(1);
  });
});

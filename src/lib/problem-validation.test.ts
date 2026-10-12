import { describe, expect, it } from "vitest";
import { parseProblem } from "./problem-validation";

const form = (o: Record<string, string | string[]>) => { const f = new FormData(); for (const [k, v] of Object.entries(o)) (Array.isArray(v) ? v : [v]).forEach((x) => f.append(k, x)); return f; };
const ext = { kind: "EXTERNAL", title: "Two Sum", difficulty: "EASY", status: "DRAFT", topics: ["arrays"], externalUrl: "https://leetcode.com/problems/two-sum/?x=1" };

describe("parseProblem", () => {
  it("normalizes external URLs and derives the platform", () => {
    const r = parseProblem(form(ext));
    expect(r.ok && r.value.external).toEqual({ url: "https://leetcode.com/problems/two-sum", platform: "leetcode" });
  });
  it("rejects unknown topics, bad URLs and half-filled samples", () => {
    expect(parseProblem(form({ ...ext, topics: ["nope"] })).ok).toBe(false);
    expect(parseProblem(form({ ...ext, externalUrl: "https://evil.example/x" })).ok).toBe(false);
    const internal = { kind: "INTERNAL", title: "Sum It", difficulty: "EASY", status: "DRAFT", topics: ["arrays"], statement: "Add the numbers together and print the sum.", sampleInput: "1 2" };
    expect(parseProblem(form(internal)).ok).toBe(false);
  });
});

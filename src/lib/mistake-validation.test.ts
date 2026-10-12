import { describe, expect, it } from "vitest";
import { parseMistake } from "./mistake-validation";

const form = (o: Record<string, string>) => { const f = new FormData(); Object.entries(o).forEach(([k, v]) => f.set(k, v)); return f; };
const ok = { type: "EDGE_CASE", misunderstood: "empty array", correctIdea: "check length first", recognizeNextTime: "n can be 1" };
describe("parseMistake", () => {
  it("accepts a complete entry and treats reason as optional", () => {
    const r = parseMistake(form(ok));
    expect(r.ok && r.value.reason).toBe(null);
  });
  it("rejects bad types, unknown reasons and empty fields", () => {
    expect(parseMistake(form({ ...ok, type: "NOPE" })).ok).toBe(false);
    expect(parseMistake(form({ ...ok, reason: "NOPE" })).ok).toBe(false);
    expect(parseMistake(form({ ...ok, correctIdea: "" })).ok).toBe(false);
  });
  it("accepts a problem from outside the site, with an optional https link", () => {
    const r = parseMistake(form({ ...ok, outsideTitle: "Two Sum", outsideUrl: "https://leetcode.com/problems/two-sum" }));
    expect(r.ok && r.value.outsideTitle).toBe("Two Sum");
    expect(r.ok && r.value.outsideUrl).toBe("https://leetcode.com/problems/two-sum");
    expect(r.ok && r.value.problemId).toBe(null);
  });
  it("accepts an outside title without a link", () => {
    const r = parseMistake(form({ ...ok, outsideTitle: "Two Sum" }));
    expect(r.ok && r.value.outsideUrl).toBe(null);
  });
  it("rejects choosing both a site problem and an outside one", () => {
    expect(parseMistake(form({ ...ok, problemId: "p1", outsideTitle: "Two Sum" })).ok).toBe(false);
  });
  it("rejects a link without a title, a non-https link, and a link that is not a URL", () => {
    expect(parseMistake(form({ ...ok, outsideUrl: "https://leetcode.com/problems/two-sum" })).ok).toBe(false);
    expect(parseMistake(form({ ...ok, outsideTitle: "Two Sum", outsideUrl: "http://leetcode.com/problems/two-sum" })).ok).toBe(false);
    expect(parseMistake(form({ ...ok, outsideTitle: "Two Sum", outsideUrl: "leetcode two sum" })).ok).toBe(false);
  });
  it("rejects an outside title that is too short or too long", () => {
    expect(parseMistake(form({ ...ok, outsideTitle: "A" })).ok).toBe(false);
    expect(parseMistake(form({ ...ok, outsideTitle: "x".repeat(121) })).ok).toBe(false);
  });
});

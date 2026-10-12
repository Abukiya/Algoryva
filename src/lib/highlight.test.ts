import { describe, expect, it } from "vitest";
import { tokenize } from "./highlight";

describe("tokenize", () => {
  const src = 'def build(a):\n    p = [0]  # prefix\n    for x in a:\n        p.append(p[-1] + x)\n    return "ok", 3.5\n';
  it("re-joins to the exact source", () => expect(tokenize(src).map((t) => t.v).join("")).toBe(src));
  it("classifies keywords, strings, numbers, comments and calls", () => {
    const by = (t: string) => tokenize(src).filter((x) => x.t === t).map((x) => x.v);
    expect(by("kw")).toEqual(expect.arrayContaining(["def", "for", "in", "return"]));
    expect(by("str")).toEqual(['"ok"']);
    expect(by("num")).toEqual(expect.arrayContaining(["0", "1", "3.5"]));
    expect(by("com")).toEqual(["# prefix"]);
    expect(by("fn")).toEqual(expect.arrayContaining(["build", "append"]));
  });
  it("does not treat words inside strings as keywords", () => {
    expect(tokenize('x = "for in if"').filter((t) => t.t === "kw")).toHaveLength(0);
  });
});

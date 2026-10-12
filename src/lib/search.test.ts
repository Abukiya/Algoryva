import { describe, expect, it } from "vitest";
import { normalizeQuery, searchLessons, searchTopics } from "./search";

describe("search", () => {
  it("normalizes whitespace and case", () => expect(normalizeQuery("  Binary   SEARCH ")).toBe("binary search"));
  it("finds topics by title or slug words", () => {
    expect(searchTopics("binary search").map((t) => t.slug)).toContain("binary-search");
    expect(searchTopics("union").map((t) => t.slug)).toContain("union-find");
  });
  it("ignores queries that are too short", () => {
    expect(searchTopics("a")).toEqual([]);
    expect(searchLessons("")).toEqual([]);
  });
  it("finds lessons by their text", () => {
    expect(searchLessons("lower bound").map((h) => h.slug)).toContain("binary-search");
  });
  it("finds concepts inside complete lessons and links to the section", () => {
    const h = searchLessons("difference array").find((x) => x.slug === "prefix-sum");
    expect(h?.complete).toBe(true);
    expect(h?.anchor).toBeTruthy();
  });
  it("finds recognition signals", () => {
    expect(searchLessons("minimise the maximum").map((x) => x.slug)).toContain("binary-search");
  });
});

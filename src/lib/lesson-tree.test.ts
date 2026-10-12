import { describe, expect, it } from "vitest";
import { TOPICS, type TopicDef } from "./curriculum";
import { lessonTree } from "./lesson-tree";
import type { TopicState } from "./topic-state";

const topic = (slug: string, level: TopicDef["level"], status: TopicDef["status"] = "PUBLISHED"): TopicDef => ({ slug, title: slug.toUpperCase(), level, prereqs: [], status });

describe("lessonTree", () => {
  it("includes every topic in the curriculum exactly once, so it always matches the latest lessons", () => {
    const slugs = lessonTree().flatMap((g) => g.items.map((i) => i.slug));
    expect(slugs.length).toBe(TOPICS.length);
    expect(new Set(slugs).size).toBe(TOPICS.length);
    expect([...slugs].sort()).toEqual(TOPICS.map((t) => t.slug).sort());
  });

  it("keeps curriculum order inside each level and drops empty levels", () => {
    for (const g of lessonTree()) {
      expect(g.items.map((i) => i.slug)).toEqual(TOPICS.filter((t) => t.level === g.level).map((t) => t.slug));
      expect(g.items.length).toBeGreaterThan(0);
    }
    expect(lessonTree(undefined, [topic("a", "CORE")]).map((g) => g.level)).toEqual(["CORE"]);
  });

  it("for guests, a published topic is open and links to its lesson, and a coming-soon topic is marked and has no link", () => {
    const items = lessonTree(undefined, [topic("a", "CORE"), topic("b", "CORE", "COMING_SOON")])[0].items;
    expect(items[0]).toMatchObject({ slug: "a", state: "open", href: "/learn/a" });
    expect(items[1]).toMatchObject({ slug: "b", state: "soon", href: null });
  });

  it("uses a learner's states, and gives locked topics no link", () => {
    const states = new Map<string, TopicState>([["a", "done"], ["b", "current"], ["c", "locked"]]);
    const items = lessonTree(states, [topic("a", "CORE"), topic("b", "CORE"), topic("c", "CORE")])[0].items;
    expect(items.map((i) => i.state)).toEqual(["done", "current", "locked"]);
    expect(items.map((i) => i.href)).toEqual(["/learn/a", "/learn/b", null]);
  });
});

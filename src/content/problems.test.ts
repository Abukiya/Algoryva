import { describe, expect, it } from "vitest";
import { EXTERNAL_PROBLEMS } from "./externalProblems";
import { ORIGINAL_PROBLEMS } from "./originalProblems";
import { HIDDEN_TESTS } from "./hiddenTests";
import { TOPICS } from "@/lib/curriculum";
import { normalizeProblemUrl, slugify } from "@/lib/url";

describe("external practice links", () => {
  it("every link normalises, is unique, and belongs to a published topic", () => {
    const published = new Set(TOPICS.filter((t) => t.status === "PUBLISHED").map((t) => t.slug));
    const seen = new Set<string>(), slugs = new Set<string>();
    for (const e of EXTERNAL_PROBLEMS) {
      const n = normalizeProblemUrl(e.url);
      expect(n.ok, `${e.title}: ${e.url}`).toBe(true);
      if (!n.ok) continue;
      expect(n.url, `not canonical: ${e.url}`).toBe(e.url);
      expect(seen.has(n.url), `duplicate ${n.url}`).toBe(false);
      seen.add(n.url);
      const slug = slugify(`${n.platform}-${e.title}`);
      expect(slugs.has(slug), `slug collision ${slug}`).toBe(false);
      slugs.add(slug);
      expect(published.has(e.topic), `${e.topic} is not a published topic`).toBe(true);
    }
  });
  it("every published topic with source links has a spread of tiers", () => {
    const byTopic = new Map<string, Set<string>>();
    for (const e of EXTERNAL_PROBLEMS) (byTopic.get(e.topic) ?? byTopic.set(e.topic, new Set()).get(e.topic)!).add(e.tier);
    for (const [topic, tiers] of byTopic) {
      const n = EXTERNAL_PROBLEMS.filter((e) => e.topic === topic).length;
      if (n >= 8) expect(tiers.size, topic).toBeGreaterThanOrEqual(3);
    }
  });
});

describe("original problems", () => {
  it("have unique slugs, real topics, samples, and hidden tests", () => {
    const topics = new Set(TOPICS.map((t) => t.slug)), slugs = new Set<string>();
    for (const o of ORIGINAL_PROBLEMS) {
      expect(slugs.has(o.slug)).toBe(false);
      slugs.add(o.slug);
      expect(topics.has(o.topic), o.slug).toBe(true);
      expect(o.samples.length, o.slug).toBeGreaterThan(0);
      expect((HIDDEN_TESTS[o.slug] ?? []).length, `${o.slug} needs hidden tests`).toBeGreaterThanOrEqual(3);
    }
  });
});

import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { VisualizerApp } from "./VisualizerApp";
import VisualizerPage from "@/app/visualizer/page";
import { ALGORITHMS, getAlgorithm } from "@/lib/visualizer/registry";

// A plain anchor stands in for next/link, so the render needs no router.
vi.mock("next/link", () => ({
  default: (props: { href: string; children?: unknown }) => createElement("a", { href: props.href }, props.children as never),
}));

/** Server rendering inserts comment markers between text pieces and escapes apostrophes. Undo both for text checks. */
const plain = (html: string) =>
  html.replace(/<!-- -->/g, "").replace(/&#x27;/g, "'").replace(/&amp;/g, "&").replace(/&quot;/g, '"');

describe("VisualizerApp renders every algorithm", () => {
  for (const algo of ALGORITHMS) {
    it(`renders ${algo.id} with its title, stage, pseudocode and complexity`, () => {
      const html = plain(renderToString(createElement(VisualizerApp, { initialId: algo.id })));
      expect(html).toContain(algo.title);
      expect(html).toContain("Pseudocode");
      expect(html).toContain("Complexity");
      expect(html).toMatch(/Step 1 of \d+/);
      expect(html).not.toContain("undefined");
    });
  }
});

describe("the /visualizer page picks the algorithm from its query", () => {
  const cases: [Record<string, string>, string][] = [
    [{ lesson: "binary-search" }, "binary-search"],
    [{ algo: "fenwick" }, "fenwick"],
    [{ algo: "not-a-real-id" }, "linear-search"],
    [{}, "linear-search"],
  ];
  for (const [query, id] of cases) {
    it(`opens ${id} for ${JSON.stringify(query)}`, async () => {
      const element = await VisualizerPage({ searchParams: Promise.resolve(query) });
      const html = plain(renderToString(element));
      const title = getAlgorithm(id)?.title ?? "";
      expect(html).toMatch(new RegExp(`aria-pressed="true"[^>]*>${title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}<`));
    });
  }
});

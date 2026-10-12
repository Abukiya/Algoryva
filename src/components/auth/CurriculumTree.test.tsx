import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CurriculumTree } from "./CurriculumTree";
import { TOPICS } from "@/lib/curriculum";

/** Server rendering inserts comment markers and escapes apostrophes. Undo both for text checks. */
const plain = (html: string) =>
  html.replace(/<!-- -->/g, "").replace(/&#x27;/g, "'").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">");

describe("CurriculumTree", () => {
  const live = TOPICS.filter((t) => t.status === "PUBLISHED");
  const html = plain(renderToString(createElement(CurriculumTree)));

  it("lists every published topic, so it always matches the curriculum", () => {
    for (const t of live) expect(html, t.slug).toContain(t.title);
    expect(html).toContain(`${live.length} topics`);
  });

  it("groups topics under their level headings", () => {
    expect(html).toContain("Foundation");
    expect(html).toContain("Expert");
  });
});

import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { LessonTreePanel } from "./LessonTreePanel";
import { TOPICS } from "@/lib/curriculum";

// A plain anchor stands in for next/link, so the render needs no router.
vi.mock("next/link", () => ({
  default: (props: { href: string; className?: string; children?: unknown }) => createElement("a", { href: props.href, className: props.className }, props.children as never),
}));

/** Server rendering inserts comment markers and escapes apostrophes. Undo both for text checks. */
const plain = (html: string) => html.replace(/<!-- -->/g, "").replace(/&#x27;/g, "'").replace(/&amp;/g, "&").replace(/&quot;/g, '"');
const render = (props: Parameters<typeof LessonTreePanel>[0]) => plain(renderToString(createElement(LessonTreePanel, props)));

describe("LessonTreePanel", () => {
  it("shows the lesson count and every lesson", () => {
    const html = render({});
    expect(html).toContain(`${TOPICS.length} lessons, in order`);
    for (const t of TOPICS) expect(html, t.slug).toContain(t.title);
  });

  it("is a preview by default (login and signup), and links each lesson when linked (landing page)", () => {
    expect(render({})).not.toContain("<a ");
    expect(render({ linked: true })).toContain(`href="/learn/${TOPICS[0].slug}"`);
  });

  it("caps its height only when asked, for the narrow auth panel", () => {
    expect(render({ scroll: true })).toContain("max-h-[60vh]");
    expect(render({})).not.toContain("max-h-[60vh]");
  });
});

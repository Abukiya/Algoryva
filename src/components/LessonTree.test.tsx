import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { LessonTree } from "./LessonTree";
import { TOPICS } from "@/lib/curriculum";
import type { TopicState } from "@/lib/topic-state";

// A plain anchor stands in for next/link, so the render needs no router.
vi.mock("next/link", () => ({
  default: (props: { href: string; className?: string; children?: unknown }) => createElement("a", { href: props.href, className: props.className }, props.children as never),
}));

/** Server rendering inserts comment markers and escapes apostrophes. Undo both for text checks. */
const plain = (html: string) => html.replace(/<!-- -->/g, "").replace(/&#x27;/g, "'").replace(/&amp;/g, "&").replace(/&quot;/g, '"');
const render = (props: Parameters<typeof LessonTree>[0]) => plain(renderToString(createElement(LessonTree, props)));

describe("LessonTree", () => {
  it("lists every lesson", () => {
    const html = render({});
    for (const t of TOPICS) expect(html, t.slug).toContain(t.title);
  });

  it("on the login and signup pages (linked=false) shows no links, so nobody is pulled away from the form", () => {
    expect(render({ linked: false })).not.toContain("<a ");
  });

  it("on the dashboard, links open topics to their lessons but not locked ones, and says each state in words", () => {
    const first = TOPICS[0].slug, second = TOPICS[1].slug;
    const states = new Map<string, TopicState>([[first, "done"], [second, "locked"]]);
    const html = render({ states, legend: true });
    expect(html).toContain(`href="/learn/${first}"`);
    expect(html).not.toContain(`href="/learn/${second}"`);
    expect(html).toContain("(completed)");
    expect(html).toContain("(locked)");
    expect(html).toContain("Locked until its prerequisites are done");
  });

  it("shows the legend only when asked", () => {
    expect(render({})).not.toContain("Locked until its prerequisites");
  });
});

import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LessonFrame } from "./LessonFrame";

describe("LessonFrame", () => {
  // JSX passes the lesson body as the typed `children` prop, which LessonFrame requires.
  const html = renderToString(
    <LessonFrame toc={<ol><li>Intro</li></ol>} rail={<p>Path rail body</p>}>
      <article>Lesson body</article>
    </LessonFrame>,
  ).replace(/<!-- -->/g, "");

  it("keeps the lesson in the middle, with the contents and path panels around it", () => {
    expect(html).toContain("Lesson body");
    expect(html).toContain("Intro");
    expect(html).toContain("Path rail body");
  });

  it("offers a collapse control for each side and a Focus reading toggle", () => {
    expect(html).toContain("On this page");
    expect(html).toContain("Where you are");
    expect(html).toContain("Focus reading");
  });

  it("starts expanded on the server", () => {
    expect(html).not.toContain('aria-label="Show On this page"');
  });
});

import { describe, expect, it } from "vitest";
import { blocksToMarkdown, parseLessonMarkdown } from "./lesson-markdown";

describe("lesson markdown", () => {
  it("parses headings, text and code", () => {
    const b = parseLessonMarkdown("## Idea\n\nUse sums.\n\n```python\nx = 1\n```\n\n## Next\nMore.");
    expect(b).toEqual([{ heading: "Idea", text: "Use sums.", code: "x = 1" }, { heading: "Next", text: "More." }]);
  });
  it("round-trips", () => {
    const blocks = [{ heading: "A", text: "t", code: "print(1)" }, { heading: "B", text: "u" }];
    expect(parseLessonMarkdown(blocksToMarkdown(blocks))).toEqual(blocks);
  });
  it("ignores text before the first heading", () => expect(parseLessonMarkdown("junk\n## H\nbody")).toEqual([{ heading: "H", text: "body" }]));
});

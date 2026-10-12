import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { SolvedCheckbox } from "./SolvedCheckbox";

// The real action talks to the database; the markup is what these tests are about.
vi.mock("@/app/problems/actions", () => ({ toggleSolved: async () => undefined }));

const render = (props: Parameters<typeof SolvedCheckbox>[0]) => renderToString(createElement(SolvedCheckbox, props)).replace(/<!-- -->/g, "");

describe("SolvedCheckbox", () => {
  it("an external problem for a signed-in user is a checkbox that submits toggleSolved", () => {
    const html = render({ problemId: "p1", title: "Two Sum", checked: false, external: true, signedIn: true });
    expect(html).toContain("<form");
    expect(html).toContain('role="checkbox"');
    expect(html).toContain('aria-checked="false"');
    expect(html).toContain('value="p1"');
    expect(html).toContain('aria-label="Mark Two Sum as solved"');
  });

  it("reports a solved external problem as checked", () => {
    expect(render({ problemId: "p1", title: "Two Sum", checked: true, external: true, signedIn: true })).toContain('aria-checked="true"');
  });

  it("internal problems are read-only, because only the judge can solve them", () => {
    const html = render({ problemId: "p2", title: "Binary Search", checked: true, external: false, signedIn: true });
    expect(html).not.toContain("<form");
    expect(html).toContain("Solved by passing every test");
  });

  it("guests see the state but cannot change it", () => {
    const html = render({ problemId: "p1", title: "Two Sum", checked: false, external: true, signedIn: false });
    expect(html).not.toContain("<form");
    expect(html).toContain("Log in to track solved problems");
  });
});

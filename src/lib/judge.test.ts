import { describe, expect, it } from "vitest";
import { gradeOutput } from "./judge";

describe("gradeOutput", () => {
  it("ignores trailing whitespace and a final newline", () => {
    expect(gradeOutput("1\n2\n3", "1 \n2\n3\n")).toBe(true);
  });
  it("rejects wrong content", () => expect(gradeOutput("1\n2", "1\n3")).toBe(false));
});

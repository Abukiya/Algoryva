import { describe, expect, it } from "vitest";
import { lessonSource } from "./lesson-source";

describe("lessonSource", () => {
  it("a published custom lesson wins over a built-in full lesson", () => {
    expect(lessonSource({ customStatus: "PUBLISHED", hasFull: true, hasOutline: true })).toBe("custom-live");
  });
  it("a draft never replaces the built-in lesson, so it is labelled as a draft", () => {
    expect(lessonSource({ customStatus: "DRAFT", hasFull: true, hasOutline: false })).toBe("custom-draft");
  });
  it("a COMING_SOON custom row is not live, so learners still get the built-in lesson", () => {
    expect(lessonSource({ customStatus: "COMING_SOON", hasFull: true, hasOutline: false })).toBe("full");
    expect(lessonSource({ customStatus: "COMING_SOON", hasFull: false, hasOutline: true })).toBe("outline");
    expect(lessonSource({ customStatus: "COMING_SOON", hasFull: false, hasOutline: false })).toBe("none");
  });
  it("falls back to the full lesson, then the outline, then nothing", () => {
    expect(lessonSource({ customStatus: null, hasFull: true, hasOutline: true })).toBe("full");
    expect(lessonSource({ customStatus: null, hasFull: false, hasOutline: true })).toBe("outline");
    expect(lessonSource({ customStatus: null, hasFull: false, hasOutline: false })).toBe("none");
  });
});

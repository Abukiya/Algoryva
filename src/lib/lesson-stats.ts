import { parseLessonMarkdown } from "@/lib/lesson-markdown";

/** Outline numbers for a lesson's markdown. Words exclude code, and reading time assumes about 200 words a minute. */
export function outlineStats(md: string) {
  const blocks = parseLessonMarkdown(md);
  const words = md.replace(/```[\s\S]*?```/g, " ").split(/\s+/).filter(Boolean).length;
  const codeBlocks = Math.floor((md.match(/```/g)?.length ?? 0) / 2);
  return { sections: blocks.length, headings: blocks.map((b) => b.heading), words, minutes: Math.max(1, Math.round(words / 200)), codeBlocks };
}

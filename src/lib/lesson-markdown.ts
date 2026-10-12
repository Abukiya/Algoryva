export type Block = { heading: string; text: string; code?: string };

/** Format: "## Heading" starts a block; the first fenced code block inside becomes its code. */
export function parseLessonMarkdown(src: string): Block[] {
  const blocks: Block[] = [];
  let cur: { heading: string; lines: string[] } | null = null;
  const flush = () => {
    if (!cur) return;
    const body = cur.lines.join("\n");
    const m = /```[a-z+]*\n([\s\S]*?)```/.exec(body);
    const text = (m ? body.replace(m[0], "") : body).trim();
    blocks.push({ heading: cur.heading, text, ...(m ? { code: m[1].replace(/\n$/, "") } : {}) });
  };
  for (const line of src.replace(/\r\n/g, "\n").split("\n")) {
    const h = /^##\s+(.+)$/.exec(line);
    if (h) { flush(); cur = { heading: h[1].trim(), lines: [] }; } else if (cur) cur.lines.push(line);
  }
  flush();
  return blocks;
}

export const blocksToMarkdown = (blocks: Block[]) =>
  blocks.map((b) => `## ${b.heading}\n\n${b.text}\n${b.code ? `\n\`\`\`python\n${b.code}\n\`\`\`\n` : ""}`).join("\n");

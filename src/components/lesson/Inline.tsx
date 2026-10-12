import type { ReactNode } from "react";

/** Renders `code` and **bold** inside lesson prose. Nothing else is interpreted, so content cannot inject markup. */
export function Inline({ text }: { text: string }): ReactNode {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
  return parts.map((p, i) => {
    if (p.startsWith("`") && p.endsWith("`") && p.length > 2) return <code key={i} className="inline-code">{p.slice(1, -1)}</code>;
    if (p.startsWith("**") && p.endsWith("**") && p.length > 4) return <strong key={i}>{p.slice(2, -2)}</strong>;
    return p;
  });
}

import { TOPICS, bySlug } from "@/lib/curriculum";
import { LESSONS } from "@/content/lessons";
import { LESSONS_V2 } from "@/content/lessons-v2";

export const MIN_QUERY = 2;
export const normalizeQuery = (q: string) => q.trim().toLowerCase().replace(/\s+/g, " ").slice(0, 100);

export function searchTopics(q: string) {
  const n = normalizeQuery(q);
  if (n.length < MIN_QUERY) return [];
  const dashed = n.replace(/ /g, "-");
  return TOPICS.filter((t) => t.title.toLowerCase().includes(n) || t.slug.includes(dashed));
}

export type LessonHit = { slug: string; title: string; heading: string; anchor?: string; complete: boolean };

const plain = (t: string) => t.replace(/[`*]/g, "").toLowerCase();

/** Text a complete lesson can be found by, tagged with the section it lives in. */
function v2Haystack(slug: string): { heading: string; anchor?: string; text: string }[] {
  const l = LESSONS_V2[slug];
  const out: { heading: string; anchor?: string; text: string }[] = [{ heading: "Overview", text: [l.hook, ...l.objectives].join(" ") }];
  for (const s of l.sections) {
    const parts: string[] = [s.title];
    if ("paras" in s && s.paras) parts.push(...s.paras);
    if (s.kind === "concept" && s.bullets) parts.push(...s.bullets);
    if (s.kind === "recognize") parts.push(...s.signals, ...(s.notThis ?? []));
    if (s.kind === "edge") parts.push(...s.items.flatMap((i) => [i.case, i.handle]));
    if (s.kind === "mistakes") parts.push(...s.items.flatMap((i) => [i.mistake, i.fix]));
    if (s.kind === "worked") parts.push(s.problem, ...s.approach);
    out.push({ heading: s.title, anchor: s.id, text: parts.join(" ") });
  }
  out.push({ heading: "Wrap-up", anchor: "summary", text: [...l.summary, ...l.cheatSheet.map((c) => `${c.label} ${c.value}`)].join(" ") });
  return out;
}

/** Matches lesson headings and text; returns one hit per lesson, pointing at the best section. Section titles beat body text. */
export function searchLessons(q: string): LessonHit[] {
  const n = normalizeQuery(q);
  if (n.length < MIN_QUERY) return [];
  const hits: LessonHit[] = [];
  const slugs = new Set([...Object.keys(LESSONS), ...Object.keys(LESSONS_V2)]);
  for (const slug of slugs) {
    const topic = bySlug.get(slug);
    if (!topic) continue;
    if (LESSONS_V2[slug]) {
      const hay = v2Haystack(slug);
      const hit = hay.find((h) => plain(h.heading).includes(n)) ?? hay.find((h) => plain(h.text).includes(n));
      if (hit) hits.push({ slug, title: topic.title, heading: hit.heading, anchor: hit.anchor, complete: true });
      continue;
    }
    const block = LESSONS[slug].blocks.find((b) => b.heading.toLowerCase().includes(n) || b.text.toLowerCase().includes(n));
    if (block) hits.push({ slug, title: topic.title, heading: block.heading, complete: false });
  }
  return hits;
}

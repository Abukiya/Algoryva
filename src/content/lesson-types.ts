/**
 * Structured lesson model (v2).
 *
 * A lesson is data, not JSX: the renderer (components/lesson/LessonView.tsx) lays every section
 * out consistently, and lib/lesson-quality.ts checks that a lesson marked "complete" actually
 * has every ingredient of docs/LESSON_QUALITY_STANDARD.md. Inline text supports `code` and **bold**.
 */
export type Quiz = {
  q: string;
  options: string[];
  answer: number; // index into options
  why: string; // shown after answering, right or wrong
  kind?: "concept" | "trace" | "recognize" | "complexity";
};

export type Section =
  | { kind: "intuition"; id: string; title: string; paras: string[] }
  | { kind: "concept"; id: string; title: string; paras: string[]; bullets?: string[] }
  | { kind: "naive"; id: string; title: string; paras: string[]; code?: string; cost: string }
  | { kind: "observation"; id: string; title: string; paras: string[] }
  | { kind: "viz"; id: string; title: string; viz: string; paras: string[] } // paras = "what to watch for"
  | { kind: "example"; id: string; title: string; paras: string[]; steps?: { title: string; body: string }[]; table?: { head: string[]; rows: string[][] } }
  | { kind: "code"; id: string; title: string; paras: string[]; code: string; walkthrough: string[]; pseudocode?: string }
  | { kind: "complexity"; id: string; title: string; rows: { what: string; time: string; space: string; why: string }[]; paras?: string[] }
  | { kind: "edge"; id: string; title: string; items: { case: string; handle: string }[] }
  | { kind: "mistakes"; id: string; title: string; items: { mistake: string; fix: string }[] }
  | { kind: "recognize"; id: string; title: string; signals: string[]; notThis?: string[]; paras?: string[] }
  | { kind: "worked"; id: string; title: string; problem: string; approach: string[]; code: string; takeaway: string };

export type PracticeTier = "warmup" | "core" | "application" | "challenge";

export type LessonV2 = {
  topic: string; // matches TopicDef.slug
  depth: "complete";
  minutes: number; // honest estimate including the visualizations and checks
  hook: string; // one sentence: why this exists
  objectives: string[];
  prereqNote?: string; // what to be comfortable with beyond the linked topics
  sections: Section[];
  cheatSheet: { label: string; value: string }[]; // the complexity / facts card
  summary: string[]; // the key ideas, one line each
  checks: Quiz[]; // mastery questions
  /** Where the learner goes next and why; practice itself comes from the problem tiers. */
  nextNote?: string;
};

export const REQUIRED_KINDS: Section["kind"][] = ["intuition", "concept", "viz", "example", "code", "complexity", "edge", "mistakes", "recognize", "worked"];

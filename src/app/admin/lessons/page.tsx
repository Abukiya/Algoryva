import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { TOPICS } from "@/lib/curriculum";
import { LESSONS } from "@/content/lessons";
import { LESSONS_V2 } from "@/content/lessons-v2";
import { lessonSource, type LessonSource } from "@/lib/lesson-source";
import { outlineStats } from "@/lib/lesson-stats";
import { PageHeader } from "@/components/ui";
import { setLessonStatus } from "./actions";

export const metadata: Metadata = { title: "Admin: lessons", robots: { index: false } };
export const dynamic = "force-dynamic";

type Filter = "all" | "live" | "draft" | "builtin" | "none";
const FILTERS: [Filter, string][] = [["all", "All"], ["live", "Live"], ["draft", "Draft"], ["builtin", "Built-in only"], ["none", "No lesson"]];
const LABEL: Record<LessonSource, [string, string]> = {
  "custom-live": ["Custom, live", "chip chip-ok"],
  "custom-draft": ["Custom, draft", "chip chip-warn"],
  full: ["Built-in full lesson", "chip"],
  outline: ["Built-in outline", "chip"],
  none: ["No lesson yet", "chip"],
};
const keeps = (f: Filter, s: LessonSource) =>
  f === "all" || (f === "live" && s === "custom-live") || (f === "draft" && s === "custom-draft") || (f === "builtin" && (s === "full" || s === "outline")) || (f === "none" && s === "none");

export default async function AdminLessons({ searchParams }: { searchParams: Promise<{ show?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const show: Filter = FILTERS.some(([k]) => k === sp.show) ? (sp.show as Filter) : "all";
  const customs = await db.lesson.findMany({ where: { slug: "main" }, select: { status: true, topic: { select: { slug: true } }, sections: { orderBy: { position: "asc" }, take: 1, select: { body: true } } } });
  const custom = new Map(customs.map((l) => [l.topic.slug, { status: l.status, body: l.sections[0]?.body ?? "" }]));
  const rows = TOPICS.filter((t) => t.status === "PUBLISHED").map((t) => {
    const c = custom.get(t.slug);
    const source = lessonSource({ customStatus: c ? c.status : null, hasFull: Boolean(LESSONS_V2[t.slug]), hasOutline: Boolean(LESSONS[t.slug]) });
    return { t, c, source, stats: c && c.body ? outlineStats(c.body) : null };
  });
  const counts = Object.fromEntries(FILTERS.map(([f]) => [f, rows.filter((r) => keeps(f, r.source)).length])) as Record<Filter, number>;
  const visible = rows.filter((r) => keeps(show, r.source));

  return (
    <>
      <PageHeader title="Lessons" lead="A published custom lesson replaces the built-in text for that topic, including full lessons. Topics themselves are defined in code." />
      <nav aria-label="Filter lessons" className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map(([f, label]) => (
          <Link key={f} href={f === "all" ? "/admin/lessons" : `/admin/lessons?show=${f}`} aria-current={show === f ? "page" : undefined}
            className={`chip ${show === f ? "border-brand bg-brand/10 font-bold text-brand" : ""}`}>
            {label} <span className="tnum">{counts[f]}</span>
          </Link>
        ))}
      </nav>
      {visible.length === 0 ? <p className="card card-pad text-sm text-soft">No topics in this filter.</p> : (
        <ul className="card divide-y divide-line">{visible.map(({ t, c, source, stats }) => (
          <li key={t.slug} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-0">
              <p className="font-bold">{t.title}</p>
              {stats && <p className="text-xs text-muted">{stats.sections} section{stats.sections === 1 ? "" : "s"} · {stats.words} words · about {stats.minutes} min{stats.codeBlocks ? ` · ${stats.codeBlocks} code block${stats.codeBlocks === 1 ? "" : "s"}` : ""}</p>}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={LABEL[source][1]}>{LABEL[source][0]}</span>
              {c && stats && stats.sections > 0 && (
                <form action={setLessonStatus}>
                  <input type="hidden" name="slug" value={t.slug} />
                  <input type="hidden" name="status" value={c.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED"} />
                  <button className="btn btn-secondary btn-sm">{c.status === "PUBLISHED" ? "Unpublish" : "Publish"}</button>
                </form>
              )}
              <Link href={`/admin/lessons/${t.slug}`} className="btn btn-secondary btn-sm">{c ? "Edit" : "Write"}</Link>
            </div>
          </li>
        ))}</ul>
      )}
    </>
  );
}

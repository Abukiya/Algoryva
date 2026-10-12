import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { bySlug } from "@/lib/curriculum";
import { LESSONS } from "@/content/lessons";
import { LESSONS_V2 } from "@/content/lessons-v2";
import { blocksToMarkdown } from "@/lib/lesson-markdown";
import { revertLesson } from "../actions";
import { LessonEditor } from "../LessonEditor";

export const metadata: Metadata = { title: "Admin: edit lesson", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function EditLesson({ params }: { params: Promise<{ slug: string }> }) {
  await requireAdmin();
  const { slug } = await params;
  const topic = bySlug.get(slug);
  if (!topic || topic.status !== "PUBLISHED") notFound();
  const row = await db.lesson.findFirst({ where: { slug: "main", topic: { slug } }, select: { status: true, sections: { take: 1, orderBy: { position: "asc" }, select: { body: true } } } });
  // Full lessons are not stored as markdown, so start blank rather than from the old outline text.
  const markdown = row?.sections[0]?.body ?? (LESSONS_V2[slug] ? "" : blocksToMarkdown(LESSONS[slug]?.blocks ?? []));
  const builtinFull = Boolean(LESSONS_V2[slug]);
  return (
    <div>
      <h1 className="mb-6 text-3xl font-extrabold">{topic.title}</h1>
      {builtinFull && !row && <p className="mb-4 max-w-4xl rounded-xl border border-line bg-sunken p-4 text-sm">This topic has a built-in full lesson. A published custom lesson replaces it for learners, so write the full text here.</p>}
      <LessonEditor slug={slug} markdown={markdown} status={row?.status === "PUBLISHED" ? "PUBLISHED" : "DRAFT"} />
      {row && <form action={revertLesson} className="mt-6"><input type="hidden" name="slug" value={slug} /><button className="btn btn-quiet btn-sm text-muted">Discard custom lesson and use the built-in one</button></form>}
    </div>
  );
}

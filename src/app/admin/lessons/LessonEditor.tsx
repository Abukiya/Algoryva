"use client";
import { useActionState, useMemo, useState } from "react";
import Link from "next/link";
import { saveLesson } from "./actions";
import { outlineStats } from "@/lib/lesson-stats";

export function LessonEditor({ slug, markdown, status }: { slug: string; markdown: string; status: string }) {
  const [state, action, pending] = useActionState(saveLesson, undefined);
  const [md, setMd] = useState(markdown);
  const o = useMemo(() => outlineStats(md), [md]);
  return (
    <div className="grid max-w-6xl gap-6 xl:grid-cols-[minmax(0,1fr)_18rem]">
      <form action={action} className="card card-pad min-w-0 space-y-5">
        <input type="hidden" name="slug" value={slug} />
        <label className="block"><span className="label">Lesson. Start each section with <code className="inline-code">## Heading</code>; the first fenced code block in a section is shown as code.</span>
          <textarea name="markdown" value={md} onChange={(e) => setMd(e.target.value)} rows={24} required className="input mt-1.5 w-full font-mono" spellCheck={false} /></label>
        <label className="block max-w-sm"><span className="label">Status</span><select name="status" defaultValue={status} className="input mt-1.5 w-full"><option value="DRAFT">Draft (learners see the current lesson)</option><option value="PUBLISHED">Published (replaces the built-in lesson)</option></select></label>
        <p role="alert" className="field-error">{state?.error}</p>
        <div className="flex flex-wrap items-center gap-3">
          <button disabled={pending} className="btn btn-primary">{pending ? "Saving" : "Save lesson"}</button>
          <Link href={`/learn/${slug}`} target="_blank" rel="noopener noreferrer" className="btn btn-quiet btn-sm">View the lesson page</Link>
        </div>
      </form>
      <aside aria-label="Lesson outline" className="card card-pad h-fit space-y-4 xl:sticky xl:top-20">
        <p className="text-sm font-extrabold">Outline</p>
        <dl className="grid grid-cols-3 gap-2 text-center text-xs">
          <div><dt className="text-muted">Sections</dt><dd className="tnum text-lg font-extrabold">{o.sections}</dd></div>
          <div><dt className="text-muted">Words</dt><dd className="tnum text-lg font-extrabold">{o.words}</dd></div>
          <div><dt className="text-muted">Minutes</dt><dd className="tnum text-lg font-extrabold">{o.minutes}</dd></div>
        </dl>
        <p className="text-xs text-muted">{o.codeBlocks} code block{o.codeBlocks === 1 ? "" : "s"}. Sections are read from the headings.</p>
        {o.sections === 0 ? <p className="text-sm text-bad">Add at least one section that starts with a ## heading before saving.</p> : (
          <ol className="max-h-80 space-y-1 overflow-y-auto text-sm">{o.headings.map((h, i) => <li key={i} className="truncate">{i + 1}. {h}</li>)}</ol>
        )}
      </aside>
    </div>
  );
}

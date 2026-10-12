import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { deleteNote } from "./actions";
import { NoteForm } from "./NoteForm";
import { EmptyState, PageHeader } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { Icon } from "@/components/Icon";

export const metadata: Metadata = { title: "Notes" };
export const dynamic = "force-dynamic";
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function Notes({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const q = one(sp.q).trim().slice(0, 100), tag = one(sp.tag).trim().toLowerCase().slice(0, 24);
  const notes = await db.note.findMany({
    where: { userId: user.id, ...(tag ? { tags: { has: tag } } : {}), ...(q ? { OR: [{ title: { contains: q, mode: "insensitive" } }, { body: { contains: q, mode: "insensitive" } }] } : {}) },
    orderBy: { updatedAt: "desc" }, take: 50,
  });
  return (
    <div className="page">
      <PageHeader title="Notes" lead="Your own words, kept next to the lessons and problems you are working on. Tag a note with a topic slug to find it fast." />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="space-y-4">
          <form role="search" className="flex gap-2"><span className="relative flex-1"><Icon name="search" size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" /><input name="q" defaultValue={q} aria-label="Search notes" placeholder="Search notes" className="input pl-9" /></span>
            {tag && <input type="hidden" name="tag" value={tag} />}<button className="btn btn-secondary">Search</button></form>
          {(tag || q) && <p className="text-sm text-soft">{tag && <>Tag <span className="chip chip-brand">#{tag}</span> </>}{q && <>matching “{q}” </>}<Link className="ml-1 font-bold text-brand" href="/notes">Clear</Link></p>}
          {notes.length === 0 ? <EmptyState icon="note" title={q || tag ? "No notes match" : "No notes yet"}>{q || tag ? "Try a different search or clear the filter." : "Capture a trick, a template or a thing you keep forgetting. Start with the form."}</EmptyState> : (
            <ul className="space-y-3">{notes.map((n) => (
              <li key={n.id}><article className="card card-pad">
                <div className="flex items-start justify-between gap-3"><h2 className="text-lg font-extrabold">{n.title}</h2>
                  <form action={deleteNote}><input type="hidden" name="id" value={n.id} /><SubmitButton className="btn btn-quiet btn-sm btn-icon text-muted" pendingLabel=""><Icon name="trash" size={15} /><span className="sr-only">Delete note</span></SubmitButton></form></div>
                <p className="well mt-3 whitespace-pre-wrap p-3.5 font-mono text-[13.5px] leading-relaxed">{n.body}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2">{n.tags.map((t) => <Link key={t} href={`/notes?tag=${t}`} className="chip chip-brand">#{t}</Link>)}<time className="ml-auto text-xs text-muted" dateTime={n.updatedAt.toISOString()}>Updated {n.updatedAt.toISOString().slice(0, 10)}</time></div>
              </article></li>))}</ul>)}
        </div>
        <aside className="lg:sticky lg:top-20 lg:h-fit"><section className="card card-pad" aria-labelledby="new"><h2 id="new" className="mb-4 text-lg font-extrabold">New note</h2><NoteForm defaults={{ title: one(sp.nt).slice(0, 120), tags: one(sp.ntags).slice(0, 60), body: one(sp.nb).slice(0, 2000) }} /></section></aside>
      </div>
    </div>
  );
}

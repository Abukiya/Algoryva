import type { Metadata } from "next";
import Link from "next/link";
import type { ContentStatus, Prisma } from "@prisma/client";
import { requireAdmin } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { deleteProblem, setPublished } from "./actions";
import { PageHeader, EmptyState } from "@/components/ui";
import { Difficulty } from "@/components/ProblemBadge";
import { SubmitButton } from "@/components/SubmitButton";
import { Icon } from "@/components/Icon";

export const metadata: Metadata = { title: "Admin: problems", robots: { index: false } };
export const dynamic = "force-dynamic";
const SIZE = 50;

export default async function AdminProblems({ searchParams }: { searchParams: Promise<{ page?: string; q?: string; status?: string; kind?: string }> }) {
  await requireAdmin();
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? "1") || 1);
  const q = (sp.q ?? "").trim().slice(0, 100);
  const status = ["DRAFT", "PUBLISHED"].includes(sp.status ?? "") ? (sp.status as ContentStatus) : undefined;
  const kind = ["INTERNAL", "EXTERNAL"].includes(sp.kind ?? "") ? (sp.kind as "INTERNAL" | "EXTERNAL") : undefined;
  const where: Prisma.ProblemWhereInput = { ...(q ? { title: { contains: q, mode: "insensitive" } } : {}), ...(status ? { status } : {}), ...(kind ? { kind } : {}) };
  const [items, total] = await Promise.all([
    db.problem.findMany({ where, orderBy: [{ position: "asc" }, { title: "asc" }], skip: (page - 1) * SIZE, take: SIZE, select: { id: true, title: true, kind: true, source: true, difficulty: true, status: true, position: true } }),
    db.problem.count({ where }),
  ]);
  const qs = (p: number) => { const u = new URLSearchParams(); if (q) u.set("q", q); if (status) u.set("status", status); if (kind) u.set("kind", kind); u.set("page", String(p)); return `?${u}`; };
  return (
    <>
      <PageHeader title={`Problems (${total})`} actions={<Link href="/admin/problems/new" className="btn btn-primary"><Icon name="plus" size={16} />New problem</Link>} />
      <form role="search" className="card mb-4 grid gap-3 p-3 sm:grid-cols-[1fr_9rem_9rem_auto]">
        <input name="q" defaultValue={q} aria-label="Search problems" placeholder="Search by title" className="input" />
        <select name="status" defaultValue={status ?? ""} aria-label="Status" className="input"><option value="">Any status</option><option value="PUBLISHED">Published</option><option value="DRAFT">Draft</option></select>
        <select name="kind" defaultValue={kind ?? ""} aria-label="Type" className="input"><option value="">Any type</option><option value="INTERNAL">Original</option><option value="EXTERNAL">External</option></select>
        <div className="flex gap-2"><button className="btn btn-secondary">Filter</button>{(q || status || kind) && <Link href="/admin/problems" className="btn btn-quiet">Clear</Link>}</div>
      </form>
      {items.length === 0 ? <EmptyState icon="code" title="No problems match" action={<Link href="/admin/problems/new" className="btn btn-primary">New problem</Link>}>Adjust the filters or create one.</EmptyState> : (
        <div className="card overflow-x-auto"><table className="table-clean min-w-[44rem]">
          <thead><tr><th className="w-16">Pos</th><th>Title</th><th>Type</th><th>Difficulty</th><th>Status</th><th className="text-right"><span className="sr-only">Actions</span></th></tr></thead>
          <tbody>{items.map((p) => (
            <tr key={p.id}>
              <td className="tnum font-mono text-muted">{p.position}</td>
              <td className="font-bold"><Link href={`/admin/problems/${p.id}`} className="hover:text-brand">{p.title}</Link></td>
              <td>{p.kind === "INTERNAL" ? <span className="chip chip-brand">Original</span> : <span className="chip capitalize">{p.source}</span>}</td>
              <td><Difficulty value={p.difficulty} /></td>
              <td><span className={`chip ${p.status === "PUBLISHED" ? "chip-ok" : "chip-warn"}`}>{p.status === "PUBLISHED" ? "Published" : "Draft"}</span></td>
              <td><div className="flex justify-end gap-1.5">
                <Link href={`/admin/problems/${p.id}`} className="btn btn-secondary btn-sm">Edit</Link>
                <form action={setPublished}><input type="hidden" name="id" value={p.id} /><input type="hidden" name="publish" value={p.status === "PUBLISHED" ? "0" : "1"} /><SubmitButton className="btn btn-secondary btn-sm" pendingLabel="Saving">{p.status === "PUBLISHED" ? "Unpublish" : "Publish"}</SubmitButton></form>
                <form action={deleteProblem}><input type="hidden" name="id" value={p.id} /><SubmitButton className="btn btn-danger btn-sm" pendingLabel="Deleting">Delete</SubmitButton></form>
              </div></td></tr>))}</tbody></table></div>)}
      <nav className="mt-4 flex items-center justify-between text-sm" aria-label="Pagination">{page > 1 ? <Link className="btn btn-secondary btn-sm" href={qs(page - 1)}>Previous</Link> : <span />}<span className="tnum text-muted">Page {page} of {Math.max(1, Math.ceil(total / SIZE))}</span>{page * SIZE < total ? <Link className="btn btn-secondary btn-sm" href={qs(page + 1)}>Next</Link> : <span />}</nav>
    </>
  );
}

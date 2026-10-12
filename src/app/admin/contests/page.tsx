import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { deleteContest } from "./actions";
import { PageHeader, EmptyState } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { Icon } from "@/components/Icon";
export const metadata: Metadata = { title: "Admin: contests", robots: { index: false } };
export const dynamic = "force-dynamic";
export default async function AdminContests() {
  await requireAdmin();
  const contests = await db.contest.findMany({ orderBy: { createdAt: "desc" }, include: { _count: { select: { problems: true, entries: true } } } });
  return (
    <>
      <PageHeader title="Contests" actions={<Link href="/admin/contests/new" className="btn btn-primary"><Icon name="plus" size={16} />New contest</Link>} />
      {contests.length === 0 ? <EmptyState icon="trophy" title="No contests yet" action={<Link href="/admin/contests/new" className="btn btn-primary">New contest</Link>}>Contests are built from published problems.</EmptyState> : (
        <ul className="card divide-y divide-line">{contests.map((c) => (
          <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
            <div><p className="font-bold">{c.title}</p><p className="tnum mt-0.5 flex flex-wrap items-center gap-x-3 text-xs text-muted"><span className={`chip ${c.status === "PUBLISHED" ? "chip-ok" : "chip-warn"}`}>{c.status === "PUBLISHED" ? "Published" : "Draft"}</span>{c.durationMin} min<span>{c._count.problems} problems</span><span>{c._count.entries} entries</span></p></div>
            <div className="flex gap-1.5"><Link href={`/admin/contests/${c.id}`} className="btn btn-secondary btn-sm">Edit</Link>
              <form action={deleteContest}><input type="hidden" name="id" value={c.id} /><SubmitButton className="btn btn-danger btn-sm" pendingLabel="Deleting">Delete</SubmitButton></form></div></li>))}</ul>)}
    </>
  );
}

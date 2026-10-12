import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { isRunning } from "@/lib/contest-scoring";
import { EmptyState, PageHeader } from "@/components/ui";
import { Icon } from "@/components/Icon";

export const metadata: Metadata = { title: "Contests" };
export const dynamic = "force-dynamic";

export default async function Contests() {
  const user = await getCurrentUser();
  const contests = await db.contest.findMany({ where: { status: "PUBLISHED" }, orderBy: { createdAt: "desc" }, include: { _count: { select: { problems: true } }, entries: { where: { userId: user?.id ?? "-" }, include: { _count: { select: { solves: true } } } } } });
  return (
    <div className="page">
      <PageHeader title="Contests" lead="Virtual contests: your timer starts when you press start, not at a fixed hour. Enter whenever you have a clear block of time." />
      {contests.length === 0 ? <EmptyState icon="trophy" title="No contests published yet" action={<Link href="/problems" className="btn btn-secondary">Practise problems meanwhile</Link>}>New contests appear here as soon as they are published.</EmptyState> : (
        <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {contests.map((c) => {
            const entry = c.entries[0];
            const running = entry ? isRunning(entry.startedAt, c.durationMin) : false;
            const state = !entry ? { label: "Not started", cls: "" } : running ? { label: "In progress", cls: "chip-warn" } : { label: "Finished", cls: "chip-ok" };
            return (
              <li key={c.id}>
                <Link href={`/contests/${c.slug}`} className="card card-link flex h-full flex-col p-5">
                  <div className="flex items-center justify-between"><span className="grid h-10 w-10 place-items-center rounded-xl bg-brand/10 text-brand"><Icon name="trophy" size={20} /></span>{user && <span className={`chip ${state.cls}`}>{state.label}</span>}</div>
                  <h2 className="mt-4 text-xl font-extrabold">{c.title}</h2>
                  {c.description && <p className="mt-1 line-clamp-2 text-sm text-soft">{c.description}</p>}
                  <p className="tnum mt-auto flex items-center gap-4 pt-4 text-sm font-semibold text-muted"><span className="inline-flex items-center gap-1.5"><Icon name="clock" size={14} />{c.durationMin} min</span><span>{c._count.problems} problems</span>{entry && <span className="ml-auto text-ok">{entry._count.solves}/{c._count.problems} solved</span>}</p>
                </Link>
              </li>);
          })}
        </ul>)}
    </div>
  );
}

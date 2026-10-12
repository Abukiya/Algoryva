import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { MISTAKE_TYPES } from "@/lib/mistake-validation";
import { deleteMistake } from "./actions";
import { MistakeForm } from "./MistakeForm";
import { EmptyState, PageHeader } from "@/components/ui";
import { SubmitButton } from "@/components/SubmitButton";
import { Icon } from "@/components/Icon";

export const metadata: Metadata = { title: "Mistake notebook" };
export const dynamic = "force-dynamic";
const label = (v: string) => v.charAt(0) + v.slice(1).toLowerCase().replace(/_/g, " ");

export default async function Mistakes({ searchParams }: { searchParams: Promise<{ problem?: string; type?: string }> }) {
  const user = await requireUser();
  const sp = await searchParams;
  // Validate against the enum: Prisma throws on unknown values, which would show the global error page.
  const typeFilter = (MISTAKE_TYPES as readonly string[]).includes(sp.type ?? "") ? (sp.type as (typeof MISTAKE_TYPES)[number]) : undefined;
  const [items, counts, problems] = await Promise.all([
    db.mistake.findMany({ where: { userId: user.id, ...(typeFilter ? { type: typeFilter } : {}) }, orderBy: { createdAt: "desc" }, take: 50, include: { problem: { select: { slug: true, title: true } } } }),
    db.mistake.groupBy({ by: ["type"], where: { userId: user.id }, _count: { _all: true } }),
    db.problem.findMany({ where: { status: "PUBLISHED" }, orderBy: { title: "asc" }, select: { id: true, title: true }, take: 500 }),
  ]);
  const sorted = [...counts].sort((a, b) => b._count._all - a._count._all);
  const total = sorted.reduce((n, c) => n + c._count._all, 0), top = sorted[0];
  const prefill = problems.some((p) => p.id === sp.problem) ? sp.problem : undefined;

  return (
    <div className="page">
      <PageHeader title="Mistake notebook" lead="Write down what went wrong and how to spot it next time. The pattern of your mistakes is the fastest way to know what to study." />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="space-y-6">
          {total > 0 && (
            <section className="card card-pad" aria-labelledby="patterns">
              <h2 id="patterns" className="text-lg font-extrabold">Your patterns</h2>
              <p className="mt-1 text-sm text-soft">{top && top._count._all >= 2 ? <>Most of your mistakes are <strong className="text-fg">{label(top.type).toLowerCase()}</strong> ({top._count._all} of {total}). Focus your next review there.</> : "Log a few more and a pattern will show up."}</p>
              <ul className="mt-4 space-y-2.5">{sorted.map((c) => (
                <li key={c.type}><Link href={typeFilter === c.type ? "/mistakes" : `/mistakes?type=${c.type}`} className="group flex items-center gap-3 text-sm">
                  <span className={`w-36 shrink-0 font-semibold ${typeFilter === c.type ? "text-brand" : "text-soft group-hover:text-fg"}`}>{label(c.type)}</span>
                  <span className="bar flex-1"><span style={{ width: `${c._count._all / total * 100}%` }} /></span><span className="tnum w-6 text-right font-bold">{c._count._all}</span></Link></li>))}</ul>
            </section>)}

          <section aria-labelledby="entries">
            <div className="mb-3 flex items-center justify-between"><h2 id="entries" className="text-lg font-extrabold">{typeFilter ? `${label(typeFilter)} mistakes` : "Your entries"}</h2>{typeFilter && <Link href="/mistakes" className="text-sm font-bold text-brand">Show all</Link>}</div>
            {items.length === 0 ? <EmptyState icon="alert" title="No entries yet">Right after a wrong answer is the best moment to write one. Use the form to log your first.</EmptyState> : (
              <ul className="space-y-3">{items.map((m) => (
                <li key={m.id}><article className="card card-pad">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2"><span className="chip chip-warn">{label(m.type)}</span>{m.reason && <span className="chip">{label(m.reason)}</span>}<time className="text-xs text-muted" dateTime={m.createdAt.toISOString()}>{m.createdAt.toISOString().slice(0, 10)}</time></div>
                    <form action={deleteMistake}><input type="hidden" name="id" value={m.id} /><SubmitButton className="btn btn-quiet btn-sm text-muted" pendingLabel="Deleting"><Icon name="trash" size={14} />Delete</SubmitButton></form>
                  </div>
                  {m.problem && <Link href={`/problems/${m.problem.slug}`} className="mt-2 inline-block font-extrabold hover:text-brand">{m.problem.title}</Link>}
                  {!m.problem && m.outsideTitle && (m.outsideUrl ? <a href={m.outsideUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1.5 font-extrabold hover:text-brand">{m.outsideTitle}<Icon name="external" size={13} className="text-muted" /><span className="sr-only">(opens in a new tab)</span></a> : <span className="mt-2 inline-block font-extrabold">{m.outsideTitle}</span>)}
                  <dl className="mt-3 space-y-2.5 text-[15px]">
                    <div><dt className="text-xs font-bold text-bad">Misunderstood</dt><dd>{m.misunderstood}</dd></div>
                    <div><dt className="text-xs font-bold text-ok">Correct idea</dt><dd>{m.correctIdea}</dd></div>
                    <div><dt className="text-xs font-bold text-brand">Recognize next time</dt><dd>{m.recognizeNextTime}</dd></div>
                  </dl></article></li>))}</ul>)}
          </section>
        </div>
        <aside className="lg:sticky lg:top-20 lg:h-fit"><section className="card card-pad" aria-labelledby="add"><h2 id="add" className="mb-4 text-lg font-extrabold">Add an entry</h2><MistakeForm problems={problems} defaultProblemId={prefill} /></section></aside>
      </div>
    </div>
  );
}

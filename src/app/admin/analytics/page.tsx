import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { loadFunnel } from "@/lib/funnel-data";
import { PageHeader, Stat, EmptyState } from "@/components/ui";
import { Icon } from "@/components/Icon";

export const metadata: Metadata = { title: "Admin: analytics", robots: { index: false } };
export const dynamic = "force-dynamic";
const DAY = 86_400_000;

export default async function Analytics() {
  await requireAdmin();
  const [users, active7, active30, solves, contestEntries, completedLessons, solveRows, mistakeTypes, mistakeReasons, signups, funnel] = await Promise.all([
    db.user.count(),
    db.activity.findMany({ where: { createdAt: { gte: new Date(Date.now() - 7 * DAY) } }, distinct: ["userId"], select: { userId: true } }),
    db.activity.findMany({ where: { createdAt: { gte: new Date(Date.now() - 30 * DAY) } }, distinct: ["userId"], select: { userId: true } }),
    db.problemSolve.count(),
    db.contestEntry.count(),
    db.topicProgress.count({ where: { completedAt: { not: null } } }),
    db.problemSolve.groupBy({ by: ["problemId"], _count: { _all: true }, orderBy: { _count: { problemId: "desc" } }, take: 10 }),
    db.mistake.groupBy({ by: ["type"], _count: { _all: true }, orderBy: { _count: { type: "desc" } } }),
    db.mistake.groupBy({ by: ["reason"], where: { reason: { not: null } }, _count: { _all: true }, orderBy: { _count: { reason: "desc" } } }),
    db.user.findMany({ where: { createdAt: { gte: new Date(Date.now() - 14 * DAY) } }, select: { createdAt: true } }),
    loadFunnel(),
  ]);
  const problems = await db.problem.findMany({ where: { id: { in: solveRows.map((r) => r.problemId) } }, select: { id: true, title: true } });
  const pName = new Map(problems.map((p) => [p.id, p.title]));
  const byDay: Record<string, number> = {};
  signups.forEach((u) => { const k = u.createdAt.toISOString().slice(0, 10); byDay[k] = (byDay[k] ?? 0) + 1; });
  const days = Array.from({ length: 14 }, (_, i) => { const k = new Date(Date.now() - (13 - i) * DAY).toISOString().slice(0, 10); return [k, byDay[k] ?? 0] as [string, number]; });
  const maxDay = Math.max(1, ...days.map((d) => d[1]));
  const List = ({ title, rows }: { title: string; rows: [string, number][] }) => {
    const max = Math.max(1, ...rows.map((r) => r[1]));
    return (
      <section className="card card-pad">
        <h2 className="text-lg font-extrabold">{title}</h2>
        {rows.length === 0 ? <p className="mt-2 text-sm text-soft">No data yet.</p> : (
          <ul className="mt-3 space-y-2.5">{rows.map(([n, c]) => (
            <li key={n} className="text-sm">
              <div className="mb-1 flex justify-between gap-3"><span className="truncate font-semibold">{n}</span><span className="tnum font-bold">{c}</span></div>
              <div className="bar h-1.5"><span style={{ width: `${(c / max) * 100}%` }} /></div>
            </li>
          ))}</ul>
        )}
      </section>
    );
  };

  return (
    <>
      <PageHeader title="Analytics" />
      <dl className="grid grid-cols-2 gap-4 lg:grid-cols-6">
        <Stat label="Users" value={users} icon="users" />
        <Stat label="Active, 7 days" value={active7.length} icon="bolt" />
        <Stat label="Active, 30 days" value={active30.length} icon="bolt" />
        <Stat label="Lessons completed" value={completedLessons} icon="book" />
        <Stat label="Problems solved" value={solves} icon="check" />
        <Stat label="Contest entries" value={contestEntries} icon="trophy" />
      </dl>

      <section aria-labelledby="funnel" className="card card-pad mt-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="funnel" className="text-lg font-extrabold">Lesson funnel</h2>
          <a href="/admin/analytics/export" className="btn btn-secondary btn-sm"><Icon name="chart" size={14} />Download CSV</a>
        </div>
        <p className="mt-1 text-sm text-soft">How far learners get through each published topic, and how the quizzes go.</p>
        {funnel.length === 0 ? <div className="mt-3"><EmptyState icon="chart" title="No published topics yet" /></div> : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[40rem] text-left text-sm">
              <thead><tr className="border-b border-line text-xs text-muted">
                <th className="py-2 pr-3 font-bold">Topic</th><th className="py-2 pr-3 text-right font-bold">Started</th><th className="py-2 pr-3 text-right font-bold">Completed</th><th className="py-2 pr-3 text-right font-bold">Completion</th><th className="py-2 pr-3 text-right font-bold">Quiz takers</th><th className="py-2 pr-3 text-right font-bold">Pass rate</th><th className="py-2 text-right font-bold">Attempts</th>
              </tr></thead>
              <tbody>{funnel.map((r) => (
                <tr key={r.slug} className="border-b border-line/60">
                  <td className="py-2 pr-3 font-semibold">{r.title}</td>
                  <td className="tnum py-2 pr-3 text-right">{r.started}</td>
                  <td className="tnum py-2 pr-3 text-right">{r.completed}</td>
                  <td className="tnum py-2 pr-3 text-right font-bold">{r.completionPct}%</td>
                  <td className="tnum py-2 pr-3 text-right">{r.quizTakers}</td>
                  <td className="tnum py-2 pr-3 text-right font-bold">{r.quizTakers ? `${r.passRatePct}%` : "–"}</td>
                  <td className="tnum py-2 text-right">{r.attempts}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
        <p className="mt-3 text-xs text-muted">Completion is out of learners who started the topic. Pass rate is out of learners who took its quiz. <Link href="/admin/lessons" className="font-semibold text-brand hover:underline">Edit lessons</Link></p>
      </section>

      <section className="card card-pad mt-6">
        <h2 className="text-lg font-extrabold">Sign-ups, last 14 days</h2>
        {signups.length === 0 ? <div className="mt-3"><EmptyState icon="chart" title="No sign-ups in the last 14 days" /></div> : (
          <div className="mt-4 flex h-32 items-end gap-1.5" role="img" aria-label="Sign-ups per day">
            {days.map(([d, c]) => (
              <div key={d} className="flex flex-1 flex-col items-center gap-1" title={`${d}: ${c}`}>
                <div className="w-full rounded-t bg-brand/70" style={{ height: `${(c / maxDay) * 100}%`, minHeight: c ? "4px" : "0" }} />
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <List title="Most solved problems" rows={solveRows.map((r) => [pName.get(r.problemId) ?? r.problemId, r._count._all])} />
        <List title="Mistakes by type" rows={mistakeTypes.map((r) => [r.type, r._count._all])} />
        <List title="Mistakes by reason" rows={mistakeReasons.map((r) => [String(r.reason).replace(/_/g, " ").toLowerCase(), r._count._all])} />
      </div>
      <p className="mt-6 text-xs text-muted">Problem failure rates need a real code judge and are not available yet.</p>
    </>
  );
}

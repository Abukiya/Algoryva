import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { contestState, leaderboard } from "@/lib/contests";
import { startContest, markSolvedInContest } from "@/app/contests/actions";
import { Difficulty, KindBadge } from "@/components/ProblemBadge";
import { Countdown } from "@/components/Countdown";
import { SubmitButton } from "@/components/SubmitButton";
import { Callout, EmptyState } from "@/components/ui";
import { Icon } from "@/components/Icon";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const c = await db.contest.findUnique({ where: { slug: (await params).slug }, select: { title: true } });
  return { title: c?.title ?? "Contest" };
}

export default async function ContestPage({ params }: Props) {
  const contest = await db.contest.findFirst({ where: { slug: (await params).slug, status: "PUBLISHED" }, include: { problems: { orderBy: { position: "asc" }, include: { problem: true } } } });
  if (!contest) notFound();
  const user = await getCurrentUser();
  const state = await contestState(contest.id, contest.durationMin, user?.id);
  const solvedIds = state.started ? new Set((await db.contestSolve.findMany({ where: { entryId: state.entry.id }, select: { problemId: true } })).map((s) => s.problemId)) : new Set<string>();
  const board = await leaderboard(contest.id);
  const total = contest.problems.length;
  const finished = state.started && !state.running;

  const standings = (
    <section aria-labelledby="standings" className="card overflow-hidden">
      <h2 id="standings" className="border-b border-line px-5 py-3 text-lg font-extrabold">Standings</h2>
      {board.length === 0 ? <div className="p-5"><p className="text-sm text-soft">No one has entered yet. The first entry sets the pace.</p></div> : (
        <div className="overflow-x-auto"><table className="table-clean"><thead><tr><th className="w-12">#</th><th>User</th><th className="text-right">Solved</th><th className="text-right">Penalty</th></tr></thead>
          <tbody>{board.map((r, i) => { const me = user?.username === r.name; return (
            <tr key={r.name} className={me ? "bg-brand/[.06]" : ""}><td className="tnum font-bold">{i < 3 ? <span className={["text-lv3", "text-muted", "text-lv4"][i]}>{i + 1}</span> : i + 1}</td><td className="font-semibold">{r.name}{me && <span className="chip chip-brand ml-2">you</span>}</td><td className="tnum text-right font-bold">{r.solved}</td><td className="tnum text-right text-muted">{r.penaltyMin}m</td></tr>); })}</tbody></table></div>)}
    </section>
  );

  return (
    <div className="page">
      <Link href="/contests" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-fg"><Icon name="arrowLeft" size={14} />All contests</Link>
      <header className="mb-8">
        <h1 className="text-3xl font-extrabold sm:text-5xl">{contest.title}</h1>
        <p className="mt-2 max-w-2xl text-soft">{contest.description || `${contest.durationMin} minutes, ${total} problems.`}</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-6">
          {!user ? <Callout title="Log in to enter"><Link className="font-bold text-brand" href="/login">Log in</Link> to start this contest. You can see the standings without an account.</Callout>
            : !state.started ? (
              <section className="card card-pad" aria-labelledby="lobby">
                <h2 id="lobby" className="text-2xl font-extrabold">Ready when you are</h2>
                <ul className="mt-4 grid gap-3 sm:grid-cols-3">
                  <li className="well p-4"><p className="text-xs font-semibold text-muted">Duration</p><p className="tnum text-2xl font-extrabold">{contest.durationMin} min</p></li>
                  <li className="well p-4"><p className="text-xs font-semibold text-muted">Problems</p><p className="tnum text-2xl font-extrabold">{total}</p></li>
                  <li className="well p-4"><p className="text-xs font-semibold text-muted">Ranking</p><p className="text-sm font-bold">Most solved, then lowest penalty</p></li>
                </ul>
                <p className="mt-4 text-sm text-soft">Problems are revealed when you start, and the timer cannot be paused. Penalty is the total minutes from your start to each solve.</p>
                <form action={startContest} className="mt-5"><input type="hidden" name="contestId" value={contest.id} /><SubmitButton className="btn btn-primary btn-lg" pendingLabel="Starting">Start the {contest.durationMin} minute timer<Icon name="arrowRight" size={18} /></SubmitButton></form>
              </section>
            ) : (
              <section aria-labelledby="problems">
                <div className="mb-3 flex items-center justify-between"><h2 id="problems" className="text-xl font-extrabold">Problems</h2><span className="tnum chip chip-ok">{solvedIds.size} of {total} solved</span></div>
                {finished && <div className="mb-4"><Callout tone="ok" title="Contest complete">You solved {solvedIds.size} of {total}. Upsolve what is left below: solving now will not change your standing, but it will teach you the idea.</Callout></div>}
                <ul className="card divide-y divide-line overflow-hidden">{contest.problems.map((cp, i) => {
                  const done = solvedIds.has(cp.problemId);
                  return (
                    <li key={cp.problemId} className="p-4">
                      <div className="flex items-center gap-4">
                        <span className={`tnum grid h-10 w-10 shrink-0 place-items-center rounded-xl font-mono text-base font-extrabold ${done ? "animate-pop bg-ok text-white" : "bg-sunken text-soft"}`}>{done ? <Icon name="check" size={18} strokeWidth={3} /> : cp.label ?? String.fromCharCode(65 + i)}</span>
                        <div className="min-w-0 flex-1"><Link href={`/problems/${cp.problem.slug}`} className="block truncate font-bold hover:text-brand">{cp.problem.title}</Link><span className="mt-0.5 flex items-center gap-3"><Difficulty value={cp.problem.difficulty} /><KindBadge kind={cp.problem.kind} source={cp.problem.source} /></span></div>
                        {state.running && !done && cp.problem.kind === "EXTERNAL" && (
                          <form action={markSolvedInContest}><input type="hidden" name="contestId" value={contest.id} /><input type="hidden" name="problemId" value={cp.problemId} /><SubmitButton className="btn btn-secondary btn-sm" pendingLabel="Saving">Mark solved</SubmitButton></form>)}
                        {(!state.running || done) && <Link href={`/problems/${cp.problem.slug}`} className="btn btn-quiet btn-sm">{done ? "Review" : "Upsolve"}</Link>}
                      </div>
                      {state.running && !done && cp.problem.kind === "EXTERNAL" && <p className="ml-14 mt-1 text-xs text-muted">Self-reported: solve it on {cp.problem.source}, then mark it here.</p>}
                    </li>);
                })}</ul>
              </section>
            )}
          {board.length === 0 && state.started && <EmptyState icon="trophy" title="You are the first on the board" />}
        </div>
        <div className="space-y-6">
          {state.started && <Countdown endsAtIso={state.endsAt.toISOString()} totalMin={contest.durationMin} />}
          {standings}
        </div>
      </div>
    </div>
  );
}

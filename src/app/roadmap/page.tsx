import type { Metadata } from "next";
import Link from "next/link";
import { LEVELS, TOPICS } from "@/lib/curriculum";
import { LEVEL_META } from "@/lib/levels";
import { getCurrentUser } from "@/lib/auth/session";
import { getCompletedSlugs } from "@/lib/progress";
import { topicStates } from "@/lib/topic-state";
import { TopicCard } from "@/components/TopicCard";
import { PageHeader, ProgressBar, Callout } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { isComplete } from "@/content/lessons-v2";

export const metadata: Metadata = { title: "Roadmap" };
export const dynamic = "force-dynamic";

export default async function Roadmap() {
  const user = await getCurrentUser();
  const completed = user ? await getCompletedSlugs(user.id) : new Set<string>();
  const states = topicStates(completed, !user);
  const live = TOPICS.filter((t) => t.status === "PUBLISHED");
  const done = live.filter((t) => completed.has(t.slug)).length;
  const current = TOPICS.find((t) => states.get(t.slug) === "current");

  return (
    <div className="page">
      <PageHeader title="Roadmap" lead="Beginner to expert. Every topic sits on top of the ones it needs, so follow the line down. A topic marked Outline has practice and key ideas; a Full lesson also has visuals, worked problems and a mastery check."
        actions={user && current ? <Link href={`/learn/${current.slug}`} className="btn btn-primary">Continue: {current.title}<Icon name="arrowRight" size={16} /></Link> : <Link href="/register" className="btn btn-primary">Track my progress</Link>} />
      {user && <div className="card card-pad mb-8 flex flex-wrap items-center gap-x-8 gap-y-3">
        <p className="tnum text-3xl font-extrabold">{done}<span className="text-lg font-semibold text-muted"> / {live.length}</span></p>
        <div className="min-w-48 flex-1"><p className="mb-1.5 text-sm font-semibold text-soft">Topics completed</p><ProgressBar value={done} max={live.length} label="Roadmap progress" /></div>
      </div>}
      {!user && <div className="mb-8"><Callout title="You are viewing the roadmap as a guest">Log in to see which topics you have finished and which one is next.</Callout></div>}

      <ol className="relative space-y-12">
        {/* the spine */}
        <span aria-hidden="true" className="absolute bottom-4 left-[15px] top-4 hidden w-0.5 bg-gradient-to-b from-lv1 via-lv3 to-lv6 opacity-30 sm:block" />
        {LEVELS.map((level) => {
          const topics = TOPICS.filter((t) => t.level === level);
          const ready = topics.filter((t) => t.status === "PUBLISHED");
          const d = ready.filter((t) => completed.has(t.slug)).length;
          const m = LEVEL_META[level];
          const finished = ready.length > 0 && d === ready.length;
          return (
            <li key={level} className="relative sm:pl-12" aria-labelledby={`lv-${level}`}>
              <span aria-hidden="true" className="absolute left-0 top-0.5 hidden h-8 w-8 place-items-center rounded-full border-4 border-bg text-white sm:grid" style={{ background: `rgb(var(--lv${m.n}))` }}>{finished ? <Icon name="check" size={16} strokeWidth={2.6} /> : <span className="text-xs font-extrabold">{LEVELS.indexOf(level) + 1}</span>}</span>
              <div className="mb-4 flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
                <div><h2 id={`lv-${level}`} className="text-2xl font-extrabold" style={{ color: `rgb(var(--lv${m.n}))` }}>{m.label}</h2><p className="text-sm text-soft">{m.blurb}</p>{ready.length > 0 && <p className="mt-1 text-xs font-semibold text-muted">{ready.filter((t) => isComplete(t.slug)).length} of {ready.length} topics have a full lesson with visuals and a mastery check; the rest are outlines with practice.</p>}</div>
                {ready.length > 0 && <div className="w-40"><p className="tnum mb-1 text-right text-xs font-semibold text-muted">{d} of {ready.length}</p><ProgressBar value={d} max={ready.length} label={`${m.label} progress`} color={`rgb(var(--lv${m.n}))`} /></div>}
              </div>
              <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {topics.map((t) => <li key={t.slug}><TopicCard topic={t} state={states.get(t.slug)!} /></li>)}
              </ul>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

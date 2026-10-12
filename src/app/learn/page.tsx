import type { Metadata } from "next";
import Link from "next/link";
import { LEVELS, TOPICS } from "@/lib/curriculum";
import { LEVEL_META } from "@/lib/levels";
import { getCurrentUser } from "@/lib/auth/session";
import { getCompletedSlugs } from "@/lib/progress";
import { topicStates, readMinutes } from "@/lib/topic-state";
import { TopicCard } from "@/components/TopicCard";
import { PageHeader } from "@/components/ui";
import { Icon } from "@/components/Icon";

export const metadata: Metadata = { title: "Learn" };
export const dynamic = "force-dynamic";

export default async function Learn() {
  const user = await getCurrentUser();
  const completed = user ? await getCompletedSlugs(user.id) : new Set<string>();
  const states = topicStates(completed, !user);
  const current = TOPICS.find((t) => states.get(t.slug) === "current");
  const mins = current ? readMinutes(current.slug) : null;
  return (
    <div className="page">
      <PageHeader title="Curriculum" lead="Lessons grouped by level. Open any topic to read it; completing one unlocks what depends on it."
        actions={<Link href="/roadmap" className="btn btn-secondary"><Icon name="route" size={16} />See it as a map</Link>} />
      {current && (
        <Link href={`/learn/${current.slug}`} className="card card-link mb-10 flex flex-wrap items-center gap-4 border-brand/40 bg-brand/[.05] p-5">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand text-brand-fg"><Icon name="play" size={20} /></span>
          <span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-brand">{user ? "Continue where you left off" : "Start here"}</span>
            <span className="block text-xl font-extrabold">{current.title}</span><span className="text-sm text-soft">{LEVEL_META[current.level].label}{mins ? `, about ${mins} min` : ""}</span></span>
          <span className="btn btn-primary">Open lesson<Icon name="arrowRight" size={16} /></span>
        </Link>
      )}
      <div className="space-y-12">
        {LEVELS.map((level) => (
          <section key={level} aria-labelledby={`l-${level}`}>
            <div className="mb-4 flex items-center gap-3"><span className="h-3 w-3 rounded-full" style={{ background: `rgb(var(--lv${LEVEL_META[level].n}))` }} aria-hidden="true" /><h2 id={`l-${level}`} className="text-xl font-extrabold">{LEVEL_META[level].label}</h2><span className="h-px flex-1 bg-line" /></div>
            <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{TOPICS.filter((t) => t.level === level).map((t) => <li key={t.slug}><TopicCard topic={t} state={states.get(t.slug)!} compact /></li>)}</ul>
          </section>
        ))}
      </div>
    </div>
  );
}

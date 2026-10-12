import type { Metadata } from "next";
import Link from "next/link";
import { MIN_QUERY, normalizeQuery, searchLessons, searchTopics } from "@/lib/search";
import { searchProblems } from "@/lib/problems";
import { isComplete } from "@/content/lessons-v2";
import { Difficulty, KindBadge } from "@/components/ProblemBadge";
import { EmptyState, PageHeader } from "@/components/ui";
import { Icon, type IconName } from "@/components/Icon";
import type { ReactNode } from "react";

export const metadata: Metadata = { title: "Search" };
export const dynamic = "force-dynamic";

const Group = ({ icon, title, count, children }: { icon: IconName; title: string; count: number; children: ReactNode }) => (
  <section className="mt-8"><h2 className="mb-2 flex items-center gap-2 text-sm font-extrabold text-soft"><Icon name={icon} size={16} />{title}<span className="chip">{count}</span></h2><ul className="card divide-y divide-line overflow-hidden">{children}</ul></section>
);
const row = "flex items-center justify-between gap-3 px-4 py-3 hover:bg-sunken";

export default async function Search({ searchParams }: { searchParams: Promise<{ q?: string | string[] }> }) {
  const raw = (await searchParams).q;
  const q = normalizeQuery(Array.isArray(raw) ? raw[0] : raw ?? "");
  const valid = q.length >= MIN_QUERY;
  const [topics, lessons, problems] = valid ? [searchTopics(q), searchLessons(q), await searchProblems(q)] : [[], [], []];
  const none = valid && topics.length + lessons.length + problems.length === 0;
  return (
    <div className="page max-w-3xl">
      <PageHeader title="Search" />
      <form action="/search" role="search" className="flex gap-2"><span className="relative flex-1"><Icon name="search" size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" /><input name="q" defaultValue={q} maxLength={100} autoFocus aria-label="Search topics, lessons and problems" placeholder="binary search, prefix sum, graphs" className="input h-12 pl-10 text-base" /></span><button className="btn btn-primary h-12 px-5">Search</button></form>
      {!valid && <div className="mt-8"><EmptyState icon="search" title="Search everything in one place">Type at least {MIN_QUERY} characters to search topics, concepts inside lessons, and problems. Each result says what kind of resource it is.</EmptyState></div>}
      {none && <div className="mt-8"><EmptyState icon="search" title={`Nothing found for “${q}”`} action={<Link href="/learn" className="btn btn-secondary">Browse the curriculum</Link>}>Check the spelling, or try a shorter term like “graph”.</EmptyState></div>}
      {topics.length > 0 && <Group icon="route" title="Topics" count={topics.length}>{topics.map((t) => <li key={t.slug}><Link className={row} href={`/learn/${t.slug}`}><span className="font-bold">{t.title}</span><span className={`chip shrink-0 ${t.status === "PUBLISHED" ? "" : "opacity-70"}`}>{t.status === "COMING_SOON" ? "Planned topic" : isComplete(t.slug) ? "Full lesson" : "Topic"}</span></Link></li>)}</Group>}
      {lessons.length > 0 && <Group icon="book" title="Lessons" count={lessons.length}>{lessons.map((l) => <li key={l.slug}><Link className={row} href={`/learn/${l.slug}${l.anchor ? `#${l.anchor}` : ""}`}><span className="min-w-0"><span className="font-bold">{l.title}</span><span className="ml-2 text-sm text-muted">in “{l.heading}”</span></span><span className={`chip shrink-0 ${l.complete ? "chip-ok" : ""}`}>{l.complete ? "Full lesson" : "Outline"}</span></Link></li>)}</Group>}
      {problems.length > 0 && <Group icon="code" title="Problems" count={problems.length}>{problems.map((p) => <li key={p.id}><Link className={row} href={`/problems/${p.slug}`}><span className="min-w-0 truncate font-bold">{p.title}</span><span className="flex shrink-0 items-center gap-3"><Difficulty value={p.difficulty} /><KindBadge kind={p.kind} source={p.source} /></span></Link></li>)}</Group>}
    </div>
  );
}

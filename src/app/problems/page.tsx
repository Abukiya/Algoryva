import type { Metadata } from "next";
import Link from "next/link";
import type { Difficulty as Diff } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth/session";
import { listProblems } from "@/lib/problems";
import { TOPICS, bySlug } from "@/lib/curriculum";
import { PLATFORMS } from "@/lib/url";
import { Difficulty, KindBadge } from "@/components/ProblemBadge";
import { EmptyState, PageHeader } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { SolvedCheckbox } from "@/components/SolvedCheckbox";

export const metadata: Metadata = { title: "Problems" };
export const dynamic = "force-dynamic";

const DIFFS = ["EASY", "MEDIUM", "HARD", "EXPERT"] as const;
const SORTS = [["default", "Curriculum order"], ["easiest", "Easiest first"], ["hardest", "Hardest first"], ["title", "Title A-Z"]] as const;
type Sort = (typeof SORTS)[number][0];
type SP = Promise<Record<string, string | string[] | undefined>>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function Problems({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const user = await getCurrentUser();
  const q = one(sp.q).trim().slice(0, 100);
  const topic = bySlug.has(one(sp.topic)) ? one(sp.topic) : "";
  const difficulty = (DIFFS as readonly string[]).includes(one(sp.difficulty)) ? (one(sp.difficulty) as Diff) : undefined;
  const platform = ["original", "external", ...PLATFORMS].includes(one(sp.platform)) ? one(sp.platform) : "";
  const sort = (SORTS.map((x) => x[0]) as string[]).includes(one(sp.sort)) ? (one(sp.sort) as Sort) : "default";
  const status = user && (one(sp.status) === "solved" || one(sp.status) === "unsolved") ? (one(sp.status) as "solved" | "unsolved") : undefined;
  const page = Math.max(1, parseInt(one(sp.page)) || 1);
  const { items, total, solved, pages } = await listProblems({ q: q || undefined, topic: topic || undefined, difficulty, platform: platform || undefined, status, sort, page }, user?.id);

  const href = (over: Record<string, string>, resetPage = true) => {
    const cur: Record<string, string> = { q, topic, difficulty: difficulty ?? "", platform, status: status ?? "", sort: sort === "default" ? "" : sort, ...over };
    const u = new URLSearchParams();
    Object.entries(cur).forEach(([k, v]) => { if (v) u.set(k, v); });
    if (!resetPage && over.page) u.set("page", over.page);
    const s = u.toString();
    return `/problems${s ? `?${s}` : ""}`;
  };
  const isExternal = !!platform && platform !== "original";
  const filtered = !!(q || topic || difficulty || status || sort !== "default");
  const tabs = [["", "All"], ["original", "Original"]] as const;

  return (
    <div className="page">
      <PageHeader title="Problems" lead="Original problems are hosted and checked here. External practice opens on its own platform; statements are never copied." />

      {/* The two kinds of practice, as the primary switch */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <nav className="tabs" aria-label="Problem source">
          {tabs.map(([v, l]) => <Link key={v} href={href({ platform: v })} aria-current={platform === v ? "page" : undefined} className="tab">{v === "original" && <Icon name="code" size={14} />}{l}</Link>)}
          <Link href={href({ platform: isExternal ? platform : "external" })} aria-current={isExternal ? "page" : undefined} className="tab"><Icon name="arrowUpRight" size={14} />External</Link>
        </nav>
        {isExternal && <div className="flex flex-wrap gap-1.5" role="group" aria-label="External platform"><Link href={href({ platform: "external" })} aria-current={platform === "external" ? "true" : undefined} className={`chip ${platform === "external" ? "chip-brand" : ""}`}>All</Link>{PLATFORMS.map((p) => <Link key={p} href={href({ platform: p })} aria-current={platform === p ? "true" : undefined} className={`chip capitalize ${platform === p ? "chip-brand" : ""}`}>{p}</Link>)}</div>}
      </div>

      <form role="search" aria-label="Filter problems" className="card mb-6 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.4fr)_1fr_1fr_1fr_1fr_auto]">
        {platform && <input type="hidden" name="platform" value={platform} />}
        <label className="block"><span className="label">Title</span><span className="relative block"><Icon name="search" size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" /><input name="q" defaultValue={q} placeholder="Search by title" maxLength={100} className="input pl-9" /></span></label>
        <label className="block"><span className="label">Topic</span><select name="topic" defaultValue={topic} className="input"><option value="">All topics</option>{TOPICS.filter((t) => t.status === "PUBLISHED").map((t) => <option key={t.slug} value={t.slug}>{t.title}</option>)}</select></label>
        <label className="block"><span className="label">Difficulty</span><select name="difficulty" defaultValue={difficulty ?? ""} className="input"><option value="">Any</option>{DIFFS.slice(0, 3).map((d) => <option key={d} value={d}>{d.charAt(0) + d.slice(1).toLowerCase()}</option>)}</select></label>
        {user ? <label className="block"><span className="label">Status</span><select name="status" defaultValue={status ?? ""} className="input"><option value="">All</option><option value="solved">Solved</option><option value="unsolved">Unsolved</option></select></label> : <div className="hidden lg:block" />}
        <label className="block"><span className="label">Sort</span><select name="sort" defaultValue={sort} className="input">{SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
        <div className="flex items-end gap-2"><button className="btn btn-primary"><Icon name="filter" size={15} />Apply</button>{(filtered || platform) && <Link href="/problems" className="btn btn-quiet">Clear</Link>}</div>
      </form>

      <p className="tnum mb-3 text-sm font-semibold text-soft" aria-live="polite">{total} problem{total === 1 ? "" : "s"}{user && solved.size > 0 ? `, ${solved.size} solved on this page` : ""}</p>
      {items.length === 0 ? (
        <EmptyState icon="search" title="No problems match these filters" action={<Link href="/problems" className="btn btn-secondary">Clear filters</Link>}>Try a broader topic, or remove the difficulty filter.</EmptyState>
      ) : (
        <ul className="card divide-y divide-line overflow-hidden">
          {items.map((p) => {
            const done = solved.has(p.id);
            const external = p.kind === "EXTERNAL";
            // External problems open on their own site in a new tab. The URL was normalised to a supported https host on save.
            const ext = external && p.externalUrl?.startsWith("https://") ? p.externalUrl : null;
            const titleText = <span className="block truncate font-bold group-hover:text-brand">{p.title}</span>;
            return (
              <li key={p.id} className="group flex items-center gap-3 px-4 py-3 transition hover:bg-sunken/70 sm:gap-4">
                <SolvedCheckbox problemId={p.id} title={p.title} checked={done} external={external} signedIn={!!user} />
                <div className="min-w-0 flex-1">
                  {ext ? (
                    <a href={ext} target="_blank" rel="noopener noreferrer" className="flex min-w-0 items-center gap-1.5">
                      {titleText}
                      <Icon name="external" size={13} className="shrink-0 text-muted" />
                      <span className="sr-only">(opens {p.source} in a new tab)</span>
                    </a>
                  ) : (
                    <Link href={`/problems/${p.slug}`} className="block min-w-0">{titleText}</Link>
                  )}
                  <span className="mt-0.5 flex flex-wrap gap-x-2 text-xs text-muted">{p.topics.slice(0, 3).map((t) => <span key={t.topic.slug}>{t.topic.title}</span>)}</span>
                </div>
                <span className="hidden w-24 sm:block"><Difficulty value={p.difficulty} /></span>
                <span className="flex shrink-0 flex-col items-end gap-1 sm:block"><span className="sm:hidden"><Difficulty value={p.difficulty} /></span><KindBadge kind={p.kind} source={p.source} /></span>
              </li>
            );
          })}
        </ul>)}
      {pages > 1 && (
        <nav aria-label="Pagination" className="mt-6 flex items-center justify-between">
          {page > 1 ? <Link className="btn btn-secondary btn-sm" href={href({ page: String(page - 1) }, false)}><Icon name="arrowLeft" size={14} />Previous</Link> : <span />}
          <span className="tnum text-sm text-muted">Page {page} of {pages}</span>
          {page < pages ? <Link className="btn btn-secondary btn-sm" href={href({ page: String(page + 1) }, false)}>Next<Icon name="arrowRight" size={14} /></Link> : <span />}
        </nav>)}
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { LEVELS, TOPICS } from "@/lib/curriculum";
import { LEVEL_META } from "@/lib/levels";
import { getCurrentUser } from "@/lib/auth/session";
import { HeroGraph } from "@/components/landing/HeroGraph";
import { Icon, type IconName } from "@/components/Icon";
import { AlgoryvaLogo } from "@/components/brand/AlgoryvaLogo";
import { BRAND } from "@/lib/brand";
import { ThemeToggle } from "@/components/shell/ThemeToggle";

export const metadata: Metadata = {
  title: { absolute: BRAND.title },
  description: BRAND.description,
  alternates: { canonical: "/" },
  openGraph: { title: BRAND.title, description: BRAND.description, url: "/", siteName: BRAND.name, type: "website" },
  twitter: { card: "summary_large_image", title: BRAND.title, description: BRAND.description },
};

const STEPS: { icon: IconName; title: string; body: string }[] = [
  { icon: "book", title: "Learn one idea at a time", body: "Short lessons with worked examples, complexity, common mistakes and a step-through visualizer. Each topic lists what has to come first." },
  { icon: "code", title: "Practice what you just learned", body: "Original problems are solved and checked here. External practice links open on LeetCode, Codeforces and friends, matched to the topic." },
  { icon: "timer", title: "Race your own clock", body: "Virtual contests start when you do. Your timer, your penalty, and a standings table to compare against." },
  { icon: "refresh", title: "Review before you forget", body: "Finished topics return on a 1, 3, 7, 14 and 30 day ladder. Log every mistake once and see which kinds keep repeating." },
];

export default async function Home() {
  const user = await getCurrentUser();
  const live = TOPICS.filter((t) => t.status === "PUBLISHED");
  return (
    <div className="min-h-dvh overflow-x-clip">
      <header className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-4 sm:px-6 lg:px-10">
        <AlgoryvaLogo href="/" size={32} priority />
        <nav aria-label="Site" className="ml-auto flex items-center gap-1.5">
          <Link href="/roadmap" className="btn btn-quiet btn-sm hidden sm:inline-flex">Roadmap</Link>
          <Link href="/problems" className="btn btn-quiet btn-sm hidden sm:inline-flex">Problems</Link>
          <span className="max-[300px]:hidden"><ThemeToggle /></span>
          {user ? <Link href="/dashboard" className="btn btn-primary btn-sm">Open dashboard</Link> : <><Link href="/login" className="btn btn-secondary btn-sm">Log in</Link><Link href="/register" className="btn btn-primary btn-sm hidden sm:inline-flex">Sign up</Link></>}
        </nav>
      </header>

      {/* Hero: the curriculum graph is the product, so it is the picture. */}
      <section className="relative">
        <div aria-hidden="true" className="grid-paper grid-fade pointer-events-none absolute inset-0 -z-10 opacity-70" />
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-16 pt-8 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:px-10 lg:pb-24 lg:pt-14">
          <div>
            <p className="chip chip-brand mb-5"><Icon name="route" size={13} />{live.length} topics live, {TOPICS.length - live.length} planned</p>
            <h1 className="display text-[2.6rem] sm:text-6xl lg:text-[4.25rem]">Start at print(). Finish at contest problems.</h1>
            <p className="mt-6 max-w-xl text-lg text-soft">Algoryva is a curriculum where every topic knows its prerequisites, so you never wonder what to learn next. Read the lesson, solve matched problems, then prove it under a timer.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={user ? "/dashboard" : "/register"} className="btn btn-primary btn-lg">{user ? "Continue learning" : "Start the roadmap"}<Icon name="arrowRight" size={18} /></Link>
              <Link href="/learn" className="btn btn-secondary btn-lg">Browse lessons</Link>
            </div>
            <p className="mt-4 text-sm text-muted">Free. No editor to install: lessons are Python-first.</p>
          </div>
          <div className="rounded-[1.75rem] border border-line bg-surface/80 p-3 shadow-e3 backdrop-blur sm:p-5"><HeroGraph /></div>
        </div>
      </section>

      {/* How the loop works: a true sequence, so it is numbered. */}
      <section className="border-y border-line bg-surface/60">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-10 lg:py-20">
          <h2 className="max-w-2xl text-3xl font-extrabold sm:text-4xl">One loop, repeated until problems feel familiar</h2>
          <ol className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <li key={s.title} className="card card-pad relative">
                <span className="tnum absolute right-4 top-4 font-mono text-sm font-bold text-line-strong">{i + 1}</span>
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand/10 text-brand"><Icon name={s.icon} /></span>
                <h3 className="mt-4 text-lg font-bold">{s.title}</h3>
                <p className="mt-1.5 text-sm text-soft">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Levels: colour warms as the curriculum gets harder. */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-10 lg:py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="max-w-xl text-3xl font-extrabold sm:text-4xl">Six levels, cool to hot</h2>
          <Link href="/roadmap" className="btn btn-secondary">See the full roadmap<Icon name="arrowRight" size={16} /></Link>
        </div>
        <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {LEVELS.map((l) => {
            const all = TOPICS.filter((t) => t.level === l), ready = all.filter((t) => t.status === "PUBLISHED").length;
            return (
              <li key={l} className="card card-pad" style={{ borderTop: `3px solid rgb(var(--lv${LEVEL_META[l].n}))` }}>
                <div className="flex items-baseline justify-between"><h3 className="text-lg font-bold">{LEVEL_META[l].label}</h3><span className="tnum text-sm font-semibold text-muted">{ready ? `${ready} of ${all.length} live` : "Planned"}</span></div>
                <p className="mt-1.5 text-sm text-soft">{LEVEL_META[l].blurb}</p>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Original vs external, stated plainly. */}
      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6 lg:px-10 lg:pb-20">
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="card card-pad border-brand/30 bg-brand/[.04]">
            <span className="chip chip-brand"><Icon name="code" size={12} />Original</span>
            <h3 className="mt-3 text-xl font-bold">Problems written for this platform</h3>
            <p className="mt-1.5 text-soft">Full statement, sample tests and hidden tests. Submit your output and get a verdict per test, right here.</p>
          </div>
          <div className="card card-pad">
            <span className="chip"><Icon name="arrowUpRight" size={12} />External practice</span>
            <h3 className="mt-3 text-xl font-bold">Curated links to the classics</h3>
            <p className="mt-1.5 text-soft">Statements stay on their own sites. You solve there, then mark it solved here to keep your streak and progress honest.</p>
          </div>
        </div>
        <div className="mt-12 flex flex-col items-start gap-4 rounded-[1.5rem] bg-fg p-8 text-bg sm:flex-row sm:items-center sm:justify-between sm:p-10">
          <div><h2 className="text-2xl font-extrabold sm:text-3xl">Your first topic takes about ten minutes.</h2><p className="mt-1 opacity-70">Tell us what you already know and we skip the rest.</p></div>
          <Link href={user ? "/dashboard" : "/register"} className="btn btn-lg shrink-0 bg-bg text-fg hover:opacity-90">{user ? "Go to dashboard" : "Create a free account"}</Link>
        </div>
      </section>
      <footer className="flex flex-col items-center gap-2 border-t border-line px-4 py-8 text-center text-sm text-muted"><AlgoryvaLogo href="/" size={24} /><p>Built for people who want to get good at algorithms.</p></footer>
    </div>
  );
}

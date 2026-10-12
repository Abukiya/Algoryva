import type { ReactNode } from "react";
import Link from "next/link";
import { AlgoryvaLogo } from "@/components/brand/AlgoryvaLogo";
import { Icon } from "@/components/Icon";
import { HeroGraph } from "@/components/landing/HeroGraph";
import { TOPICS } from "@/lib/curriculum";
import { ThemeToggle } from "@/components/shell/ThemeToggle";

/**
 * Shared frame for login, sign up, password reset, verify email and onboarding. It uses the landing page's layout:
 * the same header, the same grid-paper hero with a display headline on the left, and the landing page's curriculum graph on the right
 * in the same card. `current` hides the header button for the page you are already on.
 */
export function AuthFrame({ title, lead, children, footer, current }: { title: string; lead?: string; children: ReactNode; footer?: ReactNode; current?: "login" | "register" }) {
  const live = TOPICS.filter((t) => t.status === "PUBLISHED").length;
  return (
    <div className="min-h-dvh overflow-x-clip">
      <header className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-4 sm:px-6 lg:px-10">
        <AlgoryvaLogo href="/" size={32} priority />
        <nav aria-label="Site" className="ml-auto flex items-center gap-1.5">
          <Link href="/roadmap" className="btn btn-quiet btn-sm hidden sm:inline-flex">Roadmap</Link>
          <Link href="/problems" className="btn btn-quiet btn-sm hidden sm:inline-flex">Problems</Link>
          <span className="max-[300px]:hidden"><ThemeToggle /></span>
          {current !== "login" && <Link href="/login" className="btn btn-secondary btn-sm">Log in</Link>}
          {current !== "register" && <Link href="/register" className="btn btn-primary btn-sm hidden sm:inline-flex">Sign up</Link>}
        </nav>
      </header>

      <section className="relative">
        <div aria-hidden="true" className="grid-paper grid-fade pointer-events-none absolute inset-0 -z-10 opacity-70" />
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-16 pt-8 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:px-10 lg:pb-24 lg:pt-14">
          <main className="min-w-0">
            <p className="chip chip-brand mb-5"><Icon name="route" size={13} />{live} topics live, {TOPICS.length - live} planned</p>
            <h1 className="display text-[2.6rem] sm:text-6xl lg:text-[4.25rem]">{title}</h1>
            {lead && <p className="mt-6 max-w-xl text-lg text-soft">{lead}</p>}
            <div className="mt-8 max-w-md rounded-[1.75rem] border border-line bg-surface/80 p-5 shadow-e3 backdrop-blur sm:p-7">{children}</div>
            {footer && <div className="mt-6 text-sm text-soft">{footer}</div>}
          </main>

          <aside aria-label="The curriculum" className="hidden min-w-0 lg:block">
            <div className="rounded-[1.75rem] border border-line bg-surface/80 p-3 shadow-e3 backdrop-blur sm:p-5"><HeroGraph /></div>
            <p className="mt-4 text-sm text-soft">Every topic knows what it needs. You always know what is next.</p>
          </aside>
        </div>
      </section>

      <footer className="flex flex-col items-center gap-2 border-t border-line px-4 py-8 text-center text-sm text-muted">
        <AlgoryvaLogo href="/" size={24} />
        <p>Built for people who want to get good at algorithms.</p>
      </footer>
    </div>
  );
}

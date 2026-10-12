"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Icon, type IconName } from "@/components/Icon";
import { AlgoryvaLogo } from "@/components/brand/AlgoryvaLogo";
import { BRAND } from "@/lib/brand";
import { ThemeToggle } from "@/components/shell/ThemeToggle";
import { OPEN_INTRO_EVENT, WelcomeTour } from "@/components/shell/WelcomeTour";

type ShellUser = { username: string; role: "USER" | "ADMIN" } | null;

const MAIN: { label: string; href: string; icon: IconName }[] = [
  { label: "Today", href: "/dashboard", icon: "home" },
  { label: "Roadmap", href: "/roadmap", icon: "route" },
  { label: "Learn", href: "/learn", icon: "book" },
  { label: "Visualizer", href: "/visualizer", icon: "play" },
  { label: "Problems", href: "/problems", icon: "code" },
  { label: "Contests", href: "/contests", icon: "trophy" },
];
const NOTEBOOK: { label: string; href: string; icon: IconName }[] = [
  { label: "Mistakes", href: "/mistakes", icon: "alert" },
  { label: "Notes", href: "/notes", icon: "note" },
];
// Routes that render bare (no app chrome): the landing page is its own composition, auth and onboarding are focused flows.
const BARE = ["/", "/login", "/register", "/forgot-password", "/reset-password", "/verify-email", "/onboarding"];

const active = (path: string, href: string) => path === href || path.startsWith(`${href}/`);

function SearchBox({ inputRef }: { inputRef?: React.RefObject<HTMLInputElement | null> }) {
  return (
    <form action="/search" role="search" className="relative w-full">
      <Icon name="search" size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
      <input ref={inputRef} name="q" type="search" placeholder="Search topics, lessons, problems" maxLength={100} aria-label="Search topics, lessons and problems" className="input h-10 pl-9 pr-9" />
      <span className="kbd pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 sm:inline-flex" aria-hidden="true">/</span>
    </form>
  );
}

/** Phone/tablet "More" sheet. Native <dialog> gives a focus trap, Escape to close and an inert page behind it. */
function MoreSheet({ user, logout, path }: { user: ShellUser; logout: () => Promise<void>; path: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const close = () => ref.current?.close();
  useEffect(() => { ref.current?.close(); }, [path]);
  const links = user
    ? [...NOTEBOOK, { label: "Profile", href: "/profile", icon: "user" as IconName }, ...(user.role === "ADMIN" ? [{ label: "Admin", href: "/admin", icon: "shield" as IconName }] : [])]
    : [];
  const moreActive = links.some((l) => active(path, l.href));
  return (
    <>
      <button type="button" onClick={() => { ref.current?.showModal(); setOpen(true); }} aria-haspopup="dialog" aria-expanded={open} aria-current={moreActive ? "page" : undefined}
        className="flex flex-col items-center gap-0.5 py-2 text-[11px] font-semibold text-muted aria-[current=page]:text-brand">
        <Icon name="menu" size={21} />More
      </button>
      <dialog ref={ref} aria-labelledby="more-title" onClose={() => setOpen(false)}
        onClick={(e) => { if (e.target === e.currentTarget) close(); }}
        className="m-0 mt-auto w-full max-w-none rounded-t-card border border-line bg-surface p-0 pb-[env(safe-area-inset-bottom)] text-fg shadow-e3 backdrop:bg-black/40 lg:hidden">
        <div className="mx-auto max-w-lg p-4">
          <div className="mb-2 flex items-center justify-between">
            <h2 id="more-title" className="text-base font-extrabold">More</h2>
            <button type="button" onClick={close} className="btn btn-quiet btn-icon" aria-label="Close"><Icon name="x" size={18} /></button>
          </div>
          {user ? (
            <>
              <ul className="grid gap-1">{links.map((l) => (
                <li key={l.href}><Link href={l.href} onClick={close} aria-current={active(path, l.href) ? "page" : undefined}
                  className="flex min-h-12 items-center gap-3 rounded-ctl px-3 text-sm font-semibold text-soft hover:bg-sunken aria-[current=page]:bg-brand/10 aria-[current=page]:text-brand"><Icon name={l.icon} size={19} />{l.label}</Link></li>))}</ul>
              <form action={logout} className="mt-2 border-t border-line pt-2"><button className="btn btn-quiet w-full justify-start"><Icon name="logout" size={16} />Log out</button></form>
            </>
          ) : (
            <div className="grid grid-cols-2 gap-2"><Link href="/login" className="btn btn-secondary">Log in</Link><Link href="/register" className="btn btn-primary">Sign up</Link></div>
          )}
        </div>
      </dialog>
    </>
  );
}

export function Shell({ user, logout, children }: { user: ShellUser; logout: () => Promise<void>; children: ReactNode }) {
  const path = usePathname();
  const search = useRef<HTMLInputElement>(null);
  // Collapsed state is applied by CSS from <html data-sidebar>; React only mirrors it for the button's label and tooltips.
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => { setCollapsed(document.documentElement.dataset.sidebar === "collapsed"); }, []);
  const toggleSidebar = () => {
    const next = !collapsed;
    if (next) document.documentElement.dataset.sidebar = "collapsed"; else delete document.documentElement.dataset.sidebar;
    try { localStorage.setItem("sidebar", next ? "collapsed" : "expanded"); } catch { /* private mode: it just won't persist */ }
    setCollapsed(next);
  };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (e.key === "/" && !e.metaKey && !e.ctrlKey && el && !/^(input|textarea|select)$/i.test(el.tagName) && !el.isContentEditable) { e.preventDefault(); search.current?.focus(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (BARE.includes(path)) return <>{children}</>;
  const inAdmin = path.startsWith("/admin");

  const Item = ({ label, href, icon }: { label: string; href: string; icon: IconName }) => (
    <Link href={href} aria-current={active(path, href) ? "page" : undefined} aria-label={label} title={collapsed ? label : undefined}
      className="sb-item group flex items-center gap-3 rounded-ctl px-3 py-2 text-sm font-semibold text-soft transition hover:bg-sunken hover:text-fg aria-[current=page]:bg-brand/10 aria-[current=page]:text-brand">
      <Icon name={icon} size={18} className="shrink-0" /><span className="sb-label">{label}</span>
    </Link>
  );

  return (
    <div className="app-shell min-h-dvh lg:grid lg:grid-cols-[var(--sb)_1fr]">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-surface focus:px-3 focus:py-2 focus:shadow-e3">Skip to content</a>

      <WelcomeTour />

      {/* Sidebar (laptop and up) */}
      <aside id="sidebar" aria-label="Sidebar" className="sticky top-0 hidden h-dvh flex-col overflow-x-hidden overflow-y-auto border-r border-line bg-surface/70 p-3 backdrop-blur lg:flex">
        <Link href={user ? "/dashboard" : "/"} aria-label={BRAND.homeLabel} title={collapsed ? BRAND.homeLabel : undefined} className="mb-4 flex items-center justify-center rounded-md py-2 sb-logo">
          <span className="sb-hide mr-auto pl-2"><AlgoryvaLogo variant="full" size={36} /></span>
          <span className="sb-show"><AlgoryvaLogo variant="mark" size={30} /></span>
        </Link>
        <nav aria-label="Main" className="flex flex-col gap-0.5">{MAIN.map((n) => <Item key={n.href} {...n} />)}</nav>
        {user && <><p className="sb-hide mb-1 mt-5 px-3 text-xs font-semibold text-muted">Notebook</p><div aria-hidden="true" className="sb-show my-3 h-px bg-line" />
          <nav aria-label="Notebook" className="flex flex-col gap-0.5">{NOTEBOOK.map((n) => <Item key={n.href} {...n} />)}</nav></>}
        {user?.role === "ADMIN" && <><p className="sb-hide mb-1 mt-5 px-3 text-xs font-semibold text-muted">Manage</p><div aria-hidden="true" className="sb-show my-3 h-px bg-line" /><Item label="Admin" href="/admin" icon="shield" /></>}
        <div className="mt-auto space-y-2 border-t border-line pt-3">
          <button type="button" onClick={() => window.dispatchEvent(new Event(OPEN_INTRO_EVENT))} aria-label="Show the intro" title={collapsed ? "Show the intro" : undefined}
            className="sb-item flex w-full items-center gap-3 rounded-ctl px-3 py-2 text-sm font-semibold text-soft transition hover:bg-sunken hover:text-fg">
            <Icon name="info" size={18} className="shrink-0" /><span className="sb-label">Intro</span>
          </button>
          <button type="button" data-tour="collapse" onClick={toggleSidebar} aria-expanded={!collapsed} aria-controls="sidebar" aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} title={collapsed ? "Expand sidebar" : undefined}
            className="sb-item flex w-full items-center gap-3 rounded-ctl px-3 py-2 text-sm font-semibold text-soft transition hover:bg-sunken hover:text-fg">
            <Icon name="panelLeft" size={18} className="shrink-0" /><span className="sb-label">Collapse</span>
          </button>
          {user ? (
            <div className="sb-stack flex items-center gap-2">
              <Link href="/profile" aria-label="Profile" title={collapsed ? user.username : undefined} aria-current={active(path, "/profile") ? "page" : undefined} className="sb-item flex min-w-0 flex-1 items-center gap-2.5 rounded-ctl px-2 py-1.5 hover:bg-sunken aria-[current=page]:bg-brand/10">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand text-sm font-extrabold text-brand-fg">{user.username.slice(0, 1).toUpperCase()}</span>
                <span className="sb-label min-w-0"><span className="block truncate text-sm font-bold">{user.username}</span><span className="block text-xs text-muted">Profile</span></span>
              </Link>
              <ThemeToggle tour="theme" />
            </div>
          ) : (
            <div className="sb-stack flex items-center gap-2"><Link href="/login" aria-label="Log in" title={collapsed ? "Log in" : undefined} className="sb-item btn btn-secondary btn-sm w-full flex-1"><Icon name="user" size={16} className="sb-icon" /><span className="sb-label">Log in</span></Link><Link href="/register" aria-label="Sign up" title={collapsed ? "Sign up" : undefined} className="sb-item btn btn-primary btn-sm w-full flex-1"><Icon name="plus" size={16} className="sb-icon" /><span className="sb-label">Sign up</span></Link><ThemeToggle tour="theme" /></div>
          )}
          {user && <form action={logout}><button aria-label="Log out" title={collapsed ? "Log out" : undefined} className="sb-item btn btn-quiet btn-sm w-full justify-start"><Icon name="logout" size={15} className="shrink-0" /><span className="sb-label">Log out</span></button></form>}
        </div>
      </aside>

      <div className="min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-line bg-bg/85 px-4 py-2.5 backdrop-blur sm:px-6 lg:px-8">
          <AlgoryvaLogo variant="responsive" size={26} href={user ? "/dashboard" : "/"} className="lg:hidden" />
          <div className="max-w-md flex-1"><SearchBox inputRef={search} /></div>
          <div className="ml-auto flex items-center gap-1 lg:hidden">
            <ThemeToggle tour="theme" />
            {user ? <Link href="/profile" className="grid h-9 w-9 place-items-center rounded-full bg-brand text-sm font-extrabold text-brand-fg" aria-label="Profile">{user.username.slice(0, 1).toUpperCase()}</Link> : <Link href="/login" className="btn btn-primary btn-sm">Log in</Link>}
          </div>
          {inAdmin && <span className="chip chip-warn ml-auto hidden lg:inline-flex">Admin mode</span>}
        </header>

        <main id="main" className="pb-24 lg:pb-0">{children}</main>
      </div>

      {/* Bottom tabs (phone and tablet). More opens the notebook links. */}
      <nav aria-label="Primary" className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        <ul className="mx-auto grid max-w-xl grid-cols-7">
          {MAIN.map((n) => (
            <li key={n.href}><Link href={n.href} aria-current={active(path, n.href) ? "page" : undefined} className="flex flex-col items-center gap-0.5 py-2 text-[11px] font-semibold text-muted aria-[current=page]:text-brand">
              <Icon name={n.icon} size={21} />{n.label}</Link></li>
          ))}
          <li className="contents"><MoreSheet user={user} logout={logout} path={path} /></li>
        </ul>
      </nav>
    </div>
  );
}

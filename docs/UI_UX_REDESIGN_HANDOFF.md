# UI/UX redesign handoff

## Pass 2 summary (read first)

**Environment limits of Pass 2.** The sandbox had no npm registry access (403), no Postgres and no browsers. Consequently Pass 2 could **not** run `npm install`, typecheck, lint, unit tests, the production build, or the Playwright suite, and could not render any page. Edits were checked only for TypeScript *syntax* errors (none). All results below marked "unverified" must be confirmed by running the commands in section 7.

**Important correction to the brief.** The Pass 2 brief refers to a "secure judging architecture" and a code editor. This codebase has neither: `lib/judge.ts` compares pasted output text and the `Submission` model is unused (section 6, item 3). Nothing was added that executes user code, and no fake editor was built. A real judge needs a separate sandboxed runner service and is a product decision, not a UI task.

### Completed in Pass 2 (all unverified at runtime)

- **Mobile navigation gap closed.** `components/shell/Shell.tsx` now has a sixth bottom-bar item, "More", that opens a bottom sheet built on native `<dialog>` (focus trap, Escape, inert background, closes on route change and on backdrop click). It holds Mistakes, Notes, Profile, Admin (admins) and Log out; guests get Log in / Sign up. Touch rows are 48px tall.
- **Problem browser.** `Filters` gained `sort` (`default | easiest | hardest | title`) and `platform: "external"` (all external problems, `kind = EXTERNAL`). The page has a Sort select, an "All" chip in the external platform row, and the External tab now lands on all external problems instead of forcing LeetCode. Sort and platform are part of the URL, so filtered views are bookmarkable.
- **Accessibility.** The problem source switch used `role="tab"` on links with no tabpanel; it is now a `<nav aria-label="Problem source">` with `aria-current`. External platform chips carry `aria-current`.
- **Bug fix.** `/mistakes?type=` is validated against `MISTAKE_TYPES`, so a bad value no longer crashes into the global error page.
- **ESLint.** Added `eslint.config.mjs` (flat config, `next/core-web-vitals` + `next/typescript`) and changed `npm run lint` to `eslint .` (the old `next lint` prompted interactively). `@eslint/eslintrc` is already in the lockfile as a dependency of eslint, so `package-lock.json` is unchanged. Expect some first-run lint findings to fix.

### Not done in Pass 2 (carried over, see section 6)

Visual QA of DB-backed routes, recommended-for-you strip on Problems, roadmap prerequisite edges and review-ladder mastery, per-problem notes/hints panel, celebration toasts, command palette, admin form restructuring (reorder, bulk actions, validation preview), contest history/solve times, screen-reader/axe audit, e2e run. Also not done: any performance measurement.

### Changed selectors to keep in mind for e2e

The Problems page no longer exposes `role="tab"` links. If a test queries tabs there, use `getByRole("link", { name: "Original" })` instead.

---

Written for the next developer or LLM continuing this work. Read this before touching any styling.

## 1. Status in one paragraph

Design system, app shell and every user-facing route plus the admin area have been redesigned and typecheck cleanly (`npm run typecheck`, `npm test`: 42/42, `npm run build`: succeeds). Backend, Prisma schema, judging, contests scoring, curriculum, recommendation, gamification and auth logic are untouched, except for the small additive changes listed in section 9. **Not yet verified visually:** every page that needs a database (dashboard, lesson page, problems list and detail, contests, mistakes, notes, profile, admin). The sandbox that produced this had no Postgres, so only pages that work without a DB were screenshotted: landing, login, roadmap and learn index, in light, dark and a 390px phone width. The DB-backed pages compile and typecheck but have never been seen rendered. **First job for the next person: run the app with a seeded DB, and look at every route (section 7).**

## 2. Redesign vision

The product is a curriculum whose spine is a dependency graph. So the identity is: **the graph is the picture**. The landing hero draws real curriculum topics as connected nodes; the roadmap is a vertical spine with level sections; topic state (done, up next, available, locked, coming soon) is shown with icon + label + border, never colour alone.

- **Colour meaning**: brand blue (royal blue from the Algoryva logo) is action and "you are here". Six level hues run cool to hot (`--lv1` teal Foundation to `--lv6` violet Expert), so difficulty is felt as warmth. Green/amber/red are only for ok/warn/bad and difficulty pips.
- **Motif**: faint grid paper (`.grid-paper`) appears only where structure is the subject (hero, auth aside, visualizer stage).
- **Type**: Bricolage Grotesque Variable (sans, self-hosted via `@fontsource-variable`) and JetBrains Mono Variable. `.display` uses width 84% and weight 800 for the landing headline.
- **Voice**: sentence case, plain verbs, actions keep one name through the flow ("Mark as complete"), errors say what to do. Empty states are invitations with an action.
- **One bold place per screen**: landing = hero graph; dashboard = the single "Learn next" card; roadmap = the spine; problem page = the solve panel.

## 3. Design system

All in `src/app/globals.css` + `tailwind.config.ts`. Do not add one-off hex colours in components.

- **Tokens**: RGB-triplet CSS variables so `bg-brand/10` works. Light ("paper") in `:root`, dark ("ink") in `:root[data-theme="dark"]`, plus a no-JS `prefers-color-scheme` fallback. Names: `bg surface sunken line line-strong fg soft muted brand brand-fg brand-soft ok warn bad lv1..lv6`. Legacy aliases `accent` and `card` still resolve so old markup does not break.
- **Theme switching**: inline script in `src/app/layout.tsx` sets `data-theme` before paint from `localStorage.theme` or the OS. `ThemeToggle` (client) flips it.
- **Elevation**: `shadow-e1/e2/e3`. Radius: `rounded-ctl` (10px controls), `rounded-card` (16px).
- **Component classes** (in `@layer components`): `.btn` (+ `-primary -secondary -quiet -danger -sm -lg -icon`), `.input` (also styles `select` and `textarea`), `.label`, `.hint`, `.field-error`, `.card`, `.card-pad`, `.card-link`, `.well`, `.chip` (+ `-brand -ok -warn -bad`), `.kbd`, `.tabs` + `.tab` (active via `aria-current="page"`, `aria-selected="true"` or `data-active`), `.table-clean`, `.skeleton`, `.bar`, `.prose-lesson`, `.code-block`, `.tok-*`, `.page` and `.page-wide` containers, `.grid-paper`, `.grid-fade`, `.display`, `.tnum`.
- **Motion**: keyframes `pop rise fillbar draw balloon shimmer beacon` in the Tailwind config. A global `prefers-reduced-motion` rule shortens all animation and transition durations to ~0. `.read-progress` (lesson scroll bar) uses CSS scroll-timeline and simply does not render where unsupported.
- **Icons**: `src/components/Icon.tsx`, one hand-authored stroke set. Add glyphs to `PATHS` there; do not add an icon library. The Algoryva logo lives in `components/brand/AlgoryvaLogo.tsx` (see `docs/ALGORYVA_BRAND_INTEGRATION.md`); the old hand-drawn `LogoMark` was removed.

## 4. Components created

| File | Purpose |
|---|---|
| `components/shell/Shell.tsx` | Client shell: sidebar (>= lg), sticky top bar with search (press `/` to focus), bottom tab bar (< lg). Renders children bare on `/`, auth routes and `/onboarding`. |
| `components/shell/ThemeToggle.tsx`, `AdminNav.tsx` | Theme button; admin section tabs |
| `components/ui.tsx` | `PageHeader EmptyState Callout Ring ProgressBar CodeBlock Stat LinkButton` (server-safe) |
| `components/Icon.tsx` | Icons |
| `components/brand/AlgoryvaLogo.tsx` | The Algoryva logo (full / mark / responsive) |
| `components/SubmitButton.tsx` | `useFormStatus` pending button for any server-action form |
| `components/CopyButton.tsx`, `Countdown.tsx` | Copy to clipboard; contest timer (client, ticks from a server-supplied deadline) |
| `components/TopicCard.tsx` | Roadmap/learn topic card with state |
| `components/ProblemBadge.tsx` | `Difficulty` (pips + word) and `KindBadge` (Original filled, External outlined) |
| `components/landing/HeroGraph.tsx` | Animated curriculum graph (pure SVG/CSS) |
| `components/auth/AuthFrame.tsx` | Shared frame for login/register/reset/verify/onboarding |
| `components/Visualizer.tsx` (restyled), `JudgeForm.tsx` (restyled), `AuthForm.tsx`, `SimpleForm.tsx` (restyled) | Behaviour and props unchanged |
| `lib/levels.ts`, `lib/topic-state.ts`, `lib/highlight.ts` (+ test) | Level presentation metadata; topic state and read time; tiny Python tokenizer for code blocks |

## 5. Routes redesigned

`/` landing, `/login`, `/register`, `/forgot-password`, `/reset-password`, `/verify-email`, `/onboarding`, `/dashboard`, `/roadmap`, `/learn`, `/learn/[slug]`, `/problems`, `/problems/[slug]`, `/contests`, `/contests/[slug]`, `/mistakes`, `/notes`, `/profile`, `/search`, `/admin` (overview), `/admin/analytics`, `/admin/problems`, `/admin/users`, `/admin/lessons`, `/admin/contests`, plus root `not-found`, `error`, `loading`, and `loading.tsx` for `/dashboard` and `/problems`.

Admin forms (`ContestForm`, `ProblemForm`, `LessonEditor`) got a class migration only (cards, `.input`, `.label`, checkbox lists). Their layout is still a single long form.

## 6. Not yet done (be specific)

1. **Visual QA of all DB-backed routes** at 390, 768, 1366 and 1920 px, light and dark. Expect small layout bugs.
2. ~~**Mobile navigation gap**~~ (fixed in Pass 2 with the More sheet): previously the bottom tab bar has 5 items (Today, Roadmap, Learn, Problems, Contests). Mistakes and Notes are reachable on phones only from the dashboard "Notebook" card, and Profile from the top-bar avatar. Add a "More" sheet or make the bar scroll.
3. **No code editor.** The platform has no execution judge: `checkOutput` compares pasted text. The redesign styles that honestly ("Check your answer") and does not fake an editor. A Monaco/CodeMirror surface is only worth adding together with a real sandboxed judge. The `Submission` model exists but is unused.
4. **Problem hints, per-problem notes, and mistakes on the problem page**: only a "Log a mistake on this problem" link (prefills `/mistakes?problem=<id>`). Inline notes/hints panel is not built.
5. **Problems browser**: there is no "all external" filter because `listProblems` filters by exact `source`. Adding `kind: "EXTERNAL"` support to `Filters` would fix it. Recommended-for-you strip not built.
6. **Roadmap**: prerequisites appear as text ("Needs ..."), not drawn edges. Mastery uses done/not-done only (the review ladder step is not surfaced). "Estimated work" is a read-time estimate from built-in lesson text only, and is absent for admin-authored lessons.
7. **Celebrations**: completion, solve and streak use `animate-pop` badges. There is no confetti/achievement toast; badges do not announce when newly earned (no earned-at timestamps exist in the schema).
8. **Contests**: no countdown-to-start (contests are virtual, so none applies). Post-contest review is "Review/Upsolve" links; there is no per-problem solve time or contest history page.
9. **Progress page**: `/profile` doubles as the progress page. There is no dedicated `/progress`. No charts over time (would need more activity aggregation).
10. **Search**: still a full page at `/search`; no command palette. The top-bar box submits to it.
11. **Admin**: no drag-to-reorder for contest problems (the existing form note about order still applies), no bulk actions, no validation preview for problems. The problem admin list gained search/status/kind filters.
12. **Accessibility pass** was not done with a screen reader or axe. Focus rings, labels, `aria-current`, `role="progressbar"`, `role="timer"` and reduced motion are in place.
13. **Playwright e2e** (`tests/e2e/journeys.spec.ts`) was **not run** (needs DB + browsers). Selectors it depends on were preserved: labels Email/Username/Password, buttons "Create account", "Continue", "Mark as complete", texts "Completed. A review is scheduled." and "Locked. Complete first", heading "Problems".
14. **ESLint**: config added in Pass 2 but never run.

## 7. How to run and check

```
cp .env.example .env
npm install
npx prisma migrate dev && npm run db:seed
npm run dev
```
Check in this order: `/dashboard` (log in first; a brand-new user has empty states), `/learn/prefix-sum`, `/problems`, `/problems/range-sum-queries` (original, has the checker) and any external problem, `/contests` and a contest (start it, then mark solved), `/mistakes`, `/notes`, `/profile`, `/admin/*` (needs an ADMIN user).

## 8. Known bugs and limitations

- Layout now reads the session cookie, so **every route is dynamic**. `/learn/[slug]` was previously statically generated (and needed a DB at build time); it now renders per request. `generateStaticParams` is still exported but has no effect. If you want static lesson pages back, move the shell's user lookup into a client-side or per-route fetch.
- Sandbox build validation used a dummy Prisma Accelerate URL because Prisma engines could not be downloaded. A normal `npm install` runs `prisma generate` via `postinstall`.
- `@types/react-dom` was missing from `devDependencies` (needed for `useFormStatus`); it is now added. Fonts: `@fontsource-variable/bricolage-grotesque` and `@fontsource-variable/jetbrains-mono` (about 80 KB total, self-hosted, no network at runtime).
- `next build` rewrote `tsconfig.json` (`allowJs`, `resolveJsonModule`); harmless.
- The highlighter is Python-only and regex-based; other languages render uncoloured. Lesson content is Python-first, so this is fine today.
- Contest and dashboard dates use UTC (streak logic already did). Users far from UTC may see a "today" that differs from their local day.

## 9. Non-visual changes made (all additive)

- `lib/problems.ts`: `Filters.q` optional title search.
- `lib/activity.ts`: new `getWeekActivity`.
- `app/mistakes/MistakeForm.tsx`: optional `defaultProblemId` prop.
- `package.json`: the three dev/runtime dependencies above.
No schema, migration, server action or API changes.

## 10. Important decisions

- Server Components everywhere except: shell, theme toggle, admin nav, visualizer, countdown, copy button, submit button, forms using `useActionState`. Client JS on the heaviest page is about 109 KB first load, 103 KB of it shared.
- Level hue and topic state live in `lib/levels.ts` and `lib/topic-state.ts`; pages never hard-code them.
- Lesson emphasis is derived from existing section headings (`/mistake/` becomes a warning card, `/idea|intuition|recognize|key/` a key-idea card), so the lesson content format and admin editor did not have to change.
- Guests see nothing locked (they have no progress); prerequisites are still shown.
- Guest routes keep working: landing, roadmap, learn, problems, contests list and standings, search.

## 11. Recommended next order

1. `npm install`, then `npm run typecheck && npm run lint && npm test && npm run build`; fix what Pass 2 could not check.
2. Run with a DB; visual QA of every route, including the new More sheet at 390px (section 6 item 1).
3. Run the e2e suite (item 13).
4. Recommended strip on Problems (item 5).
5. Roadmap prerequisite edges and mastery from review step (item 6).
6. Problem page notes/hints panel (item 4).
7. Admin: reorderable contest problems, problem validation preview (item 11).
8. Only then consider an editor, and only together with a real judge (item 3).

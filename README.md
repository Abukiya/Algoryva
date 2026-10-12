# Algoryva

A structured path from your first algorithm to contest-ready problem solving. Brand assets and usage: `docs/ALGORYVA_BRAND_INTEGRATION.md`.

_Project history: this began as the "Phase 1 foundation" scaffold; the notes below keep that history._

Next.js 15 + TypeScript + Tailwind + Prisma/PostgreSQL.

## Run
    cp .env.example .env      # set DATABASE_URL
    npm install
    npx prisma migrate dev --name init
    npm run db:seed
    npm run dev

Then: `npm run typecheck && npm run lint && npm test && npm run build`.
NOTE: this scaffold was written without network access; nothing has been installed, built, or run yet.

## What exists
- `src/lib/curriculum.ts`: 6 levels, 39 topics, prerequisite graph. Topics from the uploaded A2SV slides are PUBLISHED; topics with no source material are COMING_SOON.
- `src/lib/recommend.ts`: deterministic unlock/next-topic/review-ladder logic (+ tests).
- `prisma/schema.prisma`: topics, prerequisites, lessons/sections (per-language), unified Problem (INTERNAL/EXTERNAL), Resource (license + PRIVATE by default), progress, submissions, mistakes, spaced review.
- Pages: `/`, `/learn`, `/learn/[slug]`, `/roadmap` (currently read from `curriculum.ts`; DB is seeded from it).

## Not built yet
Authentication, admin CMS, lesson content, problem browser, code editor/judge, contests, dashboard, search, visualizations. The A2SV PDFs are NOT included; keep them private until redistribution permission is confirmed.

## Auth (added)
Email/password registration and login, scrypt password hashing, DB-backed sessions (hashed token, httpOnly cookie), server-side `requireUser`/`requireAdmin` guards. `/admin` is admin-only.
To create the first admin: register, then run `npx prisma studio` and set your user's `role` to ADMIN.
Not yet: email verification, password reset, rate limiting.

## Docker
`docker compose up --build`, then run migrations once: `docker compose run --rm app npx prisma migrate deploy` (needs the prisma CLI in the image; otherwise run `npx prisma migrate deploy` from your machine with DATABASE_URL pointed at the DB). Unverified.

## Problems
- 116 external practice links (from the A2SV slides you uploaded, up to 5 unique per topic) and 7 original problems, seeded by `npm run db:seed`. Statements for external problems are never stored.
- Difficulty labels on external problems are estimates. Links were NOT verified when written; run `npx tsx scripts/check-links.ts` (only 404/410 count as broken).
- Duplicate links are blocked by a unique canonical URL (`normalizedUrl`); the admin form and the seed both reject duplicates.
- Original problems have sample tests only. Hidden tests and a judge are not built; "solved" is self-reported.
- Admin: `/admin/problems` (create, edit, publish/unpublish, delete, position ordering). Migration needed: `npx prisma migrate dev --name problems`.

## Search and practice recommendations
`/search` covers topics and lessons (in-memory over the curriculum content) and published problems (Postgres, case-insensitive substring on title or topic). The header has a search box. The dashboard's "Practice next" lists unsolved problems from topics you completed, easiest first. Multi-word ranking (e.g. "easy prefix sum") is not supported yet.

## Training loop additions
Streaks (UTC days, from an Activity log), mistake notebook with upsolve reasons, tagged plain-text notes (no Markdown rendering yet), onboarding (experience and language; higher experience marks earlier levels as known, once), profile, admin user management (role, suspend; admins cannot change themselves), `sitemap.xml` and `robots.txt` (set SITE_URL). Migration: `npx prisma migrate dev --name training`.

## Not built yet
Contests and leaderboards (need a judge or trusted scoring), visualizations, XP/badges, admin curriculum/lesson editor, remaining lesson text (most topics still have none), password reset, email verification, login rate limiting, analytics dashboard, end-to-end tests, hidden test cases and the judge.

## Round 4: contests, judge-lite, verification, viz, gamification, analytics
- **Rate limiting:** login (5/15min per email, 20/15min per IP), registration (10/hour per IP), password reset and resend-verification requests. Backed by a simple `AuthAttempt` table, not Redis; fine for one server, not for a multi-instance deployment.
- **Password reset / email verification:** single-use, hashed, expiring tokens. `src/lib/mailer.ts` sends via Resend if `RESEND_API_KEY` + `EMAIL_FROM` are set, otherwise prints the email to the server console — check your terminal in dev.
- **More lessons:** 14 additional topics now have original written lessons (17 of 27 published topics covered; 10 still show "coming").
- **Admin lesson editor (`/admin/lessons`):** a simple heading-based markdown format; a published custom lesson overrides the built-in one.
- **Visualizations:** binary search, two pointers, sliding window, and bubble sort, with play/pause/step/reset/speed. Pure step-generation logic is unit-tested; rendering itself is not.
- **XP, levels, badges:** deterministic rules in `src/lib/gamification.ts`, shown on `/profile` and the dashboard.
- **Contests (`/contests`):** internal, virtual (timer starts per-entrant, not at a fixed clock time), with a leaderboard ranked by solved-then-penalty. External problems inside a contest are self-reported; internal problems with hidden tests use the same paste-and-check flow as standalone practice. Admin CRUD at `/admin/contests`.
- **"Judge" (`src/lib/judge.ts`):** exact-text comparison only. The user runs their program locally and pastes the output; nothing the user writes is ever executed by this server. This is NOT the sandboxed online judge from the original brief — that is a separate, security-sensitive project and is still not built.
- **Analytics (`/admin/analytics`):** user counts, 7-day active users, most-completed topics, most-solved problems, mistakes by type, recent sign-ups. Problem failure rates need a judge and are not available.
- **Playwright scaffolding** (`tests/e2e`, `npm run test:e2e`): 3 smoke tests. Needs `npx playwright install` once, a running dev server, and a seeded database; not run in this sandbox.

New env vars in `.env.example`: `SITE_URL`, `RESEND_API_KEY`, `EMAIL_FROM`.
Migration needed: `npx prisma migrate dev --name contests_and_more`.

## Still not built
A sandboxed code-execution judge (the paste-and-check flow above is a stand-in, not a replacement); internationalization; a design-system pass beyond the current minimal styling; CSRF tokens beyond Next's built-in same-origin form protections; production deployment itself (only Dockerfile/compose are provided, untested).

## Rate limits and proxies
Auth rate limits are stored in the `AuthAttempt` table (`src/lib/rate-limit.ts`). Forwarded headers are **not trusted by default**.

- **Default (`TRUST_PROXY` unset or `false`):** `X-Forwarded-For` and `X-Real-IP` are ignored entirely. Limits are keyed on normalised email only:
  - login: `login-email:<email>`, 5 failures per 15 minutes
  - registration: `register-email:<email>`, 30 per hour
  - password reset: `forgot-email:<email>`, 5 per hour
  - Limits are never keyed on a shared `"unknown"` value, so one client cannot lock out everyone else.
  - **Reduced protection:** without a trusted IP, one attacker can register or request resets for many different addresses without hitting a shared IP limit. Email verification is the remaining friction. Per-email login lockout can also be used to lock out a specific account.
- **Trusted proxy (`TRUST_PROXY=true`):** the client IP is read from `X-Forwarded-For` and validated with Node's `net.isIP`. The per-IP limits are added on top of the per-email ones: login 20 per 15 minutes, registration 30 per hour, reset 5 per hour.
  - `TRUSTED_PROXY_HOPS` (default `1`) counts entries from the right of `X-Forwarded-For`. Use `1` when your proxy overwrites the header with the actual client address.
  - If the header is missing, empty or malformed, only the per-email keys apply. The app never falls back to another header.
  - **Required deployment:** only enable this when every request reaches the app through your reverse proxy, which overwrites `X-Forwarded-For`. Example for nginx: `proxy_set_header X-Forwarded-For $remote_addr;` (not `$proxy_add_x_forwarded_for`, which keeps client-supplied entries). The app port must not be published or reachable directly by clients. The current `docker-compose.yml` publishes `3000:3000`, so do not set `TRUST_PROXY=true` with that file unchanged. Put the app on an internal network and expose only the proxy.
- **Local development:** keep `TRUST_PROXY` unset. All requests then share the per-email keys only, which is correct for local testing. To clear limits while testing, delete rows in `AuthAttempt` with `npx prisma studio`, or run:
`npx tsx -e "import('./src/lib/db').then(({db}) => db.authAttempt.deleteMany().then(r => console.log('deleted', r.count)).finally(() => db.$disconnect()))"`

## UI redesign
See `docs/UI_UX_REDESIGN_HANDOFF.md` for the design system, what was redesigned, and what remains. Fonts are self-hosted via `@fontsource-variable`; theme is stored in `localStorage.theme`.

## Curriculum expansion (complete lessons, visualizations, mastery)

Complete lessons are data in `src/content/lessons-v2/` (one file per topic), rendered by `src/components/lesson/`. `docs/LESSON_QUALITY_STANDARD.md` defines what "complete" means and `src/lib/lesson-quality.ts` enforces it in tests, including running every Python snippet. `docs/CURRICULUM_AUDIT.md` is the honest status: 40 full lessons (every topic is published), 57 visualizations, 40 original problems with reference solutions. Visualizations are generated in `src/lib/viz/` and loaded lazily. Mastery (`src/lib/mastery.ts`) combines completion, a mastery check, practice and review. Migration needed: `npx prisma migrate dev --name quiz_results`. Re-seed to load the expanded practice links: `npm run db:seed`.

Original problems: reference solutions and hidden-test generation live in `scripts/original_problem_tools.py` (see `docs/LESSON_QUALITY_STANDARD.md`).

## Python version

The lesson snippets and the reference tool need **Python 3.10 or newer**. `int.bit_count()` (used in the bit-manipulation lesson and in `scripts/original_problem_tools.py`) was added in 3.10, and `pow(a, -1, m)` (modular inverse) needs 3.8 or newer. Check with `python3 --version`.

## Geometry, contest strategy and upsolving

Computational Geometry is now a full lesson (cross product, shoelace area, Pick's theorem, segment intersection, convex hull by monotone chain), with five original problems: four with reference solutions cross-checked by brute force, and one challenge (interior lattice points). Contest Strategy and Upsolving are full lessons written to the same gate; `docs/LESSON_QUALITY_STANDARD.md` explains how the gate applies to these process topics. This pass also added Prim, Bellman–Ford, Floyd–Warshall, quicksort partition, segment-tree point update, and the convex-hull, contest and upsolve visualizations.


## Algorithm visualizer (/visualizer)

A standalone page for stepping through algorithms with your own input. The lesson pages link to it with "Visualize this algorithm", which opens `/visualizer?lesson=<slug>` with the lesson's first algorithm selected. `/visualizer?algo=<id>` opens a specific algorithm.

**Layout.** `src/lib/visualizer/` holds the logic, with no React in it:
- `types.ts` defines `Algorithm`, `Field`, `Step` (an array frame), `GraphStep` (a tree frame), and `RunOutcome`.
- `parse.ts` turns raw text into numbers, operations, and query ranges. Each parser returns an actionable error message.
- `arrays.ts`, `sorting.ts`, and `structures.ts` run the real algorithms and record one frame per operation. Each frame has the array state, highlight marks, a plain-language note, and the index of the pseudocode line it describes.
- `registry.ts` lists every algorithm with its category, lesson link, complexity, pseudocode, input fields, presets, and a `run` function that validates the input before any generator runs.
- `visualizer.test.ts` checks results against brute-force answers on seeded random inputs, and checks that every frame points at a real pseudocode line.

The UI is `src/components/visualizer/VisualizerApp.tsx`. It reuses the existing `ArrayStage` and `GraphStage` renderers from `src/components/viz/`.

**Add an algorithm.** Write the generator in one of the three generator files, with `at(values, line, note, marks)` for each frame and the pseudocode line index as the second argument. Then add a registry entry with its pseudocode (the line indices must match the generator), its fields, at least one preset, and a `run` function that calls the parsers and returns `{ ok: false, error }` for bad input. Add the entry's `lessonSlug` if a lesson covers it. Then add a case to `visualizer.test.ts` that checks the final result against a brute-force answer.

**Safety.** User input is never evaluated. Every visualization is built from the implemented functions above, with input limits (30 values, ±999, 9 tree keys, 20 operations) so the browser stays responsive.

**Complete:** linear search, binary search, two pointers, sliding window, prefix sums, array traversal, bubble, selection, insertion, merge, quick (Lomuto partition), heap sort, stack, queue, binary search tree insert and search, breadth-first and depth-first search, Dijkstra's shortest paths, topological sort (Kahn), climbing stairs, coin change, longest common subsequence, and 0/1 knapsack. Graph inputs take a node count, an edge list with optional weights, and a directed flag. Nodes are numbered from 0. Also complete: Bellman–Ford (negative weights, negative-cycle detection), Floyd–Warshall (all pairs), Kruskal and Prim minimum spanning trees (undirected), connected components (undirected), and union-find with union by size. Also complete: Fenwick tree (point add and prefix query), trie (insert and search, up to 4 words of 1 to 4 letters), interval scheduling greedy, and N-Queens backtracking (boards up to 6 by 6). Also complete: a side-by-side table that runs a second sort on the same input (steps shown and result, not machine operation counts), a backtracking subset-sum search with pruning, a beginner/advanced switch that shows or hides pseudocode and complexity, a trie with insert, delete (pruning nodes nothing else needs) and search, union-find with path compression, a binary search tree with insert, delete and search, where delete handles the no-child, one-child and two-child (in-order successor) cases. Also complete: a range-minimum segment tree (queries and point updates, values 0 to 99). Every algorithm has a "Try it yourself" challenge (in `challenges.ts`), and the pseudocode and complexity panels can be hidden.

**Deferred:** range updates for the segment tree (lazy propagation) and the Fenwick tree (two-tree range add). The lesson visualizations under `src/lib/viz/` cover some of these, and the two systems can be merged later.

**Verification status.** The algorithm logic has a Vitest suite (`src/lib/visualizer/visualizer.test.ts`) that checks results against brute-force oracles. The page and component have a render test (`src/components/visualizer/VisualizerApp.render.test.tsx`) that renders every algorithm and checks the query-parameter routing. Both were run through a standalone harness (a small Vitest-compatible shim and a server-side render bundled with esbuild) rather than through the project's own toolchain, so `npm ci`, `npm run typecheck`, `npm run lint`, `npm test`, and `npm run build` should still be run before merging. Interactive behaviour (clicking Run, the playback buttons, keyboard controls) has not been exercised in a browser.

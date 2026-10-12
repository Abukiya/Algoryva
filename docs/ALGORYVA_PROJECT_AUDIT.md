# Algoryva Project Audit

Audit date: 2026-10-11. Scope: read-only inspection plus existing verification scripts. No application code, schema, migration, or data was changed. Items are marked **Verified** (confirmed by code reading or a command result) or **Unverified** (inferred or not yet tested).

## 1. Executive summary

Algoryva is a Next.js 15 / React 19 / TypeScript / Tailwind / Prisma (PostgreSQL) app with auth, 40 curriculum topics (36 published, each with a full lesson), 274 external practice links, 31 original problems with hidden tests, contests, streaks, notes, a mistake notebook, admin tools, and analytics.

**Verified green (re-run after the AUD-001 and AUD-004 fixes):** `npm run typecheck` (exit 0), `npm run lint` (exit 0, 0 errors, 3 pre-existing warnings), `npx vitest run` (exit 0, 22 test files, 240 tests passed), `npx vitest run src/app/problems src/lib/solve.test.ts` (exit 0, 17 tests passed). `npx prisma validate` was verified earlier (schema valid) and was not re-run in this pass.

**Build:** `npm run build` passed (exit 0) on Next.js 15.5.26. Compilation succeeded, 15/15 static pages were generated, build traces were collected, and page optimization finished. This result comes from the maintainer's terminal output, not from a run in this audit session. `prisma migrate status` and Playwright e2e need a running database and were not run.

**Most important problem (fixed, AUD-001):** the answer checker (`src/app/problems/judge-actions.ts`) used to return every test case's `input` and `expected` output to the browser, including hidden tests. It now returns `input`, `expected`, and `actual` only for public sample tests. Hidden test results carry only `isSample` and `pass`. Verified by unit tests (see AUD-001).

Other key gaps: the rate-limit key trusts a spoofable header; the Docker image runs as root; internal-problem solves were self-reported (now fixed in code, see AUD-004, pending real PostgreSQL verification); there is no code-execution judge (`Submission` exists in the schema but nothing writes it).

## 2. Architecture and implemented functionality (Verified)

- Routing: App Router under `src/app/` (`/`, `/learn`, `/learn/[slug]`, `/roadmap`, `/problems`, `/problems/[slug]`, `/contests`, `/mistakes`, `/notes`, `/search`, `/profile`, `/dashboard`, `/onboarding`, `/admin/*`, `sitemap.xml`, `robots.txt`).
- Auth: scrypt hashing (`src/lib/auth/password.ts`), DB-backed sessions storing SHA-256 token hashes in an httpOnly cookie (`src/lib/auth/session.ts`), email verification and reset tokens (`src/lib/auth/tokens.ts`), `requireUser` and `requireAdmin` guards. `src/app/admin/layout.tsx` and admin actions call `requireAdmin()`.
- No `middleware.ts` exists. Route protection is per page and per action.
- Curriculum: `src/lib/curriculum.ts` drives the roadmap pages and seeds the DB. Prerequisites: `src/lib/recommend.ts`, enforced server-side in `src/lib/progress.ts` (`completeTopic`).
- Lessons: data in `src/content/lessons-v2/`, rendered by `src/components/lesson/`, validated by `src/lib/lesson-quality.ts`. 47 visualizations in `src/lib/viz/`.
- Mastery quiz: `src/app/learn/actions.ts` recomputes the score from lesson data on the server.
- Problems: one `Problem` model (INTERNAL with statement and tests; EXTERNAL with a link only). Solve toggle in `src/app/problems/actions.ts`. Paste-and-check in `src/app/problems/judge-actions.ts`, exact-text comparison in `src/lib/judge.ts`.
- Contests: per-entrant virtual timer, penalty scoring (`src/lib/contest-scoring.ts`), admin CRUD.
- Also present: gamification, streaks, activity log, notes, mistake notebook, analytics, admin user management.

**Verified absent:** sandboxed code execution; any writer of `Submission` (no `db.submission.*` calls); middleware; non-Python lessons.

## 3. Feature status (Verified)

| Feature | Status | Evidence |
|---|---|---|
| Register, login, logout, sessions | Complete (basic). Rate limits no longer trust spoofable headers by default (AUD-002, fixed; see residual risk) | `src/app/actions.ts`, `src/lib/auth/session.ts` |
| Email verification, password reset | Partial. Real email needs `RESEND_API_KEY`; otherwise logs to console | `src/lib/mailer.ts`, `src/app/auth-actions.ts` |
| Dashboard, profile | Complete | `src/app/dashboard/page.tsx`, `src/app/profile/page.tsx` |
| Learning paths, beginner to advanced | Complete for 36 published topics; 4 planned topics have no content | `docs/CURRICULUM_AUDIT.md` |
| Lessons with code | Complete, Python only | `src/content/lessons-v2/` |
| Completion and progress | Complete, prerequisites enforced server-side | `src/lib/progress.ts` |
| Quizzes | Complete; score recomputed on server | `src/app/learn/actions.ts` |
| Problem browse, filter, search | Browse and filter complete; search is substring-only | `src/app/problems/page.tsx`, `src/app/search/page.tsx` |
| Submission history | **Missing.** `Submission` never written | `prisma/schema.prisma:209-221` |
| Bookmarks | **Missing** | Schema |
| Notes | Complete (plain text) | `src/app/notes/actions.ts` |
| Mistake notebook | Complete | `src/app/mistakes/actions.ts` |
| Contests | Partial. External solves self-reported | `src/app/contests/actions.ts` |
| Streaks, XP, badges | Complete | `src/lib/streak.ts`, `src/lib/gamification.ts` |
| Leaderboard | Contest-only; no global leaderboard | `src/app/contests/` |
| Admin: lessons | Partial. Edits outline lessons only | `docs/CURRICULUM_AUDIT.md` item 4 |
| Admin: problems, users, contests, analytics | Complete (basic) | `src/app/admin/` |
| Judge / code execution | **Missing.** Paste-and-check text comparison only | `src/lib/judge.ts` |

## 4. Critical bugs and findings

Each finding lists ID, area, status, evidence, impact, fix, complexity, priority, and acceptance criteria.

### AUD-001: Hidden test answers are sent to the browser
- **Area:** Problem judge. **Status:** Fixed (security), verified by unit tests. Previously Broken. **Verified.**
- **Fix applied:** `src/app/problems/judge-actions.ts` now builds results with `isSample ? { isSample, input, expected, actual, pass } : { isSample, pass }`. Only public samples expose `input`, `expected`, and `actual`. Hidden tests return only the verdict. The visibility decision comes from the database row, and client-sent flags are ignored.
- **Regression coverage:** `src/app/problems/judge-actions.test.ts` (AUD-001 tests). It checks that the sample returns its fields, that a hidden result has exactly `{ isSample: false, pass }`, that the serialized response does not contain the hidden `expected` value or the hidden `input`, and that client flags such as `isSample` and `showHidden` do not change visibility.
- **Limitation:** the fix is verified by unit tests with mocked Prisma. It has not been checked against a running app or database.
- **Evidence:** `src/app/problems/judge-actions.ts:16-18` loads `testCases: true` (all tests, not only samples). Line 18 maps every test to `{ input, expected, actual, pass }` and returns it. A server action's return value is serialized to the client, so the hidden `expected` values reach the browser. `JudgeForm` only renders `pass`, but the data is still in the response.
- **Impact:** any logged-in user can read the expected output of every hidden test and submit it. Hidden tests exist to stop answer copying.
- **Fix:** return `pass` for every test. Return `input` and `expected` only for samples (`isSample: true`). Keep grading on the server.
- **Complexity:** Small. **Priority:** P0. **Dependencies:** none.
- **Acceptance:** a unit test with a hidden test fixture asserts that its `expected` string is absent from the serialized result, and the UI still shows Passed / Failed per test.

### AUD-002: Rate limits can be bypassed with a spoofed header
- **Area:** Auth rate limiting. **Status:** Fixed (code and tests verified; deployment proxy config is an operator task).
- **Original evidence:** `src/lib/rate-limit.ts` took the first `x-forwarded-for` value and fell back to the literal `"unknown"`. Registration and reset were keyed on that IP.
- **Fix implemented:**
  - Forwarded headers are ignored unless `TRUST_PROXY` is exactly `"true"` (`proxyTrustEnabled`, `src/lib/rate-limit.ts`).
  - With trust off, login uses `login-email:<email>` (5 per 15 min); registration uses `register-email:<email>` (30 per hour); password reset uses `forgot-email:<email>` (5 per hour). Emails are normalised with `normalizeEmail` (`src/lib/auth/validation.ts`).
  - With trust on, the client IP is taken from `x-forwarded-for` at `TRUSTED_PROXY_HOPS` entries from the right (default 1), validated with `node:net` `isIP`. A valid IP adds `login-ip`, `register-ip` and `forgot-ip` limits. A missing or malformed value adds nothing and never falls back to another header.
  - `X-Real-IP` is never read. The `"unknown"` bucket is removed.
- **Residual risk:** with trust off, registration and reset have no per-IP protection. One attacker can use many addresses. Per-email login lockout can still be used against a specific account. Trusted-proxy mode is only safe when the proxy overwrites `X-Forwarded-For` and the app port is not reachable directly. The current `docker-compose.yml` publishes `3000:3000`, so it must not be used with `TRUST_PROXY=true` unchanged.
- **Tests:** `src/lib/rate-limit.test.ts`, `src/app/actions.test.ts`, `src/app/auth-actions.test.ts` (36 tests).
- **Complexity:** Small. **Priority:** P1.

### AUD-003: Docker image runs as root and installs without the lockfile
- **Area:** Deployment. **Status:** Partial. **Verified** from the file.
- **Evidence:** `Dockerfile` has no `USER` directive and runs `npm install` (not `npm ci`). The runtime stage has no Prisma CLI, which the README acknowledges.
- **Impact:** a compromised Node process runs as root. `npm install` can drift from `package-lock.json`.
- **Fix:** use `npm ci` in the build stage and `USER node` in the runtime stage. Document migrations.
- **Complexity:** Small. **Priority:** P1.
- **Acceptance:** `docker build` succeeds (**not run here**), and the container's `id -u` is non-zero.

### AUD-004: Internal problems can be marked solved without passing
- **Area:** Problem progress. **Status:** Fixed in code and covered by unit tests. **PostgreSQL concurrency not yet verified against a real database.** **Verified** by code reading and mocked tests.
- **Fix applied:** internal problems can no longer be self-marked solved. `toggleSolved` (`src/app/problems/actions.ts`) awards only EXTERNAL problems, and ignores client flags such as `solved`, `passed`, and `allPass`. Unmarking is allowed and grants nothing. `markSolvedInContest` (`src/app/contests/actions.ts`) accepts only EXTERNAL problems that belong to that contest, and only while the entry's own timer is running. The problem detail page (`src/app/problems/[slug]/page.tsx`) shows a note for INTERNAL problems instead of a self-report button. Verified internal solves come only from `checkOutput` (`src/app/problems/judge-actions.ts`) after every hidden test passes. Awards go through `awardSolve` and `awardContestSolve` in `src/lib/solve.ts`, which use `createMany({ skipDuplicates: true })` and write the `problem_solved` activity only when a row was inserted.
- **Idempotency basis:** relies on the existing composite primary keys `ProblemSolve(userId, problemId)`, `ContestSolve(entryId, problemId)`, and `ContestProblem(contestId, problemId)`, confirmed in `prisma/migrations/20261001041647_init/migration.sql`. No schema change was made.
- **Second hardening pass (2026-10-11, code written, NOT yet executed):** (1) `checkOutput` now authenticates before grading, so anonymous callers no longer get per-test verdicts; (2) checks are rate limited per user and problem (40/hour, existing `AuthAttempt` table, no migration); (3) a problem with no hidden test can no longer be solved by matching the public sample output, and the UI shows a `note` instead of "marked as solved" whenever a full match is not recorded; (4) output length is capped; (5) contest paths require a PUBLISHED contest (and a PUBLISHED problem in `markSolvedInContest`); (6) `awardContestSolve` re-checks entry ownership, published contest, running timer and contest membership inside its own transaction; (7) the unused, unchecked `markContestSolve` helper in `src/lib/contests.ts` was removed. New or extended tests: `src/app/problems/judge-actions.test.ts`, `src/app/problems/actions.test.ts`, `src/app/contests/actions.test.ts` (new), `src/lib/solve.test.ts`. **These tests, typecheck and lint have not been run since this pass**: the session that made them could not install dependencies (npm registry blocked), so only a syntax-only parse was done. Re-run `npm run typecheck`, `npm run lint` and `npx vitest run` before treating AUD-004 as verified.
- **Known remaining reward-integrity gaps:** (a) pasted-output checking cannot prove the learner's code is correct, and hidden test inputs are not shown to learners, so it is not a real verification of internal problems until AUD-005 exists; (b) unmarking a solve does not remove its `problem_solved` activity, so unmark-and-remark of an EXTERNAL problem writes a new activity each time and can keep a streak alive (XP is derived from solve rows and is not inflated). Fixing (b) cleanly needs a schema change and approval.
- **Not yet verified:** whether PostgreSQL's `ON CONFLICT DO NOTHING` behaviour holds under real concurrent requests. The tests in `src/lib/solve.test.ts` use an in-memory fake, not a database. Run them against a real database before treating concurrency as proven.
- **Evidence:** `src/app/problems/actions.ts:8-17` (`toggleSolved`) writes `ProblemSolve` for any published problem, including INTERNAL problems with hidden tests. Its own comment says "No judge exists yet".
- **Impact:** XP, streaks, and "Practice next" count self-reported solves, so progress data is not reliable.
- **Fix:** for INTERNAL problems with tests, allow solve only through `checkOutput` when all tests pass. Keep self-report for EXTERNAL problems and label it.
- **Complexity:** Small. **Priority:** P1.
- **Acceptance:** a test shows `toggleSolved` cannot create a `ProblemSolve` for an INTERNAL problem that has tests.

### AUD-005: No code-execution judge; `Submission` is unused schema
- **Area:** Judge architecture. **Status:** Missing. **Verified.**
- **Evidence:** `prisma/schema.prisma:209-221` defines `Submission` and `SubmissionStatus`. No code writes them. `README.md` says the sandboxed judge is not built.
- **Impact:** students cannot run code against tests on the platform; they must run it locally and paste output.
- **Fix:** do not execute user code in the web server. Use an isolated runner (separate container or hosted sandbox, with no network and strict CPU, memory, and time limits) that writes `Submission` rows. This is a separate security-sensitive project and needs design approval first.
- **Complexity:** Large. **Priority:** P1 (product). **Dependencies:** a runner design, and AUD-001 fixed first.

### AUD-006: Content gaps in advanced and new topics
- **Area:** Curriculum. **Status:** Partial. **Verified** from `docs/CURRICULUM_AUDIT.md`.
- **Evidence:** 4 planned topics have no lesson (advanced DP, computational geometry, two contest-strategy topics). Nine new topics have no lecture source and no external links. Only Segment Tree has a challenge-tier problem among them. Lessons and tests are Python only.
- **Impact:** the learning path stops before advanced material, and C++ students get no lessons.
- **Fix:** write the 4 planned lessons; add challenge problems and verified external links for the new topics (chosen by a person); add C++ snippets to the lesson standard, starting with foundation topics.
- **Complexity:** Large. **Priority:** P2.
- **Acceptance:** `src/content/lessons-v2/lessons.test.ts` passes for every published topic, plus a new test for C++ snippets.

### AUD-007: UI, accessibility, and responsive behaviour not verified in a browser (Unverified)
- **Area:** UI/UX. **Status:** Unverified.
- **Evidence (code only):** `aria-live` on judge results (`src/components/JudgeForm.tsx`), labels on inputs, state shown by icon and text (`src/components/TopicCard.tsx`), `role="alert"` on form errors. Problem Input and Output blocks are plain text (`src/app/problems/[slug]/page.tsx:52-57`), and long constraints may not wrap well on mobile.
- **Impact:** responsive layout, contrast, and keyboard flows are unknown.
- **Fix:** run `npm run dev` with a seeded database, check mobile and keyboard flows, and run `npm run test:e2e`.
- **Complexity:** Small. **Priority:** P3.

## 5. Security and performance

| ID | Issue | Evidence | Priority |
|---|---|---|---|
| AUD-001 | Hidden test answers leak to the browser (**fixed**, verified by unit tests) | `src/app/problems/judge-actions.ts:16-18` | P0 |
| AUD-002 | Spoofable rate-limit key | `src/lib/rate-limit.ts:7-10` | P1 |
| AUD-003 | Container runs as root; `npm install` instead of `npm ci` | `Dockerfile` | P1 |
| AUD-004 | Solves on internal problems are unverified | `src/app/problems/actions.ts:8-17` | P1 |
| AUD-008 | Contest external solves are self-reported, so the leaderboard can be gamed | `src/app/contests/actions.ts` | P2 |
| AUD-009 | No global security headers (CSP, frame-ancestors) in config | `next.config.mjs` | P2 |
| AUD-010 | Admin problem actions trust form IDs; a missing ID throws instead of returning a clean error | `src/app/admin/problems/actions.ts:53-63` | P3 |

**Verified good practice:** `deleteMistake`, `deleteNote`, and `completeReview` scope writes to `userId` (no IDOR). Quiz scores are recomputed on the server. Admin actions call `requireAdmin()`. Passwords use scrypt. Session tokens are stored hashed.

**Unverified:** performance (no measurement); `src/app/problems/page.tsx` pagination (not fully inspected); behaviour under multiple server instances, where the database-backed rate limit is only correct on one instance (already noted in the README).

## 6. Database and deployment

- **AUD-011 (P2): seed overwrites admin edits.** `prisma/seed.ts:41-50` runs `update: data` on every original problem and deletes and recreates its test cases on every run. Edits made in `/admin/problems` are lost on reseed. Fix: seed only missing rows, or mark seeded rows as managed. Acceptance: an admin edit survives a second `npm run db:seed`. Complexity: Small to medium.
- **AUD-012 (P2): two curriculum sources.** `src/lib/curriculum.ts` drives the roadmap pages, while the DB drives learn and problem pages. Published status and prerequisites can diverge after admin edits. Fix: one source, plus a test that the seeded DB matches the file. Complexity: Medium.
- **AUD-013 (P2): migration docs are stale.** `README.md` asks for `prisma migrate dev --name quiz_results`, `training`, `contests_and_more`, and `problems`. The single committed migration `prisma/migrations/20261001041647_init/migration.sql` already creates `QuizResult`, `Contest`, `ContestEntry`, `Note`, `Activity`, `VerificationToken`, `TestCase`, and the `onboarded`, `emailVerifiedAt`, `preferredLanguage` columns. Unverified: whether a given database is at this migration (needs `prisma migrate status` against a real database). Fix: run `migrate status`, then correct the README. Complexity: Small.
- **AUD-014 (P3): stale env comment.** `.env.example` line 2 mentions `AUTH_SECRET` for "Phase 1b", which auth does not use.
- **AUD-015 (P3): tests skip silently without Python.** `src/content/lessons-v2/lessons.test.ts:36` and `src/content/reference.test.ts:19` use `skipIf(!py)`. A machine without `python3` shows green while skipping execution. Fix: fail in CI when `python3` is missing. Complexity: Small.
- **AUD-016 (P3): lint warnings.** `eslint.config.mjs`, `next.config.mjs`, and `postcss.config.mjs` each produce `import/no-anonymous-default-export`. Cosmetic.
- **AUD-017 (P1, verification gap): production build not confirmed.** `npm run build` did not complete in the observation window. Rerun it with a database and record the result.
- **Deployment:** `output: "standalone"` is set in `next.config.mjs`, and a Dockerfile and `docker-compose` setup exist. Neither was built or run here. `.env.example` has no `AUTH_SECRET` (AUD-014); secrets were not inspected beyond the example file.

## 7. Recommended new features

**Already present:** streaks, XP and levels, mistake notebook, notes, contests with leaderboard, analytics, spaced-review ladder, quiz-based mastery, search, sitemap.

**Worth adding (ranked by learning value and cost):**
1. **Safe judge service:** an isolated runner with time, memory, and network limits, writing `Submission` rows (AUD-005). Large; design approval needed.
2. **Topic mastery tracking:** combine quiz, practice, and review data. `src/lib/mastery.ts` already does part of this. Small to medium.
3. **Weak-topic detection:** from `Mistake.type` and failed checks. Small.
4. **Per-topic practice recommendations:** extend `src/lib/recommend.ts`. Small.
5. **AI hints that avoid revealing solutions:** defer until the judge exists, and add a privacy review. Medium.

**Defer:** contest preparation plans, global leaderboard, admin CMS for full lessons, C++ track (after foundation content is complete).

## 8. Prioritized implementation roadmap

**Phase 1: Fix**
1. AUD-001 hidden test leak. **Done (verified by unit tests).** Acceptance: serialized result test.
2. AUD-004 unverified solves on internal problems. **Fixed in code (unit-tested). Real PostgreSQL concurrency check still outstanding.**
3. AUD-002 spoofable rate-limit key. Small. Acceptance: header-spoof test.
4. AUD-003 Docker non-root and `npm ci`. Small.
5. AUD-017 confirm build and `prisma migrate status` against a real database. Small. Verification only.
6. AUD-011 seed overwrites admin edits. Small to medium.

**Phase 2: Complete**
7. AUD-013 migration docs. Small.
8. AUD-012 single curriculum source. Medium.
9. AUD-009 security headers. Small.
10. AUD-008 contest self-report policy. Small to medium.
11. AUD-015 CI fails when Python is missing. Small.
12. AUD-006 content: planned lessons, challenge problems, C++ track. Large.

**Phase 3: Expand**
13. AUD-005 safe judge service and `Submission` writes. Large. Depends on design approval.
14. Mastery dashboard, weak-topic detection, practice recommendations. Medium each. Depends on 1 and 13.
15. AI hints, after the judge exists and a privacy review. Medium.

## 9. Verification log

| Check | Command | Result |
|---|---|---|
| Typecheck | `npm run typecheck` | Pass (exit 0) |
| Lint | `npm run lint` | Pass: 0 errors, 3 warnings (AUD-016) |
| Unit tests | `npx vitest run` | Pass (exit 0): 22 files, 240 tests |
| Targeted AUD-001 and AUD-004 tests | `npx vitest run src/app/problems src/lib/solve.test.ts` | Pass (exit 0): 17 tests |
| PostgreSQL concurrency for `createMany({ skipDuplicates })` | not run | **Not verified**: needs a real database |
| Prisma schema | `npx prisma validate` | Valid. Warns that `package.json#prisma` is deprecated |
| AUD-002 focused tests | `npx vitest run src/lib/rate-limit.test.ts src/app/actions.test.ts src/app/auth-actions.test.ts` | Pass (exit 0): 3 files, 36 tests (maintainer terminal output, 12:16) |
| AUD-002 typecheck | `npm run typecheck` | Pass (exit 0) after `RateLimitEnv` index-signature fix (maintainer terminal output, 12:16) |
| AUD-002 lint | `npm run lint` | Pass: 0 errors, 3 pre-existing warnings (maintainer terminal output, 12:16) |
| Production build | `npm run build` | Pass (exit 0): Next.js 15.5.26, 15/15 static pages, build traces collected (maintainer terminal output). Not re-run after AUD-002 changes |
| Migration status | `npx prisma migrate status` | **Not run**: needs a database |
| E2E | `npm run test:e2e` | **Not run**: needs a dev server and seeded database |
| Browser UI and a11y | manual | **Not run** |

## 10. Summary of checks

- Verified with code reading: AUD-001 through AUD-005, AUD-011 through AUD-016.
- Verified by commands (latest run): typecheck (exit 0), lint (exit 0, 3 pre-existing warnings), targeted AUD-001 and AUD-004 tests (17 passed), full `vitest run` (22 files, 240 tests passed). Prisma schema validation was verified earlier.
- AUD-001: fixed, verified by unit tests. AUD-004: fixed in code and unit-tested. PostgreSQL concurrency behaviour is not yet verified against a real database.
- Unverified: build result, migration state, e2e, browser UI, Docker, performance, real PostgreSQL concurrency for the solve path.

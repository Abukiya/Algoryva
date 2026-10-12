# Algoryva Code Judge Architecture (AUD-005)

Status: **PROPOSED. NOT IMPLEMENTED.** No dependency was installed, no Docker configuration was changed, no migration was created, and no execution service exists. Implementation waits for explicit maintainer approval.

Revision: 2026-10-11. This revision re-checked the earlier draft against the repository and the primary documentation, and corrected several problems in it (listed in section 12).

Audit reference: `docs/ALGORYVA_PROJECT_AUDIT.md`, AUD-005: "There is no code-execution judge (`Submission` exists in the schema but nothing writes it)."

## 1. Current-state findings (verified by reading the repository)

- **No code execution exists.** `src/lib/judge.ts` exports `gradeOutput`, an exact-text comparison (trailing whitespace per line and trailing newlines ignored). `src/components/JudgeForm.tsx` shows one textarea per test and says it "does not run your code". The server action `checkOutput` (`src/app/problems/judge-actions.ts`) compares pasted text to stored expected outputs. No path in the repository starts a process from user input.
- **The pasted-output checker cannot verify code, and is structurally weak.** The problem page shows only sample tests (`testCases: { where: { isSample: true } }` in `src/app/problems/[slug]/page.tsx`), so a learner never sees hidden inputs and cannot legitimately produce hidden outputs. After the AUD-001 fix the only ways to pass a hidden test are guessing or deriving the output some other way. A sample-only problem could be "solved" by copying the displayed sample output. The AUD-004 second pass (see the audit entry) stops the sample-only case, authenticates before grading, rate limits checks, and stops the UI claiming a solve that was not recorded. It cannot make pasted output a proof of correct code. **Until a real judge exists, internal-problem completion is not strongly verified.**
- **`Submission` is unwritten.** `prisma/schema.prisma` defines `Submission` (`userId`, `problemId`, `language`, `code`, `status SubmissionStatus @default(PENDING)`, `runtimeMs`, `createdAt`, index on `userId, problemId, createdAt`). `SubmissionStatus` is `PENDING, ACCEPTED, WRONG_ANSWER, TIME_LIMIT, RUNTIME_ERROR, COMPILE_ERROR`. No code calls `db.submission.*`. There is no `contestId`, per-test result, memory, attempt counter, lease, or compile-log storage.
- **Problem and test data.** `Problem` has `kind` (INTERNAL or EXTERNAL), `statement`, `inputSpec`, `outputSpec`, `constraints`, nullable `timeLimitMs` and `memoryLimitMb`. `TestCase` has `input`, `expected`, `isSample`, `explanation`. Samples and hidden tests share one table. Hidden data is protected only by query discipline (AUD-001). Hidden tests exist only through the seed (`src/content/hiddenTests.ts`, at least 3 per original problem, enforced by `src/content/problems.test.ts`). The admin form (`src/app/admin/problems/actions.ts`) can write only one sample test, so **admin-created internal problems are sample-only** and, after the AUD-004 pass, cannot be solved through the checker. `README.md` line 40 ("Original problems have sample tests only") is out of date.
- **The reward path.** `checkOutput` calls `awardSolve` or `awardContestSolve` (`src/lib/solve.ts`) only after authentication and a full match including at least one hidden test. `awardContestSolve` now re-checks, inside its own transaction, that the entry belongs to the user, the contest is PUBLISHED, the entry timer is running, and the problem is in the contest. Idempotency comes from the composite primary keys `ProblemSolve(userId, problemId)` and `ContestSolve(entryId, problemId)` with `createMany({ skipDuplicates: true })`. **Interaction with a judge:** the running-timer check uses "now", so a submission made in time but judged after the timer ended would be refused. The judge must pass the submission time (section 3, step 6).
- **No editor and no language toolchain.** `package.json` has no CodeMirror or Monaco dependency. Lessons are Python-first with a Python-only highlighter (`src/lib/highlight.ts`). `User.preferredLanguage` defaults to "python". No C++ toolchain is referenced.
- **Deployment.** Next.js 15 standalone server (`node server.js`). `Dockerfile` uses `node:22-alpine`, has no `USER` line (runs as root, AUD-003), and runs `npm install`. `docker-compose.yml` runs `postgres:16-alpine` and the app. No Redis, queue, or worker service exists. `.env.example` has no judge variables.
- **Reusable controls.** `requireUser()` and `requireAdmin()` (`src/lib/auth/session.ts`), DB-backed rate limiting (`src/lib/rate-limit.ts`, table `AuthAttempt`), and contest guards (`contestState`, `src/lib/contests.ts`).

**Conclusion.** Auth, rate limits, contest timing, idempotent rewards, per-problem limits, and test storage exist. Missing: a sandboxed executor, a worker protocol, verdict persistence, and UI polling.

## 2. Threat model and security boundaries

### Assets
1. Hidden test inputs and expected outputs. They must never reach the browser, logs, or error text.
2. The main database and its credentials (users, sessions, password hashes).
3. The Next.js process and its secrets (`RESEND_API_KEY`, `DATABASE_URL`).
4. The judge host and other users' submissions.
5. Reward integrity (the AUD-004 invariant: no unverified internal solve earns XP, streak activity, or solved status).

### Adversary
An authenticated user who controls the submitted program's bytes. They may submit fork bombs, infinite loops, memory bombs, huge output, filesystem probes, attempts to read the database, other submissions or the worker's files, attempts to reach the network (internal services, cloud metadata at 169.254.169.254), compile-time tricks (for example `#include "/etc/passwd"`, giant template expansion), and attempts to forge a verdict.

### Trust boundaries

```
Browser --(server action, session cookie)--> Next.js web app (owns Postgres)
                                                  ^   |  /internal/judge/* over a private network, bearer token
                                                  |   v
                                            Judge worker (no DB credentials, unprivileged service user)
                                                  |  spawns, per run
                                                  v
                                       Isolate box (setuid helper, own uid, own namespaces, own cgroup)
                                       sees: runtime, the user's source or binary, one test INPUT on stdin
```

Rules:
- **B1.** User code runs only inside a sandbox started by the worker, never in a server action, route handler, or the Next.js process.
- **B2.** The sandbox never sees expected outputs. Preferred design (decision D1): the worker does not see them either. The web app sends test inputs only; the worker returns a hash of the normalized output per test; the web app compares to the stored expected hash and computes the verdict (section 6).
- **B3.** Only a caller with the worker credential may write a terminal result, and the web app recomputes the verdict from per-test data instead of trusting a top-level `success` field. Users have no write path to `Submission.status`.
- **B4.** The worker holds no database credentials. The web app performs claiming and persistence; the worker speaks HTTP only.
- **B5.** The sandbox has no network, no host mounts beyond the read-only runtime directories, no Docker socket, and a per-run unprivileged uid. See section 5 for how this is achieved with Isolate, including the privilege it needs.
- **B6.** One submission per sandbox box, cleaned up after each run.
- **B7.** Compiler and runtime output shown to users is truncated, stripped of host paths, and never includes test data.

### Residual risks (accepted and documented)
- Namespaces, cgroups, and system-call restrictions share the host kernel. A kernel exploit could escape the sandbox. The hardening reduces the attack surface but does not remove it. Do not run the judge on a host that also holds the database or other secrets (production requirement).
- A default Docker container is not an isolation boundary for hostile code by itself.
- Cross-sandbox timing side channels are out of scope.

## 3. Architecture overview and submission lifecycle

### Components
1. **Web app (existing).** Owns auth, problems, test cases, rewards, and the `Submission` table. Adds `submitCode`, `getSubmissionStatus`, and three internal routes (claim, heartbeat, result). It never executes code.
2. **Judge worker (new, separate process on a Linux host or VM).** Polls the web app for a job, compiles, runs each test in an Isolate box, hashes outputs, reports. No database access.
3. **Queue = the `Submission` table.** The web app's claim route performs the claim with `SELECT ... FOR UPDATE SKIP LOCKED` inside one transaction. Prisma's client has no `SKIP LOCKED` option, so this is a raw SQL statement. No Redis or broker, which keeps always-on services to a minimum.
4. **Sandbox.** Isolate (see sections 4 and 5).

### Lifecycle
1. **Create.** `submitCode` calls `requireUser()`, rate-limits per user and per problem, requires the problem to be PUBLISHED and INTERNAL, checks the language against an allowlist, checks source size, checks the user's pending-submission count, and inserts `Submission(status=PENDING, contestId?, testVersion)`. It returns only the submission id.
2. **Contest eligibility at submit time.** When `contestId` is supplied, check that the contest is PUBLISHED, the user has an entry whose timer is running now, and the problem is in that contest (same rules as `checkOutput` today). Store `contestId`. The submission's `createdAt` is the time that counts.
3. **Claim.** The worker calls `POST /internal/judge/claim`. The web app, in one transaction, selects the oldest claimable row (`PENDING`, or `RUNNING` with an expired lease) with `SKIP LOCKED`, sets `RUNNING`, `attempt = attempt + 1`, `claimedBy`, `leaseExpiresAt`, and returns the code, language, limits, and test inputs.
4. **Run.** The worker compiles (C++), then runs each test in order, samples first, stopping at the first failing test.
5. **Heartbeat.** The worker extends the lease while running.
6. **Ingest and verdict.** The worker posts `{ submissionId, attempt, compile, perTest[], workerVersion }` to `POST /internal/judge/result`. The web app, in one transaction: rejects unknown, non-RUNNING, or wrong-attempt results; recomputes the verdict from `perTest` against stored expected hashes; writes the terminal status; and only on ACCEPTED calls `awardSolve`, or `awardContestSolve` **passing the submission's `createdAt` as the time to check against the contest timer** (a small proposed parameter, so queue latency never costs a learner a legitimate solve).
7. **Poll.** The UI polls `getSubmissionStatus(id)` (owner only) until a terminal status.
8. **Retries and stuck jobs.** A lease that expires makes the row claimable again with `attempt + 1`, up to 2 retries, then `INTERNAL_ERROR` (platform failure, not the user's). A periodic sweep or the claim query itself handles expired leases.

Duplicates are safe: ingest requires the matching `attempt` and a RUNNING row, and reward writes are idempotent by primary key.

### Worker authentication
- `JUDGE_WORKER_TOKEN`: at least 32 random bytes, set only in the web and worker environments. `Authorization: Bearer`, compared in constant time. Internal routes reject everything else, are not linked from any page, and are bound to a private interface or protected by a network rule.
- Every ingest is validated against the stored submission (exists, RUNNING, attempt matches, problem INTERNAL and PUBLISHED, `perTest.length` equals the number of tests sent). Impossible values (negative times, output larger than the cap, extra or missing tests) become `INTERNAL_ERROR` and are logged without payload content.
- A stolen token cannot mint `ACCEPTED` by itself under design D1: it would also need the correct output hash for every hidden test, which requires solving the problem.

## 4. Alternatives compared and recommendation

| Criterion | A. Own OS-level sandbox worker (hand-built namespaces, cgroups, seccomp, or hardened Docker) | B. Dedicated worker driving Isolate | C. Third-party judging API (hosted) |
|---|---|---|---|
| Isolation strength | Only as good as what we build and test. High risk of subtle mistakes. | Purpose-built for untrusted executables. Namespaces, control groups, limits, and system-call restrictions on by default (manual). | Vendor-dependent. Code and tests leave our infrastructure. |
| Implementation complexity | High | Medium (adapter plus job protocol) | Low (HTTP client) |
| Local dev resources | Low to medium | Low to medium. A CLI the worker calls per run; no always-on heavy service. | Very low, needs internet |
| Operational needs | We own patches and every limit | We own host setup (setuid helper, cgroup v2, swap off) and updates | Vendor quotas, SLA, pricing |
| Language support | We implement each | Any toolchain we install | Vendor list |
| Reliability and scaling | We build it | Scale by adding worker hosts | Vendor-dependent, an external failure point |
| Hidden-test privacy | Full control | Full control | **Tests and submissions are uploaded to a third party.** Poor fit for hidden-test secrecy. |
| Fit with this app | Good | Good (the protocol in section 3 is backend-neutral) | Conflicts with B2 |

**Recommendation: Option B.** The worker drives Isolate. Hidden tests stay on infrastructure we control, the project does not have to invent a sandbox, and the moving parts are one worker process plus a CLI.

**Facts from the Isolate manual that shape the design** (https://raw.githubusercontent.com/ioi/isolate/master/isolate.1.txt, fetched 2026-10-11):
- "By default, isolate creates a new network namespace for its child process," with no network devices except a loopback. `--share-net` would remove that, so we never pass it.
- "Isolate is designed to run setuid to root." The sandboxed process then runs as an unprivileged uid that differs per `--box-id`.
- "This version of Isolate requires" cgroups v2. "Reporting memory usage requires Linux kernel 5.19 or newer." Swap should be turned off completely.
- "Running Isolate in containers is not recommended," and if used, "you probably have to make them privileged." **This conflicts with the earlier draft's idea of an unprivileged, capability-free worker container.** The worker therefore runs directly on a Linux host or VM as a dedicated unprivileged service user, with the Isolate helper installed setuid per its INSTALLATION section. Do not wrap it in a privileged container; that would defeat the isolation goal.
- By default only one process is permitted (`--processes`), the environment is not inherited unless `--full-env`, and the box sees only its own filesystem namespace with the default directory bindings.
- `--meta` reports `status` values `RE` (non-zero exit), `SG` (died on a signal), `TO` (timed out), `XX` (internal sandbox error), plus keys such as `time`, `time-wall`, `max-rss`, `cg-mem`, `cg-oom-killed`, `exitcode`, `exitsig`, `killed`, `message`.

**Other options considered, not recommended now:** a self-hosted Judge0 (its README credits Isolate and Docker and claims sandboxed execution of untrusted code; its container privilege and cgroup requirements were not available in the fetched pages and are unverified, https://github.com/judge0/judge0) adds a Ruby service, its own queue, and a separate data model to an app that needs only a thin adapter. Other sandboxes (for example nsjail, gVisor) were not evaluated. Option A remains the fallback only if Isolate cannot be installed on the target host.

Isolate's guarantees depend on correct host setup. They must be verified on the target host with the conformance and escape tests in section 8 before any real submission is accepted.

## 5. Sandbox profile, resource limits, and languages

### Isolation profile
- **Network:** none (Isolate's default new network namespace). Never `--share-net`. The worker host additionally has outbound traffic blocked by firewall rule except to the web app's private address.
- **Privilege:** the worker process runs as a non-root service user. Only the Isolate helper is setuid. The job runs as Isolate's per-box unprivileged uid. No Docker socket, no `--privileged`, no host bind mounts beyond read-only runtime directories requested by directory rules.
- **Filesystem:** the box has its own filesystem namespace with only requested subtrees. Source, binary, and scratch files live in the box directory, which is wiped after each run.
- **Environment:** default (nothing inherited). Pass only what the toolchain needs, for example `PATH` and `HOME`.
- **System calls:** Isolate documents system-call restrictions that are on by default (`--syscalls`). Their exact contents and their effect on g++ and Python are not yet verified and must be tested on the target host.
- **Memory:** `--cg-mem` plus swap off. Treat memory-limit enforcement as unverified until the conformance test passes on the target kernel.

### Limits (configurable defaults, mapped to Isolate options)
| Limit | Default | How enforced | On exceed |
|---|---|---|---|
| CPU time per test | `problem.timeLimitMs` or 2000 ms | `--time` (OS CPU time; the manual recommends this as the main limit) plus `--extra-time` grace | `TIME_LIMIT` |
| Wall time per test | 2 to 3 times CPU time | `--wall-time` (guards against sleeping programs) | `TIME_LIMIT` |
| Memory | `problem.memoryLimitMb` or 256 MiB | `--cg-mem` with `--cg`; `cg-oom-killed` in meta | `MEMORY_LIMIT` |
| Processes and threads | 16 for C++ and Python (the Isolate default of 1 blocks threads) | `--processes` | `RUNTIME_ERROR` |
| Output size | 64 KiB per test | `--fsize` caps files; stdout is redirected to a file and the worker checks its size before reading | `OUTPUT_LIMIT` |
| Disk | box directory only | `--fsize` per file; a total disk quota on the box filesystem is **not verified** in the fetched documentation and must be confirmed (use a size-limited filesystem for the box root if not) | `RUNTIME_ERROR` |
| Compile time and memory | 10 s, 512 MiB (g++ needs more than a run) | same options, in a separate box | `COMPILE_ERROR` on diagnostics, `INTERNAL_ERROR` on sandbox failure |
| Source size | 64 KiB | web app, before insert | rejected at submit |
| Concurrent jobs per worker | 1 on a laptop, up to the CPU count in production | worker semaphore | queued |
| Pending submissions per user | 3 | web app, at submit | rejected with a message |

The web app rejects oversize input; the worker enforces run limits. Production values must be sized for the real host, not for the development laptop.

### Languages
- **Python 3 (first).** No compile step. Run `python3 -I script.py` with arguments passed as an array (never a shell). Per the Python documentation (https://docs.python.org/3/using/cmdline.html), `-I` runs isolated mode, implies `-E`, `-P`, and `-s`, and keeps the script's directory and user site-packages off `sys.path` and ignores `PYTHON*` environment variables. **It is not a security boundary**; the sandbox is. Pin the interpreter version in the worker image.
- **C++17 (second).** `g++ -std=c++17 -O2` with a fixed argument array in a compile box (no network), then run the binary per test. Pin the g++ version. Block absolute-path includes of host files by compiling inside the box, where the host filesystem is not visible.
- Other languages are out of scope until these two are stable.
- **Command construction:** every process is started from an argument array. User text is written to a file in the box and is never interpolated into a command string.
- **Stdin and stdout:** the test input is written to a file and given on stdin. Stdout is redirected to a file in the box and read up to the cap. Normalization is identical to `gradeOutput` (trailing whitespace per line and trailing newlines ignored), implemented in one shared function used by the worker and by the web app's hashing of stored expected outputs.
- **Per-test behaviour:** a fresh process per test so global state cannot leak between tests.

## 6. Verdicts and test-case security

### Verdicts
Names match the existing `SubmissionStatus` where they exist; **new values are proposed schema changes**.

| Verdict (enum value) | Meaning | Cause |
|---|---|---|
| `ACCEPTED` | Compiled, and every test (samples and hidden) matched | none |
| `WRONG_ANSWER` | A test ran within limits and its output hash did not match | User |
| `TIME_LIMIT` | Isolate meta `status` TO, or time limit hit | User |
| `MEMORY_LIMIT` (new) | `cg-oom-killed` or memory limit hit | User |
| `OUTPUT_LIMIT` (new) | Output file exceeded the cap | User |
| `RUNTIME_ERROR` | Meta `RE` (non-zero exit) or `SG` (signal) not explained by memory or time | User |
| `COMPILE_ERROR` | The compiler returned diagnostics | User |
| `INTERNAL_ERROR` (new) | Meta `XX`, worker or sandbox failure, malformed result, retries exhausted | Platform |
| `PENDING`, `RUNNING` (new) | Not terminal | none |

### Determining the verdict
- Compile first. A compile failure is `COMPILE_ERROR`, and no test runs.
- Tests run in order. The first non-accepted test sets the verdict and stops the run. The failing test's index is stored.
- The **web app** computes the verdict from the worker's per-test records (exit class, time, memory, output hash). `ACCEPTED` requires that the number of per-test records equals the number of tests sent, every record is clean, and every output hash equals the stored expected hash. A top-level verdict or `success` flag from the worker is ignored.
- Infrastructure failures are `INTERNAL_ERROR`. They never become `WRONG_ANSWER` and are retried (section 3).
- Partial results: a per-test list (index, isSample, verdict, runtimeMs) is stored. The owner sees it for samples only. For hidden tests the owner sees the verdict and the failing index as a number, never input or expected output (mirrors AUD-001).

### Test-case security
- **Storage.** Test cases stay in `TestCase` in the main database. Expected outputs are hashed (SHA-256 of the normalized output) when stored or at job time. The worker receives inputs only (decision D1).
- **Versioning.** `Problem.testVersion` (proposed) is bumped on any test edit and recorded on each `Submission`, so an edit does not change the meaning of past verdicts. A result for a stale version is rejected and re-queued.
- **Modification.** Only `requireAdmin()` routes write `TestCase` (already true in `src/app/admin/problems/actions.ts`). Users have no write path.
- **Leakage.** Hidden inputs and outputs must not appear in server action responses, polling responses, logs (the worker logs test ids, never content), error messages, the compile log shown to users, or the sandbox image. A test asserts that serialized responses contain neither hidden expected nor hidden input values, extending the existing `checkOutput` leak tests.
- **Samples** are public by design (`isSample: true`).

## 7. API contract, schema changes, and configuration (all PROPOSED)

### Web app (proposed)
- `submitCode(form)`: `problemId`, `language` (`python` or `cpp`), `code`, optional `contestId`. Returns `{ ok: true, submissionId }` or `{ ok: false, error }`. Never returns verdicts or test data. Session required.
- `getSubmissionStatus(submissionId)`: owner only. Returns `{ status, runtimeMs, memoryKb, failedIndex?, samples: [{ index, verdict, input, expected, actual? }] }`. Hidden tests contribute only a verdict and index.
- `POST /internal/judge/claim`: worker only. Returns `{ submissionId, attempt, language, code, limits, tests: [{ id, input }] }`. No expected outputs.
- `POST /internal/judge/heartbeat`: worker only. Extends the lease for `(submissionId, attempt)`.
- `POST /internal/judge/result`: worker only. Body `{ submissionId, attempt, compile: { ok, log }, perTest: [{ testId, exitClass, timeMs, memoryKb, outputSha256, outputBytes }], workerVersion }`. Idempotent per `(submissionId, attempt)`.
- `awardContestSolve(entryId, userId, problemId, at = new Date())`: add the optional time argument used by ingest.

### Proposed schema changes (NOT applied; require a migration after approval)
1. `SubmissionStatus`: add `RUNNING`, `MEMORY_LIMIT`, `OUTPUT_LIMIT`, `INTERNAL_ERROR`. Keep the existing values.
2. `Submission`: add `contestId String?`, `attempt Int @default(0)`, `claimedBy String?`, `leaseExpiresAt DateTime?`, `failedIndex Int?`, `memoryKb Int?`, `compileLog String?` (truncated), `testVersion Int?`, `judgedAt DateTime?`. Add `@@index([status, leaseExpiresAt])` for the claim query.
3. `Problem`: add `testVersion Int @default(1)`. Optionally `TestCase.expectedSha256 String?` if hashes are stored rather than computed per job.
4. A `SubmissionTestResult` table is optional; the verdict and failing index are enough for version one.

### Configuration (proposed, names only)
`JUDGE_ENABLED`, `JUDGE_WORKER_TOKEN` (web and worker, at least 32 random bytes), `JUDGE_BASE_URL` (worker only, the web app's private address), `JUDGE_CONCURRENCY` (default 1), `JUDGE_DEFAULT_TIME_MS`, `JUDGE_DEFAULT_MEMORY_MB`, `JUDGE_OUTPUT_CAP_KB`, `JUDGE_COMPILE_TIME_MS`, `JUDGE_LEASE_MS` (default 60000), `JUDGE_MAX_SOURCE_KB` (web, default 64). No secrets in this document; values go in a git-ignored `.env` and the deployment secret store.

## 8. Testing strategy

Mocked unit tests (Vitest, like the existing suites) are distinct from PostgreSQL integration tests and from host-level sandbox tests. Mocked tests do not prove database concurrency or isolation.

1. **Unit (mocked Prisma).** Verdict calculation from per-test records. Ingest rejects unknown, stale-attempt, non-RUNNING, missing-test, and extra-test results. Forged top-level `success` is ignored. Contest membership, timer, and `at` handling. Hidden-field stripping in status responses.
2. **Integration (real PostgreSQL, not yet run).** Concurrent claims with `SKIP LOCKED` give no double claim. Duplicate ingest for one attempt gives one terminal write and one reward. Lease expiry and reclaim. Rollback leaves no partial reward. The `ON CONFLICT DO NOTHING` concurrency of `awardSolve` is also still unverified against a real database.
3. **Worker unit.** Commands are argument arrays. Output-cap enforcement. Normalization matches `gradeOutput` (shared function, tested against the same cases).
4. **Sandbox conformance (target host).** Each limit is enforced: a busy loop hits `TIME_LIMIT`, a sleeping program hits the wall limit, a large allocation hits `MEMORY_LIMIT` (confirm `cg-oom-killed`), a huge print hits `OUTPUT_LIMIT`, a fork loop hits the process cap, a large file write hits the file or disk cap, and a 30 s compile bomb hits the compile limit.
5. **Sandbox escape (adversarial).** From inside a box: read host paths outside the box, open sockets to a private address, to 169.254.169.254, and to the web app and database ports, list or read other boxes, call `mount`, `ptrace`, `unshare`, and attempt `setuid`. Each must fail, and the test checks the failure reason, not just a non-zero exit.
6. **Leak tests.** Serialized responses, worker logs, and compile logs contain no hidden input or expected values.
7. **Resource-exhaustion soak.** Many concurrent malicious submissions. The worker stays responsive, boxes and cgroups are cleaned up, and the host stays healthy.

A stage passes only when the real command output and exit code are recorded.

## 9. Deployment, resource plan, and operations (proposed)

### Development on the 5.3 GiB dual-core laptop
- Services running: Postgres, the Next.js dev server, and one worker with `JUDGE_CONCURRENCY=1`. No Redis, no message broker, no extra containers. Rough peak planning figures (estimates, not measured): Postgres about 0.1 to 0.2 GiB, Next.js dev about 0.5 to 1 GiB, a g++ compile up to about 0.5 GiB, a run capped at 256 MiB. This should fit with headroom at concurrency 1, but it must be measured.
- Prerequisites to check first on Linux Mint: cgroup v2 is active (`stat -fc %T /sys/fs/cgroup` should print `cgroup2fs`), kernel version (5.19 or newer for memory reporting per the manual), and that swap can be turned off or is tolerated for dev. Isolate must be installed setuid root by someone who accepts that tradeoff on a development machine.
- Unit and integration tests for the protocol use a **fake runner that returns canned per-test records and never executes user code.** The real Isolate backend is selected explicitly, and the worker **fails closed**: with `JUDGE_ENABLED=true` and no working sandbox it reports `INTERNAL_ERROR` rather than running code unsandboxed.
- Trade-off: this lightweight setup runs one job at a time, has no network isolation test beyond Isolate's own, and shares a machine with your other work. It is for correctness work, not for accepting untrusted public submissions.

### Production
- The worker runs on a **separate host or VM** from the web app and database, in a network segment with only a path to the web app's internal routes and outbound traffic otherwise blocked. Sized from measured load, not from the laptop.
- Isolate needs a host or VM it can configure (setuid helper, cgroup v2, swap off). A purely container-based platform that cannot grant this is a poor fit; see risks.
- **Observability:** log verdict counts, queue depth, claim latency, lease expiries, and `INTERNAL_ERROR` rate. Never log code bodies or test data.
- **Abuse:** per-user rate limit and pending-queue cap; repeated timeouts surface to admins.
- **Rollout:** feature-flag the judge. When it is live for a problem, `checkOutput` must stop awarding that problem, so there is a single reward path. Keep `checkOutput` for problems the judge does not cover until the judge passes the integration and sandbox tests.

## 10. Phased implementation plan (after approval)
1. **Phase 0 (small).** Review and apply the schema proposal, env variables, feature flag, the `at` parameter on `awardContestSolve`. No behaviour change.
2. **Phase 1 (medium).** Web routes (`submitCode`, status, claim, heartbeat, result) and the worker skeleton with the fake runner. Mocked unit tests plus PostgreSQL integration tests.
3. **Phase 2 (large).** Isolate-backed Python runner, limit conformance and escape tests on the target Linux host.
4. **Phase 3 (medium).** C++ support, editor and polling UI, verdict display.
5. **Phase 4 (medium).** Production hardening: separate worker host, firewalling, monitoring, sweeper, per-user limits, `Dockerfile` non-root fix (AUD-003) for the web image.

## 11. Decisions needed from you (before implementation)
- **D1.** Verdict comparison: web app compares output hashes (recommended; the worker never sees expected outputs, a stolen token cannot mint `ACCEPTED`) versus the worker comparing full expected outputs (simpler, supports custom checkers later, but the worker must be trusted with hidden answers).
- **D2.** Judge host: is a separate Linux host or VM available for the worker (needed for Isolate per its manual)? Or is a development-only local setup acceptable for the first phase?
- **D3.** Until the judge exists, should `checkOutput` keep awarding solves on internal problems (current behaviour after the AUD-004 pass), or award nothing and become a sample-only practice tool? The paste flow is not real verification (section 1).
- **D4.** Schema changes in section 7, including whether to add an `Activity` link so unmark and remark cannot re-grant streak activity (an AUD-004 gap).

## 12. Unresolved risks, assumptions, and corrections to the earlier draft
- **Not verified:** Isolate on the target kernel and cgroup setup; memory-limit enforcement; whether Isolate's default system-call restrictions permit g++ and Python; disk quota options; Judge0's privilege requirements; real PostgreSQL concurrency for `awardSolve`, `awardContestSolve`, claim, and ingest. No command in this design has been run on a real host.
- Kernel-level escape risk is accepted, not eliminated.
- The pasted-output flow remains weak until the judge exists (section 1, decision D3).
- Hidden test inputs are not currently shown to learners; a judge removes the need because the server runs their code on them.
- Unmark and remark of a solve leaves the earlier `problem_solved` activity and writes a new one for EXTERNAL problems, which can keep a streak alive. Fixing it needs a schema change (D4).
- The `Dockerfile` runs as root and uses `npm install` (AUD-003). Not addressed here.
- **Corrections to the earlier draft:** (1) it placed Isolate inside an unprivileged, capability-free container, which contradicts the Isolate manual (setuid root; containers "not recommended" and would need privileges); (2) it said the worker had no database credentials but also claimed rows directly with `SKIP LOCKED`; claiming now happens in the web app; (3) its verdict names did not match the existing enum; (4) it checked contest timing at ingest time with "now", which would penalise queue latency; (5) it omitted `Submission.contestId`; (6) its Isolate and Python claims were unverified and are now quoted from the primary documentation.

## Sources
- Isolate manual (INSTALLATION, SPECIAL OPTIONS, LIMITS, CONTROL GROUPS, META-FILES): https://raw.githubusercontent.com/ioi/isolate/master/isolate.1.txt, and the project page https://github.com/ioi/isolate
- Python command line, `-I`, `-E`, `-P`, `-s`: https://docs.python.org/3/using/cmdline.html
- Judge0 repository (acknowledgments and feature summary only): https://github.com/judge0/judge0

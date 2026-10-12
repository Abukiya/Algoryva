# Algoryva Curriculum Audit

Honest status after the geometry, contest-skills and visualization pass. Every number below was counted from the files in this archive, not carried over from earlier audits.

## Numbers

| | Count | Notes |
|---|---|---|
| Topics in the curriculum | 40 | `src/lib/curriculum.ts` |
| Published topics | 40 | Every topic is published. None are planned-only. |
| Full lessons (meet the standard) | 40 | `src/content/lessons-v2/`. A test fails if a published topic lacks one. |
| Mastery questions | 238 | Each re-derived by hand; numeric answers computed. |
| Visualizations registered | 57 | All 57 are used by at least one lesson. |
| Original problems | 40 | `src/content/originalProblems.ts`, each with samples and hidden tests. |
| Original problems with a reference solution | 40 | Each cross-checked against an independent brute force on 400 random inputs. |
| External practice links | 275 | Harvested from lecture slides. Tiers and titles are estimates; see the review checklist. |

## What this pass added

- **Computational Geometry** (new full lesson): cross product and orientation, shoelace area, Pick's theorem, segment intersection, convex hull by monotone chain. Five original problems: orientation test, twice the area, hull corners, segment touching, and a challenge (interior lattice points). The hull and interior-point results are checked by independent methods.
- **Contest Strategy & Time Management** (new full lesson): a contest as a 0/1 knapsack, with a worked counterexample where ranking by points per minute loses to the exact table (160 points against 220).
- **Upsolving & Pattern Recognition** (new full lesson): the upsolve process, a contest log analysed by a script, and review spacing.
- **Visualizations** (7 new): Prim, Bellman–Ford, Floyd–Warshall, quicksort partition, segment-tree point update, the monotone-chain hull, the contest knapsack table and the upsolve recognition map. Prim, Bellman–Ford, Floyd–Warshall, the partition and the segment update are placed in the MST, Shortest Paths, Sorting II and Segment Tree lessons.
- **Older problems now verified**: seven original problems that had hidden tests but no reference solution (range sums, pair with target, first position at least x, longest window under budget, balanced brackets, count islands, stair ways) now have references, each cross-checked against a different method.

## Verification done in the sandbox (real exit codes or executed results)

These ran here, on the full project, without a network connection:

- `scripts/original_problem_tools.py generate`: exit 0. All 40 reference solutions agree with their independent brute forces on 400 random inputs each.
- Hidden tests: the regenerated cases for the 28 earlier problems are byte-identical to the committed `hiddenTests.ts`.
- Reference solutions re-run on every sample and hidden test for each problem listed in `WITH_REFERENCE`: no mismatches.
- Lessons: all 40 lessons compiled with the TypeScript compiler (ES2022 target and the `@` path alias, matching the project's tsconfig), every lesson's quality checks run (zero failures), and every Python snippet in every lesson is executed against its `# value` comments: 234 snippets, 666 promised outputs, zero failures. This reproduces `lessons.test.ts` without Vitest.
- Visualizers: the 38 existing generator tests and 7 new ones were executed through a small Vitest-compatible shim: 45 of 45 pass.
- The new and changed TypeScript source files type-check under the project's ES2022 target, with the exception of the test file, which lacks Vitest's type definitions in this sandbox.

## What was NOT verified here

- `npm ci` could not run: the sandbox has no network access, so `node_modules` is incomplete. Vitest, tsc, eslint, `next build` and the Prisma CLI were therefore not run through the project's own commands.
- Database: no PostgreSQL. `prisma migrate dev --name quiz_results` (the `QuizResult` migration) has not been generated, and the seed and e2e tests have not run.
- Browser: no visual, mobile, dark-mode, reduced-motion, keyboard or accessibility checks were possible.

## Known limitations

1. The admin CMS still edits only the outline text of topics without a full lesson. Full lessons live in code.
2. External links: 275 entries, with tiers and difficulties estimated from lecture position. None were checked against the live sites.
3. The ten original-content topics have no external practice links.
4. Challenge-tier original problems: only Segment Tree and Computational Geometry have one. The other nine original-content topics still need a challenge problem and editorial.
5. Content gaps not written: binary tries and max-XOR, suffix arrays and automata, Aho–Corasick, Manacher, Lucas's theorem, Chinese remainder theorem, Miller–Rabin and Pollard's rho, A*, bridges and articulation points, strongly connected components, max flow, BST deletion and balanced trees, a dedicated hashing lesson, DP optimisations (divide and conquer, convex hull trick, Knuth), sum-over-subsets, rerooting, broken-profile and probability DP.
6. Segment tree: the point update is visualized; the lazy-propagation visualization is not.
7. Only Python is taught. Snippets need Python 3.10 or newer (see the README).

## Recommended next steps, in order

1. Run the real command list in an environment with network access and PostgreSQL: `npm ci`, `npx tsc --noEmit`, `npx eslint .`, `npm run build`, `npx vitest run`, `npx prisma migrate dev --name quiz_results`, `npm run db:seed`, `npm run test:e2e`.
2. Work through `docs/HUMAN_REVIEW_CHECKLIST.md`: teacher review of prose, three beginner trials, and verification of the 275 external links.
3. Write challenge problems and editorials for the nine original-content topics that lack one, with reference solutions and brute-force cross-checks.
4. Write the content gaps in section 5, each as a complete lesson that passes the gate, or leave it unpublished.
5. Add the lazy-propagation visualization and browser-check the visualizers.
6. Extend the admin CMS to structured lessons, or move lessons to the database.

# Human review checklist

Tests check that lessons have every required part and that the code in them runs and prints what it promises. They cannot judge clear writing, teaching order, whether an example shows its point, or whether an external link still exists. This checklist covers those things. Nothing here has been done by a person yet.

## 1. Teacher review of lesson prose (about 40 lessons)

For each lesson in `src/content/lessons-v2/`, read it in order, as a learner would, and note:

- Does the hook say why the topic exists, in one sentence a beginner understands?
- Does any example fail to show the point it is meant to show? (A wrong or weak example is the most common error the tests cannot catch.)
- Is any sentence correct only for Python and misleading in another language? Check operator precedence and integer behaviour especially.
- Does a numeric claim (a bound, a count, a timing) have a stated reason?
- Are mastery answers defensible? Re-derive each one by hand before trusting it; the expected answer is in the `checks` array.

Priority order: the first three lessons a beginner meets (python-basics, lists-tuples, sets-dicts), then the new lessons (geometry, contest-strategy, upsolving), then the lessons with the most original material (shortest-paths, mst, dp-bottom-up, segment-tree, dp-advanced).

## 2. Beginner trial

Ask three real beginners to work through python-basics, lists-tuples and sets-dicts without help. Record, for each lesson:

- the first place they stopped or re-read a section,
- any question they asked that the lesson should have answered,
- whether they could solve one of the worked problems unaided.

Feed the notes back into the lesson text. This is the only check of clarity for the material.

## 3. External practice links (275 entries)

`src/content/externalProblems.ts` holds 275 links harvested from lecture slides. Their **tiers and difficulties are estimates**, and titles for LeetCode and HackerRank were derived from URL slugs. For each entry, confirm:

- the URL opens and points to the problem named,
- the tier and difficulty roughly match the problem,
- the topic is right.

Do not invent links to fill the gaps. The ten original-content topics (shortest-paths, mst, dp-bottom-up, fenwick-tree, segment-tree, sparse-table, bit-manipulation, string-algorithms, number-theory, dp-advanced) have no external links; a person should propose and verify any that are added.

## 4. Process topics

Contest Strategy and Upsolving describe practice, so a reader who competes should check that the advice matches real contests: the time-budget reasoning, the penalty advice, and the upsolve process. This review is more useful than another automated test.

## 5. Things that need a running environment

These were not run in the sandbox that produced this pass. Run them in a real environment with Node, PostgreSQL and a browser:

- `npm ci`, `npx tsc --noEmit`, `npx eslint .`, `npm run build`, `npx vitest run`
- `npx prisma migrate dev --name quiz_results`, then `npm run db:seed` (confirm re-seeding is idempotent)
- `npm run test:e2e` (never run before)
- visual checks: visualizer layouts (node and label overlap in the tree and segment-tree views), stepper on a phone-width screen, dark mode, reduced motion, keyboard use
- accessibility: an axe scan of a lesson page, contrast, focus order

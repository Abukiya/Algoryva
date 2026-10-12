# Algoryva Lesson Quality Standard

A lesson may be shown as a **Full lesson** only if it meets this standard. Anything else stays an **Outline**: it is labelled as one on the lesson page, the roadmap, topic cards and search, and it is kept out of search-engine indexes.

## The test

A beginner must be able to answer all of these from the lesson alone: What is this? Why does it exist? What problem does it solve? When should I use it? How does it work? Can I see it? Can I implement it? What is its complexity and why? What mistakes should I avoid? How do I recognise it in a contest? Can I solve a problem with it?

## Required ingredients (enforced by `src/lib/lesson-quality.ts`)

| Ingredient | Section kind | Rule |
|---|---|---|
| Why it exists | `hook` | One sentence, at least 20 characters |
| Learning objectives | `objectives` | At least 3 |
| Intuition before formalism | `intuition` | Plain language, an analogy where one helps |
| Concept | `concept` | Accurate, not oversimplified to the point of being wrong |
| Naive approach and its cost | `naive` | **Required for technique topics** (`TECHNIQUE_TOPICS`): show the brute force, then why it wastes work |
| Observation | `observation` | The insight that removes the waste |
| Visualization | `viz` | At least one, from the registry in `src/lib/viz/index.ts`; must improve understanding, not decorate |
| Worked example | `example` | Concrete numbers traced by hand, before code |
| Implementation | `code` | Plan (pseudocode) then code, plus a walkthrough of at least 2 points |
| Complexity with reasons | `complexity` | Time and space, and **why** |
| Edge cases | `edge` | Empty, single element, duplicates, negatives, overflow, as relevant |
| Common mistakes | `mistakes` | Each with the fix |
| Pattern recognition | `recognize` | At least 3 signals, and when **not** to use it |
| Worked problems | `worked` | Representative problems, with a takeaway |
| Practice | tiers on the page | Warm-up, Core, Application, Challenge, each with a stated purpose |
| Mastery check | `checks` | At least 4 questions, each with an explanation shown after answering |
| Wrap-up | `summary`, `cheatSheet` | At least 3 key ideas, a cheat sheet |
| Depth | - | At least ~700 words of section text |

## Correctness rules (enforced by tests)

- Every Python snippet is **executed** by `lessons.test.ts`. A line of the form `print(expr)   # value` is a promise: the test fails if the real output differs.
- Quiz answers must have a valid index and an explanation.
- Every `viz` id must exist.
- Claims about complexity must be justified in the lesson, not asserted.
- Hand-traced tables must be checked against the code (we found and fixed one wrong expected value this way).
- **Quiz answers cannot be machine-checked.** Before publishing, dump every question and re-derive each marked answer by hand (`checks` in each lesson file). Across seven audits of 222 questions in total, one marked answer was wrong (children of heap index 2). Never mark an answer from memory.
- Read the prose after tests pass. Tests cannot tell that an example fails to demonstrate its own point.

## Teaching rules

1. Problem, intuition, naive way, why it fails, observation, algorithm, visual, pseudocode, code, complexity, edge cases, recognition, practice. Never start with code.
2. Adapt the mechanism to the topic: animation for sorting and pointers, call tree and stack for recursion, a table with dependency highlights for DP, a queue or stack beside a graph for traversals.
3. Mastery is not "opened the page": see `src/lib/mastery.ts` (completion, mastery check at 80%, practice, spaced review). None of it blocks progress.
4. Do not pad. One excellent lesson beats five thin ones. If it is not ready, leave it an outline.

## Copyright and attribution

The source slides are reference material only. Write original explanations and examples. Do not copy passages, figures or problem statements. For external problems store only title, platform, URL, topic and tier, and link to the original.

## Adding a lesson

1. Create `src/content/lessons-v2/<topic-slug>.ts` exporting a `LessonV2`.
2. Register it in `src/content/lessons-v2/index.ts`.
3. Add any new visualization generator to `src/lib/viz/generators.ts` with a test, and register an id in `src/lib/viz/index.ts`.
4. Add the slug to `TECHNIQUE_TOPICS` if it optimises something.
5. Run `npx vitest run src/content`. It must pass, including code execution.

## Original problems and hidden tests

Every original problem needs samples and at least three hidden tests (enforced by `src/content/problems.test.ts`). For any new problem:

1. Write a reference solution in `scripts/original_problem_tools.py` and an **independent brute force** that uses a different method (Floyd–Warshall against Dijkstra, subset enumeration against Kruskal, and so on).
2. Run `python3 scripts/original_problem_tools.py generate`. It refuses to produce tests unless the reference agrees with the brute force on hundreds of random small inputs.
3. Include edge cases by hand: smallest input, unreachable or impossible answers, ties, repeated or self-referencing items, and values beyond 32 bits.
4. Add the slug to `WITH_REFERENCE` in `src/content/reference.test.ts`, which re-runs the reference on every sample and hidden test.
5. State in the statement anything the tests exercise (repeated edges, self-loops, the output for impossible cases).
6. Check large-number claims in lessons by computing them (a binomial in the MST lesson was once wrong by a factor of 2.6).
7. State numeric bounds in a problem only after computing the worst case (a statement once claimed a sum fits in 64 bits when it can reach 4 × 10¹⁹, and another claimed a difference exceeded 32 bits when 2 × 10⁹ fits).
8. Check language-specific claims in the language being taught. A lesson once asserted C's operator precedence (`x & 1 == 0` is a trap) as if it were Python's; running the snippet showed Python evaluates it as intended. Say which languages a rule applies to.

## Process topics (Contest Strategy, Upsolving)

Two topics are about how to compete, not about an algorithm. They pass the same gate, with these decisions, and nothing is waived:

1. All required ingredients still apply: intuition, concept, visualization, example, code, complexity, edge cases, mistakes, recognition, worked problem, at least four mastery questions, summary and cheat sheet. The `naive` section is not required, because these topics do not optimise a computation.
2. The "code" section is a **planning model** that runs: Contest Strategy compares a points-per-minute greedy with an exact knapsack table, and Upsolving analyses a contest log and computes review dates. Their printed values are executed and checked like any other snippet.
3. The visualization is either an existing algorithm visual that models the planning problem (the knapsack table, for time budgets) or a **recognition map** (the upsolve map, which ticks one technique per upsolved problem). A recognition map is illustrative; its page says so in its prose.
4. Mastery questions are re-derived by hand, as for every lesson. Numeric answers were computed by running the code in the lesson.
5. Complexity claims are about the planning computation, not contest performance, which cannot be measured by a test.


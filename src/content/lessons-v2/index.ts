import type { LessonV2 } from "../lesson-types";
import { prefixSum } from "./prefix-sum";
import { binarySearch } from "./binary-search";
import { twoPointers } from "./two-pointers";
import { slidingWindow } from "./sliding-window";
import { bfs } from "./bfs";
import { dfs } from "./dfs";
import { unionFind } from "./union-find";
import { stacksQueues } from "./stacks-queues";
import { recursion1 } from "./recursion-1";
import { dpTopDown } from "./dp-top-down";
import { complexity } from "./complexity";
import { arrays } from "./arrays";
import { sortingBasics } from "./sorting-basics";
import { trees } from "./trees";
import { linkedLists } from "./linked-lists";
import { greedy } from "./greedy";
import { heap } from "./heap";
import { graphs } from "./graphs";
import { pythonBasics } from "./python-basics";
import { listsTuples } from "./lists-tuples";
import { setsDicts } from "./sets-dicts";
import { pythonBuiltins } from "./python-builtins";
import { codingPractices } from "./coding-practices";
import { numerics } from "./numerics";
import { topologicalSort } from "./topological-sort";
import { sortingAdvanced } from "./sorting-advanced";
import { recursion2 } from "./recursion-2";
import { shortestPaths } from "./shortest-paths";
import { mst } from "./mst";
import { dpBottomUp } from "./dp-bottom-up";
import { fenwickTree } from "./fenwick-tree";
import { segmentTree } from "./segment-tree";
import { sparseTable } from "./sparse-table";
import { bitManipulation } from "./bit-manipulation";
import { stringAlgorithms } from "./string-algorithms";
import { numberTheory } from "./number-theory";
import { dpAdvanced } from "./dp-advanced";
import { geometry } from "./geometry";
import { contestStrategy } from "./contest-strategy";
import { upsolving } from "./upsolving";

/** Lessons written to the standard in docs/LESSON_QUALITY_STANDARD.md. Each file exports one lesson. */
const modules: LessonV2[] = [prefixSum, binarySearch, twoPointers, slidingWindow, bfs, dfs, unionFind, stacksQueues, recursion1, dpTopDown, complexity, arrays, sortingBasics, trees, linkedLists, greedy, heap, graphs, pythonBasics, listsTuples, setsDicts, pythonBuiltins, codingPractices, numerics, topologicalSort, sortingAdvanced, recursion2, shortestPaths, mst, dpBottomUp, fenwickTree, segmentTree, sparseTable, bitManipulation, stringAlgorithms, numberTheory, dpAdvanced, geometry, contestStrategy, upsolving];
export const LESSONS_V2: Record<string, LessonV2> = Object.fromEntries(modules.map((l) => [l.topic, l]));
export const isComplete = (slug: string) => slug in LESSONS_V2;

/** Topics whose lesson must show the naive approach first (techniques that optimise something). */
export const TECHNIQUE_TOPICS: ReadonlySet<string> = new Set(["prefix-sum", "binary-search", "two-pointers", "sliding-window", "dp-top-down", "stacks-queues", "union-find", "greedy", "heap", "shortest-paths", "mst", "dp-bottom-up", "fenwick-tree", "segment-tree", "sparse-table", "dp-advanced"]);

import { describe, expect, it } from "vitest";
import { binarySearch, linearSearch, prefixSums, slidingWindowMax, twoPointers, arrayTraversal } from "./arrays";
import { parseDsu, parseFenOps, parseIntervals, parseSegOps, parseWords, parseGraph, parseInt1, parseInts, parseOps, parseQueries, sortedError } from "./parse";
import { ALGORITHMS, algosForLesson, clampIndex, defaultsOf, getAlgorithm, runAlgorithm } from "./registry";
import { bubbleSort, heapSort, insertionSort, mergeSort, quickSort, selectionSort } from "./sorting";
import { bstSearch, queueOps, stackOps } from "./structures";
import type { ArrayGen, Edge, Gen, GraphGen, GridGen } from "./types";
import { bellmanFord, bfs, dfs, dijkstra, topoSort, type Graph } from "./graphs";
import { components, kruskal, prim } from "./mst";
import { dsuOps, type DsuOp } from "./dsu";
import { fenwickOps, type FenOp } from "./fenwick";
import { trieOps } from "./trie";
import { intervalGreedy } from "./greedy";
import { nQueens, subsetSum } from "./backtrack";
import { segmentTreeOps, type SegOp } from "./segtree";
import { CHALLENGES } from "./challenges";
import { bstOps } from "./bst";
import { trieDynamic, type TrieOp } from "./trieops";
import { parseTrieOps } from "./parse";
import type { Op } from "./types";
import { climbingStairs, coinChange, floyd, knapsack, lcs } from "./dp";

/** Deterministic pseudo-random numbers so failures reproduce. */
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) % 2147483648;
    return s / 2147483648;
  };
}
const randomArray = (rnd: () => number, n: number, lo: number, hi: number) =>
  Array.from({ length: n }, () => lo + Math.floor(rnd() * (hi - lo + 1)));

function genOf(id: string, raw: Record<string, string>): Gen {
  const algo = getAlgorithm(id);
  if (!algo) throw new Error(`unknown algorithm ${id}`);
  const out = runAlgorithm(algo, raw);
  if (!out.ok) throw new Error(out.error);
  return out.gen;
}
function arrayGen(id: string, raw: Record<string, string>): ArrayGen {
  const g = genOf(id, raw);
  if (g.kind !== "array") throw new Error("expected an array visualization");
  return g;
}
const errorOf = (id: string, raw: Record<string, string>): string => {
  const algo = getAlgorithm(id);
  if (!algo) throw new Error(`unknown algorithm ${id}`);
  const out = runAlgorithm(algo, raw);
  if (out.ok) throw new Error("expected the input to be rejected");
  return out.error;
};
const sumRange = (a: number[], l: number, r: number) => a.slice(l, r + 1).reduce((x, y) => x + y, 0);

describe("registry", () => {
  it("every preset runs, except the ones meant to be rejected, and every frame points at a real pseudocode line", () => {
    for (const algo of ALGORITHMS) {
      expect(algo.presets.length, algo.id).toBeGreaterThan(0);
      for (const preset of algo.presets) {
        const out = runAlgorithm(algo, preset.values);
        if (preset.label.includes("rejected")) {
          expect(out.ok, `${algo.id}: ${preset.label} should be rejected`).toBe(false);
          continue;
        }
        expect(out.ok, `${algo.id}/${preset.label}: ${out.ok ? "" : out.error}`).toBe(true);
        if (!out.ok) continue;
        const frames = out.gen.frames;
        expect(frames.length, `${algo.id}/${preset.label} has frames`).toBeGreaterThan(0);
        for (const f of frames) {
          expect(f.line >= 0 && f.line < algo.pseudocode.length, `${algo.id} line ${f.line}`).toBe(true);
          expect(f.note.length).toBeGreaterThan(0);
        }
      }
    }
  });

  it("defaults come from the first preset and every algorithm has a lesson link or none", () => {
    const bs = getAlgorithm("binary-search");
    expect(bs && defaultsOf(bs).target).toBe("11");
    expect(algosForLesson("binary-search").map((a) => a.id)).toContain("binary-search");
    expect(algosForLesson("no-such-lesson")).toEqual([]);
  });

  it("clampIndex keeps step indices in range", () => {
    expect(clampIndex(-1, 5)).toBe(0);
    expect(clampIndex(9, 5)).toBe(5);
    expect(clampIndex(3, 5)).toBe(3);
    expect(clampIndex(4, 0)).toBe(0);
  });

  it("running an algorithm never mutates the raw input it was given", () => {
    const raw = { array: "5, 2, 4, 1, 3" };
    const before = { ...raw };
    runAlgorithm(getAlgorithm("heap-sort")!, raw);
    runAlgorithm(getAlgorithm("quick-sort")!, raw);
    expect(raw).toEqual(before);
  });
});

describe("sorting visualizers", () => {
  const sorts: [string, (a: number[]) => ArrayGen][] = [
    ["bubble", bubbleSort],
    ["selection", selectionSort],
    ["insertion", insertionSort],
    ["merge", mergeSort],
    ["quick", quickSort],
    ["heap", heapSort],
  ];
  const cases: number[][] = [[], [1], [2, 1], [5, 5, 5], [4, 1, 4, 2, 1, 4, 3], [9, 8, 7, 6, 5, 4, 3, 2, 1]];
  const rnd = seeded(42);
  for (let k = 0; k < 40; k++) cases.push(randomArray(rnd, 1 + (k % 14), -20, 20));

  for (const [name, sort] of sorts) {
    it(`${name} sort ends with the correct sorted array and keeps every frame the same length`, () => {
      for (const input of cases) {
        const copy = [...input];
        const g = sort(input);
        expect(input, `${name} must not mutate its input`).toEqual(copy);
        const want = [...input].sort((x, y) => x - y);
        expect(g.frames.at(-1)?.values, `${name} on ${JSON.stringify(input)}`).toEqual(want);
        expect(g.result).toBe(want.join(", "));
        for (const f of g.frames) expect(f.values.length).toBe(input.length);
      }
    });
  }

  it("bubble sort marks its final place and dims the sorted tail", () => {
    const g = bubbleSort([3, 1, 2]);
    expect(g.frames.some((f) => f.dim && f.dim.length > 0)).toBe(true);
  });

  it("heap sort with duplicates still sorts", () => {
    expect(heapSort([4, 1, 4, 2, 1, 4, 3]).result).toBe("1, 1, 2, 3, 4, 4, 4");
  });
});

describe("array and searching visualizers", () => {
  it("linear search agrees with indexOf, including the empty array", () => {
    const a = [7, 2, 9, 4, 1];
    expect(arrayGen("linear-search", { array: "7 2 9 4 1", target: "9" }).result).toBe("index 2");
    expect(linearSearch(a, 5).result).toBe("-1 (not found)");
    expect(linearSearch([], 5).result).toBe("-1 (not found)");
    expect(linearSearch(a, 7).result).toBe(`index ${a.indexOf(7)}`);
  });

  it("binary search finds every present value and rejects absent ones", () => {
    const a = [1, 3, 5, 7, 9, 11, 13, 15];
    for (const v of a) {
      const g = binarySearch(a, v);
      expect(g.result).toBe(`index ${a.indexOf(v)}`);
    }
    expect(binarySearch(a, 8).result).toBe("-1 (not found)");
    expect(binarySearch([], 3).result).toBe("-1 (not found)");
    expect(binarySearch([4], 4).result).toBe("index 0");
    expect(binarySearch([4], 5).result).toBe("-1 (not found)");
  });

  it("binary search with duplicates returns an index that really holds the target", () => {
    const a = [1, 2, 2, 2, 3, 5];
    const g = binarySearch(a, 2);
    const idx = Number(g.result.replace("index ", ""));
    expect(a[idx]).toBe(2);
  });

  it("binary search rejects unsorted input before running", () => {
    expect(errorOf("binary-search", { array: "5, 1, 9, 3", target: "3" })).toMatch(/sorted/);
  });

  it("two pointers finds a valid pair or reports none, matching brute force", () => {
    const rnd = seeded(7);
    for (let k = 0; k < 30; k++) {
      const a = randomArray(rnd, 1 + (k % 9), 0, 12).sort((x, y) => x - y);
      const target = Math.floor(rnd() * 24);
      let exists = false;
      for (let i = 0; i < a.length; i++) for (let j = i + 1; j < a.length; j++) if (a[i] + a[j] === target) exists = true;
      const g = twoPointers(a, target);
      if (exists) {
        const m = /indices (\d+) and (\d+)/.exec(g.result);
        expect(m, `${JSON.stringify(a)} target ${target}`).not.toBeNull();
        expect(a[Number(m?.[1])] + a[Number(m?.[2])]).toBe(target);
      } else {
        expect(g.result).toBe("no pair");
      }
    }
  });

  it("sliding window returns the brute-force maximum window sum for every k", () => {
    const rnd = seeded(11);
    for (let t = 0; t < 25; t++) {
      const a = randomArray(rnd, 1 + (t % 10), -5, 9);
      for (let k = 1; k <= a.length; k++) {
        let best = -Infinity;
        for (let s = 0; s + k <= a.length; s++) best = Math.max(best, sumRange(a, s, s + k - 1));
        expect(slidingWindowMax(a, k).result).toBe(`sum ${best}`);
      }
    }
  });

  it("prefix sums answer every query the same as a direct sum", () => {
    const a = [2, 4, 1, 5, 3, 6];
    const qs: [number, number][] = [[1, 3], [0, 4], [3, 5], [0, 0], [5, 5]];
    const g = prefixSums(a, qs);
    expect(g.result).toBe(qs.map(([l, r]) => sumRange(a, l, r)).join(", "));
  });

  it("array traversal finds the maximum, and handles the empty array", () => {
    expect(arrayTraversal([3, 9, 2, 7, 5]).result).toBe("max 9");
    expect(arrayTraversal([]).result).toBe("none");
  });

  it("the shared run path rejects bad windows and queries with a message", () => {
    expect(errorOf("sliding-window", { array: "1, 2, 3", k: "4" })).toMatch(/between 1 and 3/);
    expect(errorOf("sliding-window", { array: "1, 2, 3", k: "0" })).toMatch(/between 1 and 3/);
    expect(errorOf("prefix-sums", { array: "1, 2, 3", queries: "0 3" })).toMatch(/0 <= l <= r < 3/);
    expect(errorOf("prefix-sums", { array: "1, 2, 3", queries: "2 1" })).toMatch(/0 <= l <= r/);
  });
});

describe("stack, queue and tree visualizers", () => {
  it("stack operations end in the correct state and handle underflow", () => {
    const g = stackOps([
      { name: "push", arg: 3 }, { name: "push", arg: 5 }, { name: "pop" }, { name: "push", arg: 7 }, { name: "peek" },
    ]);
    expect(g.result).toBe("stack [3, 7]; popped 5");
    const parsed = parseOps("push 3, push 5, pop, push 7, peek", { push: true, pop: false, peek: false });
    expect(parsed.ok).toBe(true);
    if (parsed.ok) expect(stackOps(parsed.value).result).toBe("stack [3, 7]; popped 5");
    const u = stackOps([{ name: "pop" }, { name: "push", arg: 1 }, { name: "pop" }, { name: "pop" }]);
    expect(u.result).toBe("stack empty; popped 1");
    expect(u.frames.some((f) => /underflow/.test(f.note))).toBe(true);
  });

  it("queue operations keep first-in first-out order and handle underflow", () => {
    const g = queueOps([{ name: "enqueue", arg: 3 }, { name: "enqueue", arg: 5 }, { name: "dequeue" }, { name: "enqueue", arg: 7 }, { name: "front" }]);
    expect(g.result).toBe("queue [5, 7]; removed 3");
    const u = queueOps([{ name: "dequeue" }]);
    expect(u.result).toBe("queue empty; removed nothing");
    expect(u.frames.some((f) => /underflow/.test(f.note))).toBe(true);
  });

  it("the tree shows every node after all insertions, and search reports correctly", () => {
    const values = [8, 3, 10, 1, 6, 14];
    const g: GraphGen = bstSearch(values, 6);
    const searchStart = g.frames.findIndex((f) => f.line === 8);
    expect(searchStart).toBeGreaterThan(0);
    const beforeSearch = g.frames[searchStart - 1];
    expect(beforeSearch.nodes.length).toBe(values.length);
    expect(beforeSearch.edges.length).toBe(values.length - 1);
    expect(g.result).toBe("6 is in the tree");
    expect(bstSearch(values, 7).result).toBe("7 is not in the tree");
  });

  it("a BST visualization keeps node positions fixed across frames", () => {
    const g = bstSearch([8, 3, 10, 1], 1);
    const pos = new Map<string, string>();
    for (const f of g.frames) {
      for (const n of f.nodes) {
        const seen = pos.get(n.id);
        const here = `${n.x},${n.y}`;
        if (seen !== undefined) expect(here).toBe(seen);
        pos.set(n.id, here);
      }
    }
  });

  it("BST insert rejects duplicates and oversized input", () => {
    expect(errorOf("bst", { insert: "5, 3, 5", target: "3" })).toMatch(/repeat/);
    expect(errorOf("bst", { insert: "1 2 3 4 5 6 7 8 9 10", target: "3" })).toMatch(/limit is 9|9/);
  });
});

describe("input parsing", () => {
  it("accepts commas, spaces, and mixed separators", () => {
    expect(parseInts("1, 2 3,4", "The array")).toEqual({ ok: true, value: [1, 2, 3, 4] });
    expect(parseInts("", "The array", { min: 0 })).toEqual({ ok: true, value: [] });
  });

  it("explains malformed numbers, empty input, too many values and out-of-range values", () => {
    const bad = parseInts("1 x 3", "The array");
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(bad.error).toContain('"x"');
    const empty = parseInts("", "The array");
    expect(empty.ok).toBe(false);
    const big = parseInts(Array.from({ length: 31 }, (_, i) => i).join(" "), "The array");
    expect(big.ok).toBe(false);
    const range = parseInts("1000", "The array");
    expect(range.ok).toBe(false);
    if (!range.ok) expect(range.error).toContain("999");
  });

  it("parses single integers and rejects decimals", () => {
    expect(parseInt1(" -7 ", "t")).toEqual({ ok: true, value: -7 });
    expect(parseInt1("3.5", "t").ok).toBe(false);
  });

  it("parses query ranges and rejects out-of-bounds ranges", () => {
    expect(parseQueries("1 3; 0 4", 6)).toEqual({ ok: true, value: [[1, 3], [0, 4]] });
    expect(parseQueries("", 6).ok).toBe(false);
    expect(parseQueries("1", 6).ok).toBe(false);
    expect(parseQueries("0 6", 6).ok).toBe(false);
  });

  it("reports unknown and value-less operations clearly", () => {
    const verbs = { push: true, pop: false };
    const unknown = parseOps("push 1, jump", verbs);
    expect(unknown.ok).toBe(false);
    if (!unknown.ok) expect(unknown.error).toContain("jump");
    const missing = parseOps("push", verbs);
    expect(missing.ok).toBe(false);
    const extra = parseOps("pop 2", verbs);
    expect(extra.ok).toBe(false);
  });

  it("detects unsorted arrays and reports the first offending position", () => {
    expect(sortedError([1, 2, 2, 5], "The array")).toBeNull();
    expect(sortedError([1, 3, 2], "The array")).toMatch(/a\[2\] = 2/);
  });
});

describe("generator shape", () => {
  it("an array visualization never returns zero frames, even for empty input", () => {
    for (const id of ["linear-search", "bubble-sort", "merge-sort", "quick-sort", "heap-sort", "array-traversal"]) {
      const g = arrayGen(id, { array: "", target: "1" });
      expect(g.frames.length, id).toBeGreaterThan(0);
    }
  });
});

/** Brute-force helpers, written independently of the generators under test. */
function randomGraph(rnd: () => number, n: number, m: number, directed: boolean, maxW: number): Graph {
  const edges: Edge[] = [];
  for (let k = 0; k < m; k++) {
    const u = Math.floor(rnd() * n);
    const v = Math.floor(rnd() * n);
    edges.push({ u, v, w: Math.floor(rnd() * (maxW + 1)) });
  }
  return { n, edges, directed };
}
function reachableFrom(g: Graph, start: number): Set<number> {
  const reach = new Set<number>([start]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const e of g.edges) {
      const pairs: [number, number][] = g.directed ? [[e.u, e.v]] : [[e.u, e.v], [e.v, e.u]];
      for (const [a, b] of pairs) if (reach.has(a) && !reach.has(b)) { reach.add(b); grew = true; }
    }
  }
  return reach;
}
function floydDistances(g: Graph): number[][] {
  const d = Array.from({ length: g.n }, (_, i) => Array.from({ length: g.n }, (_, j) => (i === j ? 0 : Infinity)));
  for (const e of g.edges) {
    d[e.u][e.v] = Math.min(d[e.u][e.v], e.w);
    if (!g.directed) d[e.v][e.u] = Math.min(d[e.v][e.u], e.w);
  }
  for (let k = 0; k < g.n; k++) for (let i = 0; i < g.n; i++) for (let j = 0; j < g.n; j++) d[i][j] = Math.min(d[i][j], d[i][k] + d[k][j]);
  return d;
}
function minCoinsBrute(coins: number[], amount: number): number {
  const memo = new Map<number, number>();
  const go = (a: number): number => {
    if (a === 0) return 0;
    if (memo.has(a)) return memo.get(a) ?? Infinity;
    let best = Infinity;
    for (const c of coins) if (c <= a) best = Math.min(best, go(a - c) + 1);
    memo.set(a, best);
    return best;
  };
  return go(amount);
}
function lcsBrute(s: string, t: string): number {
  const go = (i: number, j: number): number => {
    if (i === s.length || j === t.length) return 0;
    if (s[i] === t[j]) return 1 + go(i + 1, j + 1);
    return Math.max(go(i + 1, j), go(i, j + 1));
  };
  return go(0, 0);
}
function knapsackBrute(weights: number[], values: number[], cap: number): number {
  let best = 0;
  for (let mask = 0; mask < 1 << weights.length; mask++) {
    let w = 0;
    let v = 0;
    for (let i = 0; i < weights.length; i++) if (mask & (1 << i)) { w += weights[i]; v += values[i]; }
    if (w <= cap) best = Math.max(best, v);
  }
  return best;
}
function gridOf(id: string, raw: Record<string, string>): GridGen {
  const g = genOf(id, raw);
  if (g.kind !== "grid") throw new Error("expected a grid visualization");
  return g;
}
const numbersAfter = (text: string) => (text.match(/\d+/g) ?? []).map(Number);

describe("graph visualizers", () => {
  it("BFS and DFS visit exactly the nodes reachable from the start", () => {
    const rnd = seeded(3);
    for (let t = 0; t < 40; t++) {
      const n = 1 + (t % 7);
      const g = randomGraph(rnd, n, t % 9, t % 2 === 0, 5);
      const start = t % n;
      const want = [...reachableFrom(g, start)].sort((x, y) => x - y);
      for (const gen of [bfs(g, start), dfs(g, start)]) {
        const visited = numbersAfter(gen.result).slice().sort((x, y) => x - y);
        expect(visited, `${JSON.stringify(g)} from ${start}`).toEqual(want);
        expect(gen.frames.length).toBeGreaterThan(0);
        for (const f of gen.frames) expect(f.nodes.length).toBe(n);
      }
    }
  });

  it("BFS visits nodes in nondecreasing hop distance", () => {
    const g: Graph = { n: 6, directed: false, edges: [{ u: 0, v: 1, w: 1 }, { u: 0, v: 2, w: 1 }, { u: 1, v: 3, w: 1 }, { u: 2, v: 4, w: 1 }, { u: 3, v: 5, w: 1 }, { u: 4, v: 5, w: 1 }] };
    const order = numbersAfter(bfs(g, 0).result);
    const hop = (x: number) => [0, 1, 1, 2, 2, 3][x];
    for (let i = 1; i < order.length; i++) expect(hop(order[i]) >= hop(order[i - 1])).toBe(true);
  });

  it("Dijkstra agrees with Floyd-Warshall on random graphs", () => {
    const rnd = seeded(5);
    for (let t = 0; t < 40; t++) {
      const n = 1 + (t % 7);
      const g = randomGraph(rnd, n, t % 12, t % 3 === 0, 9);
      const start = (t * 3) % n;
      const want = floydDistances(g)[start].map((d) => (d === Infinity ? "∞" : String(d)));
      const got = dijkstra(g, start).result.replace("distances ", "").split(", ").map((p) => p.split(":")[1]);
      expect(got, `${JSON.stringify(g)} from ${start}`).toEqual(want);
    }
  });

  it("Dijkstra's final frame shows every node settled or unreachable", () => {
    const g: Graph = { n: 4, directed: true, edges: [{ u: 0, v: 1, w: 2 }, { u: 1, v: 2, w: 3 }] };
    const last = dijkstra(g, 0).frames.at(-1);
    expect(last?.text[3]).toBe("d=∞");
    expect(last?.state[2]).toBe("done");
  });

  it("topological order respects every edge of random DAGs, and cycles are reported", () => {
    const rnd = seeded(8);
    for (let t = 0; t < 30; t++) {
      const n = 2 + (t % 6);
      const edges: Edge[] = [];
      for (let k = 0; k < t % 10; k++) {
        const a = Math.floor(rnd() * n);
        const b = Math.floor(rnd() * n);
        if (a < b) edges.push({ u: a, v: b, w: 1 });
      }
      const g: Graph = { n, edges, directed: true };
      const order = numbersAfter(topoSort(g).result);
      expect(order.length).toBe(n);
      const pos = new Map(order.map((x, i) => [x, i]));
      for (const e of edges) expect((pos.get(e.u) ?? -1) < (pos.get(e.v) ?? -1)).toBe(true);
    }
    expect(topoSort({ n: 3, directed: true, edges: [{ u: 0, v: 1, w: 1 }, { u: 1, v: 2, w: 1 }, { u: 2, v: 0, w: 1 }] }).result).toMatch(/cycle/);
  });

  it("the input parser rejects bad graphs with a clear message", () => {
    expect(parseGraph("0", "", "no").ok).toBe(false);
    expect(parseGraph("3", "0 5", "no").ok).toBe(false);
    expect(parseGraph("3", "0 1 x", "no").ok).toBe(false);
    expect(parseGraph("3", "0 1", "maybe").ok).toBe(false);
    expect(parseGraph("3", "0 1 -2", "no", { nonNegative: true }).ok).toBe(false);
    const ok = parseGraph("3", "0 1 4; 1 2", "yes");
    expect(ok.ok).toBe(true);
    if (ok.ok) expect(ok.value.edges).toEqual([{ u: 0, v: 1, w: 4 }, { u: 1, v: 2, w: 1 }]);
  });

  it("the registry rejects undirected topological sort and negative Dijkstra weights", () => {
    expect(errorOf("topo-sort", { nodes: "3", edges: "0 1", directed: "no" })).toMatch(/directed/);
    expect(errorOf("dijkstra", { nodes: "3", edges: "0 1 -1", directed: "yes", start: "0" })).toMatch(/0 or more/);
    expect(errorOf("bfs", { nodes: "3", edges: "0 1", directed: "no", start: "7" })).toMatch(/between 0 and 2/);
  });
});

describe("dynamic programming visualizers", () => {
  it("climbing stairs matches the direct count for every n", () => {
    for (let n = 0; n <= 20; n++) {
      let a = 1;
      let b = 1;
      for (let i = 2; i <= n; i++) [a, b] = [b, a + b];
      const want = n === 0 ? 1 : b;
      expect(climbingStairs(n).result).toBe(`${want} ways`);
    }
  });

  it("coin change matches an independent recursion, including impossible amounts", () => {
    const rnd = seeded(13);
    for (let t = 0; t < 40; t++) {
      const coins = Array.from({ length: 1 + (t % 4) }, () => 1 + Math.floor(rnd() * 9));
      const amount = Math.floor(rnd() * 31);
      const want = minCoinsBrute(coins, amount);
      const got = coinChange(coins, amount).result;
      expect(got, `${coins} amount ${amount}`).toBe(want === Infinity ? "impossible" : `${want} coins`);
    }
  });

  it("LCS matches an independent recursion on random strings", () => {
    const rnd = seeded(17);
    const pick = () => Array.from({ length: 1 + Math.floor(rnd() * 7) }, () => "ABCD"[Math.floor(rnd() * 4)]).join("");
    for (let t = 0; t < 40; t++) {
      const s = pick();
      const u = pick();
      expect(lcs(s, u).result).toBe(`length ${lcsBrute(s, u)}`);
    }
  });

  it("knapsack matches an exhaustive subset search", () => {
    const rnd = seeded(19);
    for (let t = 0; t < 40; t++) {
      const k = 1 + (t % 6);
      const weights = Array.from({ length: k }, () => 1 + Math.floor(rnd() * 8));
      const values = Array.from({ length: k }, () => Math.floor(rnd() * 20));
      const cap = Math.floor(rnd() * 25);
      expect(knapsack(weights, values, cap).result).toBe(`best value ${knapsackBrute(weights, values, cap)}`);
    }
  });

  it("every DP cell that is highlighted lies inside the table", () => {
    const gens = [
      gridOf("knapsack", { weights: "1, 3, 4, 5", values: "1, 4, 5, 7", capacity: "7" }),
      gridOf("lcs", { s: "ABCB", t: "BDCAB" }),
      gridOf("coin-change", { coins: "1, 3, 4", amount: "6" }),
    ];
    for (const g of gens) {
      for (const f of g.frames) {
        const rows = f.cells.length;
        const cols = f.cells[0]?.length ?? 0;
        if (f.active) expect(f.active[0] < rows && f.active[1] < cols).toBe(true);
        for (const [r, c] of f.deps ?? []) expect(r < rows && c < cols && r >= 0 && c >= 0).toBe(true);
      }
    }
  });
});

function undirectedConnected(n: number, edges: Edge[]): boolean {
  return reachableFrom({ n, edges, directed: false }, 0).size === n;
}
/** Exhaustive minimum spanning tree: try every edge subset of size n-1 that connects all nodes. */
function mstBrute(n: number, edges: Edge[]): number {
  let best = Infinity;
  const m = edges.length;
  for (let mask = 0; mask < 1 << m; mask++) {
    const chosen = edges.filter((_, i) => mask & (1 << i));
    if (chosen.length !== n - 1) continue;
    if (!undirectedConnected(n, chosen)) continue;
    best = Math.min(best, chosen.reduce((x, e) => x + e.w, 0));
  }
  return best;
}
const totalOf = (result: string) => Number(/total (-?\d+)/.exec(result)?.[1]);

describe("spanning trees, components and union-find", () => {
  it("Kruskal and Prim both find the exhaustive minimum spanning tree weight on connected graphs", () => {
    const rnd = seeded(23);
    let checked = 0;
    for (let t = 0; t < 120 && checked < 40; t++) {
      const n = 2 + (t % 4);
      const g = randomGraph(rnd, n, 3 + (t % 5), false, 9);
      if (!undirectedConnected(n, g.edges)) continue;
      checked++;
      const want = mstBrute(n, g.edges);
      expect(totalOf(kruskal(g).result), JSON.stringify(g)).toBe(want);
      expect(totalOf(prim(g, t % n).result), JSON.stringify(g)).toBe(want);
    }
    expect(checked).toBeGreaterThan(20);
  });

  it("MST visualizations report a disconnected graph instead of a total", () => {
    const g: Graph = { n: 4, directed: false, edges: [{ u: 0, v: 1, w: 3 }, { u: 2, v: 3, w: 1 }] };
    expect(kruskal(g).result).toMatch(/not connected/);
    expect(prim(g, 0).result).toMatch(/not connected/);
  });

  it("connected components partition the nodes exactly as reachability does", () => {
    const rnd = seeded(29);
    for (let t = 0; t < 40; t++) {
      const n = 1 + (t % 7);
      const g = randomGraph(rnd, n, t % 6, false, 1);
      const seen = new Set<number>();
      let want = 0;
      for (let i = 0; i < n; i++) if (!seen.has(i)) { want++; for (const x of reachableFrom(g, i)) seen.add(x); }
      expect(components(g).result.startsWith(`${want} component`), JSON.stringify(g)).toBe(true);
      const last = components(g).frames.at(-1);
      const labels = Object.values(last?.text ?? {});
      expect(new Set(labels).size).toBe(want);
    }
  });

  it("union-find sets match the closure of the unions, and find returns a member's root", () => {
    const rnd = seeded(31);
    for (let t = 0; t < 40; t++) {
      const n = 2 + (t % 7);
      const ops: DsuOp[] = [];
      const unions: Edge[] = [];
      for (let k = 0; k < t % 9; k++) {
        const a = Math.floor(rnd() * n);
        const b = Math.floor(rnd() * n);
        ops.push({ name: "union", a, b });
        unions.push({ u: a, v: b, w: 1 });
      }
      const g = dsuOps(n, ops);
      for (let i = 0; i < n; i++) {
        const want = [...reachableFrom({ n, edges: unions, directed: false }, i)].sort((x, y) => x - y);
        const set = g.result.match(new RegExp(`\\{[^}]*\\b${i}\\b[^}]*\\}`))?.[0] ?? "";
        expect(set.slice(1, -1).split(",").map(Number).sort((x, y) => x - y), `${JSON.stringify(unions)}`).toEqual(want);
      }
    }
  });

  it("a redundant union is reported as already in one set", () => {
    const g = dsuOps(3, [{ name: "union", a: 0, b: 1 }, { name: "union", a: 1, b: 0 }]);
    expect(g.frames.some((f) => /already in one set|same set/.test(f.note))).toBe(true);
  });

  it("Bellman–Ford matches the all-pairs reference, and detects a reachable negative cycle", () => {
    const rnd = seeded(37);
    for (let t = 0; t < 40; t++) {
      const n = 1 + (t % 6);
      const g = randomGraph(rnd, n, t % 10, true, 9);
      const all = floydDistances(g);
      const start = t % n;
      const want = all[start].map((d) => (d === Infinity ? "∞" : String(d)));
      const got = bellmanFord(g, start).result.replace("distances ", "").split(", ").map((p) => p.split(":")[1]);
      expect(got, JSON.stringify(g)).toEqual(want);
    }
    const cyc: Graph = { n: 3, directed: true, edges: [{ u: 0, v: 1, w: 1 }, { u: 1, v: 2, w: -2 }, { u: 2, v: 1, w: 0 }] };
    expect(bellmanFord(cyc, 0).result).toBe("negative cycle reachable");
  });

  it("Floyd–Warshall's final table equals the all-pairs reference", () => {
    const rnd = seeded(41);
    for (let t = 0; t < 30; t++) {
      const n = 1 + (t % 6);
      const g = randomGraph(rnd, n, t % 9, t % 2 === 0, 9);
      const want = floydDistances(g);
      const last = floyd(g).frames.at(-1);
      const got = (last?.cells ?? []).map((row) => row.map((c) => (c === "∞" ? Infinity : Number(c))));
      expect(got, JSON.stringify(g)).toEqual(want);
    }
  });

  it("Bellman–Ford and the registry reject the inputs they cannot handle", () => {
    expect(errorOf("bellman-ford", { nodes: "3", edges: "0 1 -1", directed: "no", start: "0" })).toMatch(/directed/);
    expect(runAlgorithm(getAlgorithm("kruskal")!, { nodes: "3", edges: "0 1 1" }).ok).toBe(true);
    expect(runAlgorithm(getAlgorithm("components")!, { nodes: "3", edges: "0 1", directed: "no" }).ok).toBe(true);
  });

  it("the union-find parser rejects bad operations and out-of-range elements", () => {
    expect(parseDsu("union 0 1, find 0", 2).ok).toBe(true);
    expect(parseDsu("union 0", 2).ok).toBe(false);
    expect(parseDsu("union 0 5", 3).ok).toBe(false);
    expect(parseDsu("merge 0 1", 3).ok).toBe(false);
  });
});

describe("Fenwick, trie, greedy and backtracking", () => {
  it("Fenwick prefix queries match direct prefix sums after random adds", () => {
    const rnd = seeded(43);
    for (let t = 0; t < 40; t++) {
      const n = 1 + (t % 12);
      const values = randomArray(rnd, n, -9, 9);
      const truth = [...values];
      const ops: FenOp[] = [];
      const want: number[] = [];
      for (let k = 0; k < 1 + (t % 8); k++) {
        if (rnd() < 0.5) {
          const i = 1 + Math.floor(rnd() * n);
          const d = Math.floor(rnd() * 11) - 5;
          ops.push({ name: "add", i, d });
          truth[i - 1] += d;
        } else {
          const i = Math.floor(rnd() * (n + 1));
          ops.push({ name: "query", i });
          want.push(truth.slice(0, i).reduce((x, y) => x + y, 0));
        }
      }
      const g = fenwickOps(values, ops);
      expect(g.result, JSON.stringify({ values, ops })).toBe(want.length ? `queries ${want.join(", ")}` : "built");
    }
  });

  it("the Fenwick input parser enforces 1-based indices and ranges", () => {
    expect(parseFenOps("add 3 5, query 4", 4).ok).toBe(true);
    expect(parseFenOps("add 0 5", 4).ok).toBe(false);
    expect(parseFenOps("add 5 1", 4).ok).toBe(false);
    expect(parseFenOps("query 5", 4).ok).toBe(false);
    expect(parseFenOps("sum 2", 4).ok).toBe(false);
  });

  it("the trie finds exactly the stored words, and tells prefixes apart from words", () => {
    const rnd = seeded(47);
    const letters = "abc";
    const randWord = () => Array.from({ length: 1 + Math.floor(rnd() * 4) }, () => letters[Math.floor(rnd() * 3)]).join("");
    for (let t = 0; t < 40; t++) {
      const words = Array.from({ length: 1 + (t % 4) }, randWord);
      const probe = randWord();
      const stored = new Set(words);
      const res = trieOps(words, probe).result;
      if (stored.has(probe)) expect(res, JSON.stringify({ words, probe })).toBe(`"${probe}" is in the trie`);
      else expect(res.startsWith(`"${probe}" is`), JSON.stringify({ words, probe })).toBe(true);
      expect(res.includes("only a prefix") && !words.some((w) => w.startsWith(probe) && w !== probe)).toBe(false);
    }
  });

  it("the trie input parser limits words and length", () => {
    expect(parseWords("cat, car").ok).toBe(true);
    expect(parseWords("cats").ok).toBe(true);
    expect(parseWords("catss").ok).toBe(false);
    expect(parseWords("a, b, c, d, e").ok).toBe(false);
    expect(parseWords("c4t").ok).toBe(false);
  });

  it("interval greedy takes as many non-overlapping intervals as an exhaustive search does", () => {
    const rnd = seeded(53);
    for (let t = 0; t < 40; t++) {
      const k = 1 + (t % 7);
      const iv: [number, number][] = Array.from({ length: k }, () => {
        const s = Math.floor(rnd() * 20);
        return [s, s + 1 + Math.floor(rnd() * 6)];
      });
      let best = 0;
      for (let mask = 0; mask < 1 << k; mask++) {
        const chosen = iv.filter((_, i) => mask & (1 << i));
        const ok = chosen.every((a, i) => chosen.every((b, j) => i === j || a[1] <= b[0] || b[1] <= a[0]));
        if (ok) best = Math.max(best, chosen.length);
      }
      expect(intervalGreedy(iv).result, JSON.stringify(iv)).toBe(`${best} intervals`);
    }
  });

  it("the interval parser rejects reversed and out-of-range intervals", () => {
    expect(parseIntervals("1 4; 3 5").ok).toBe(true);
    expect(parseIntervals("4 4").ok).toBe(false);
    expect(parseIntervals("5 2").ok).toBe(false);
    expect(parseIntervals("0 100").ok).toBe(false);
  });

  it("N-Queens finds the known number of solutions for every board size up to 6", () => {
    const known = [1, 0, 0, 2, 10, 4];
    known.forEach((count, i) => {
      const n = i + 1;
      const want = count === 0 ? `no solutions for ${n}` : `${count} solution${count === 1 ? "" : "s"}`;
      expect(nQueens(n).result).toBe(want);
    });
  });

  it("every N-Queens frame highlights a cell inside the board", () => {
    for (const f of nQueens(4).frames) {
      if (f.active) expect(f.active[0] < 4 && f.active[1] < 4).toBe(true);
    }
  });
});

describe("segment tree, challenges", () => {
  it("segment tree range minimum matches a direct scan after random updates", () => {
    const rnd = seeded(59);
    for (let t = 0; t < 40; t++) {
      const n = 1 + (t % 8);
      const values = randomArray(rnd, n, 0, 99);
      const truth = [...values];
      const ops: SegOp[] = [];
      const want: string[] = [];
      for (let k = 0; k < 1 + (t % 6); k++) {
        if (rnd() < 0.4) {
          const i = Math.floor(rnd() * n);
          const v = Math.floor(rnd() * 100);
          ops.push({ name: "update", i, v });
          truth[i] = v;
        } else {
          const l = Math.floor(rnd() * n);
          const r = l + Math.floor(rnd() * (n - l));
          ops.push({ name: "query", l, r });
          want.push(`min[${l}..${r}] = ${Math.min(...truth.slice(l, r + 1))}`);
        }
      }
      const g = segmentTreeOps(values, ops);
      expect(g.result, JSON.stringify({ values, ops })).toBe(want.length ? want.join(", ") : "built");
    }
  });

  it("the segment tree parser rejects out-of-range queries and updates", () => {
    expect(parseSegOps("query 0 3", 4).ok).toBe(true);
    expect(parseSegOps("query 3 1", 4).ok).toBe(false);
    expect(parseSegOps("query 0 4", 4).ok).toBe(false);
    expect(parseSegOps("update 4 1", 4).ok).toBe(false);
    expect(parseSegOps("update 1 100", 4).ok).toBe(false);
  });

  it("every registered algorithm except the deferred ones has a practice challenge", () => {
    for (const algo of ALGORITHMS) expect(CHALLENGES[algo.id], algo.id).toBeTruthy();
  });
});

describe("BST with delete", () => {
  it("insert, delete and search agree with a Set model on random operation lists", () => {
    const rnd = seeded(61);
    for (let t = 0; t < 60; t++) {
      const set = new Set<number>();
      const ops: Op[] = [];
      for (let k = 0; k < 1 + (t % 14); k++) {
        const x = Math.floor(rnd() * 16);
        const roll = rnd();
        if (roll < 0.5) {
          if (set.has(x) || set.size < 9) { ops.push({ name: "insert", arg: x }); set.add(x); }
        } else if (roll < 0.8) {
          ops.push({ name: "delete", arg: x });
          set.delete(x);
        } else {
          ops.push({ name: "search", arg: x });
        }
      }
      const g = bstOps(ops);
      const want = [...set].sort((p, q) => p - q);
      expect(g.result, JSON.stringify(ops)).toBe(want.length ? `in order: ${want.join(" ")}` : "empty tree");
    }
  });

  it("every frame keeps keys in order and every tree is connected, except the copy step of a two-child delete", () => {
    const ops: Op[] = [8, 3, 10, 1, 6, 14, 4, 7, 13].map((x): Op => ({ name: "insert", arg: x }));
    ops.push({ name: "delete", arg: 3 }, { name: "delete", arg: 8 }, { name: "delete", arg: 99 }, { name: "search", arg: 7 });
    for (const f of bstOps(ops).frames) {
      if (f.note.startsWith("Copy")) continue;
      const keys = f.structure.items.map(Number);
      for (let i = 1; i < keys.length; i++) expect(keys[i] > keys[i - 1], f.note).toBe(true);
      if (f.nodes.length > 0) expect(f.edges.length, f.note).toBe(f.nodes.length - 1);
    }
  });

  it("the delete cases each appear in the explanations", () => {
    const build: Op[] = [8, 3, 10, 1, 6, 14].map((x): Op => ({ name: "insert", arg: x }));
    const notes = (extra: Op[]) => bstOps([...build, ...extra]).frames.map((f) => f.note).join("\n");
    expect(notes([{ name: "delete", arg: 1 }])).toMatch(/no children/);
    expect(notes([{ name: "delete", arg: 14 }])).toMatch(/no children/);
    expect(notes([{ name: "delete", arg: 10 }])).toMatch(/one child/);
    expect(notes([{ name: "delete", arg: 3 }])).toMatch(/two children/);
  });

  it("the registry rejects more than nine keys at once and keys outside 0 to 99", () => {
    const ten = Array.from({ length: 10 }, (_, i) => `insert ${i}`).join(", ");
    expect(errorOf("bst-delete", { ops: ten })).toMatch(/9 keys/);
    expect(errorOf("bst-delete", { ops: "insert 100" })).toMatch(/0 to 99/);
    expect(runAlgorithm(getAlgorithm("bst-delete")!, { ops: "insert 5, delete 5, insert 6, insert 7, insert 8, insert 9, insert 10, insert 11, insert 12, insert 13" }).ok).toBe(true);
  });

  it("every BST delete preset runs and has a challenge", () => {
    expect(CHALLENGES["bst-delete"]).toBeTruthy();
    for (const p of getAlgorithm("bst-delete")!.presets) expect(runAlgorithm(getAlgorithm("bst-delete")!, p.values).ok, p.label).toBe(true);
  });
});

describe("union-find with path compression", () => {
  it("after a find, every node on its path points straight at the root", () => {
    const g = dsuOps(4, [{ name: "union", a: 0, b: 1 }, { name: "union", a: 2, b: 3 }, { name: "union", a: 0, b: 2 }, { name: "find", a: 3 }]);
    const last = g.frames.at(-1);
    expect(last?.values[3]).toBe(0);
    expect(last?.values[2]).toBe(0);
    expect(g.result).toBe("{0,1,2,3}");
  });

  it("compression keeps the same sets as the closure of the unions", () => {
    const rnd = seeded(67);
    for (let t = 0; t < 40; t++) {
      const n = 2 + (t % 7);
      const ops: DsuOp[] = [];
      const unions: Edge[] = [];
      for (let k = 0; k < 2 + (t % 10); k++) {
        const a = Math.floor(rnd() * n);
        if (rnd() < 0.6) {
          const b = Math.floor(rnd() * n);
          ops.push({ name: "union", a, b });
          unions.push({ u: a, v: b, w: 1 });
        } else {
          ops.push({ name: "find", a });
        }
      }
      const g = dsuOps(n, ops);
      const last = g.frames.at(-1);
      for (let i = 0; i < n; i++) {
        const want = [...reachableFrom({ n, edges: unions, directed: false }, i)].sort((x, y) => x - y);
        const set = g.result.match(new RegExp(`\\{[^}]*\\b${i}\\b[^}]*\\}`))?.[0] ?? "";
        expect(set.slice(1, -1).split(",").map(Number).sort((x, y) => x - y)).toEqual(want);
        // Every parent link after the run must still lead to the same root.
        let r = i;
        const values = (last?.values ?? []) as number[];
        for (let guard = 0; guard < n && values[r] !== r; guard++) r = values[r];
        expect(want.includes(r)).toBe(true);
      }
    }
  });
});

describe("trie with delete", () => {
  it("the final trie holds exactly the stored words and their prefixes, with nothing left dangling", () => {
    const rnd = seeded(71);
    const letters = "abc";
    const word = () => Array.from({ length: 1 + Math.floor(rnd() * 3) }, () => letters[Math.floor(rnd() * 3)]).join("");
    let checked = 0;
    for (let t = 0; t < 80; t++) {
      const ops: TrieOp[] = [];
      const stored = new Set<string>();
      for (let k = 0; k < 2 + (t % 10); k++) {
        const w = word();
        const roll = rnd();
        if (roll < 0.5) { ops.push({ name: "insert", word: w }); stored.add(w); }
        else if (roll < 0.85) { ops.push({ name: "delete", word: w }); stored.delete(w); }
        else ops.push({ name: "search", word: w });
      }
      const g = trieDynamic(ops);
      const want = new Set<string>([""]);
      for (const w of stored) for (let k = 1; k <= w.length; k++) want.add(w.slice(0, k));
      const last = g.frames.at(-1);
      const got = new Set((last?.nodes ?? []).map((n) => n.id.slice(2)));
      if (got.size > 16) continue;
      checked++;
      expect(got, JSON.stringify(ops)).toEqual(want);
    }
    expect(checked).toBeGreaterThan(40);
  });

  it("search answers match the stored set after a delete", () => {
    const ops: TrieOp[] = [
      { name: "insert", word: "cat" }, { name: "insert", word: "ca" },
      { name: "delete", word: "cat" }, { name: "search", word: "cat" },
    ];
    expect(trieDynamic(ops).result).toBe('"cat" is not in the trie');
    expect(trieDynamic([...ops.slice(0, 2), { name: "search", word: "ca" }]).result).toBe('"ca" is stored');
  });

  it("a delete that would leave a shared prefix keeps it, and a delete of a missing word changes nothing", () => {
    const shared = trieDynamic([{ name: "insert", word: "cat" }, { name: "insert", word: "car" }, { name: "delete", word: "cat" }]);
    expect(shared.frames.at(-1)?.nodes.map((n) => n.id)).toContain("p:ca");
    const missing = trieDynamic([{ name: "insert", word: "cat" }, { name: "delete", word: "dog" }]);
    expect(missing.frames.at(-1)?.note).toMatch(/not stored/);
  });

  it("the trie parser rejects unknown verbs and long or uppercase words", () => {
    expect(parseTrieOps("insert cat, search car").ok).toBe(true);
    expect(parseTrieOps("remove cat").ok).toBe(false);
    expect(parseTrieOps("insert cats5").ok).toBe(false);
    expect(parseTrieOps("insert Cat").ok).toBe(false);
  });
});

describe("subset sum by backtracking", () => {
  it("counts exactly the subsets that a brute-force enumeration finds", () => {
    const rnd = seeded(73);
    for (let t = 0; t < 60; t++) {
      const n = 1 + (t % 7);
      const a = Array.from({ length: n }, () => 1 + Math.floor(rnd() * 12));
      const target = Math.floor(rnd() * 30);
      let want = 0;
      for (let mask = 0; mask < 1 << n; mask++) {
        let s = 0;
        for (let i = 0; i < n; i++) if (mask & (1 << i)) s += a[i];
        if (s === target) want++;
      }
      const got = subsetSum(a, target).result;
      const expected = want === 0 ? `no subset sums to ${target}` : `${want} subset${want === 1 ? "" : "s"} sum to ${target}`;
      expect(got, JSON.stringify({ a, target })).toBe(expected);
    }
  });

  it("prunes branches that already exceed the target", () => {
    const g = subsetSum([10, 20, 30], 5);
    expect(g.frames.some((f) => /Prune/.test(f.note))).toBe(true);
    expect(g.result).toBe("no subset sums to 5");
  });

  it("the registry rejects non-positive values and out-of-range targets", () => {
    expect(errorOf("subset-sum", { values: "3, 0", target: "3" })).toMatch(/positive/);
    expect(errorOf("subset-sum", { values: "3, 4", target: "1000" })).toMatch(/999/);
    expect(CHALLENGES["subset-sum"]).toBeTruthy();
  });
});

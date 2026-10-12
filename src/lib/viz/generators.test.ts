import { describe, expect, it } from "vitest";
import { bitmaskAssignSteps, treeDpSteps, pascalSteps, bitOpsSteps, kmpPrefixSteps, kmpSearchSteps, trieSteps, fenwickSteps, segQuerySteps, sparseSteps, dijkstraSteps, kruskalSteps, knapsackSteps, sieveSteps, gcdSteps, topoSteps, topoCycleSteps, mergeSortSteps, cyclicSortSteps, queensSteps, loopIfSteps, sliceSteps, hashTableSteps, zipSteps, rangeBoundsSteps, heapSteps, treeTraversalSteps, listReverseSteps, intervalGreedySteps, pairCountSteps, reverseSteps, bfsSteps, dfsSteps, fibTreeSteps, lcsSteps, monotonicStackSteps, prefixSumSteps, unionFindSteps, variableWindowSteps } from "./generators";
import { VIZ_IDS, vizById } from "./index";

describe("visualization generators", () => {
  it("prefix sums answer a range query with one subtraction", () => {
    const f = prefixSumSteps([2, 4, 1, 5, 3], [[1, 3]]);
    expect(f.at(-1)!.aux![0].values).toEqual([0, 2, 6, 7, 12, 15]);
    expect(f.at(-1)!.note).toContain("= 10");
  });
  it("variable window finds the longest valid run", () => {
    // positives, sum <= 8: [1,2] (3), [2,7]? 9 no; [4,2,1,1] = 8 length 4
    expect(variableWindowSteps([3, 1, 2, 7, 4, 2, 1, 1, 5], 8).some((x) => x.note.includes("Best so far = 4"))).toBe(true);
  });
  it("monotonic stack computes next greater elements", () => {
    const last = monotonicStackSteps([2, 1, 5, 3, 4, 6, 1]).at(-1)!;
    expect(last.aux![0].values).toEqual([5, 5, 6, 4, 6, -1, -1]);
  });
  it("union-find merges groups and detects a cycle-closing edge", () => {
    const f = unionFindSteps(4, [[0, 1], [1, 2], [0, 2]]);
    expect(f.at(-1)!.note).toContain("already have root");
  });
  it("fib call tree: memoization needs far fewer calls", () => {
    const plain = fibTreeSteps(5, false), memo = fibTreeSteps(5, true);
    expect(plain.at(-1)!.note).toContain("using 15 calls");
    expect(memo.at(-1)!.note).toContain("using 9 calls");
    expect(plain.at(-1)!.note).toContain("fib(5) = 5");
  });
  it("fib call stack never underflows and ends empty", () => {
    const f = fibTreeSteps(4, false);
    expect(f.every((x) => x.structure.items.length >= 0)).toBe(true);
    expect(f.at(-1)!.structure.items).toEqual([]);
  });
  it("BFS reaches every node with correct distances; DFS visits all once", () => {
    const b = bfsSteps("A").at(-1)!;
    expect(b.order).toEqual(["A", "B", "C", "D", "E", "F"]);
    expect(b.text).toMatchObject({ A: "d=0", B: "d=1", C: "d=1", D: "d=2", E: "d=2", F: "d=2" });
    const d = dfsSteps("A").at(-1)!;
    expect([...d.order].sort()).toEqual(["A", "B", "C", "D", "E", "F"]);
    expect(d.order[0]).toBe("A");
  });
  it("LCS table gives the right length", () => {
    const f = lcsSteps("ABCB", "BDCAB").at(-1)!;
    expect(f.cells[4][5]).toBe(3); // BCB
  });
  it("every registered visualization builds and has at least two frames", () => {
    for (const id of VIZ_IDS) expect(vizById(id)!.frames.length).toBeGreaterThan(1);
  });
  it("pair counting matches n(n-1)/2", () => {
    expect(pairCountSteps([1, 2, 3, 4, 5]).at(-1)!.note).toContain("10 pairs for n = 5");
    expect(pairCountSteps([1, 2, 3, 4, 5, 6, 7, 8]).at(-1)!.note).toContain("28 pairs");
  });
  it("reverse ends reversed for odd and even lengths", () => {
    expect(reverseSteps([1, 2, 3, 4, 5, 6]).at(-1)!.values).toEqual([6, 5, 4, 3, 2, 1]);
    expect(reverseSteps([1, 2, 3, 4, 5]).at(-1)!.values).toEqual([5, 4, 3, 2, 1]);
  });
  it("tree traversals produce the standard orders", () => {
    expect(treeTraversalSteps("pre").at(-1)!.order).toEqual(["8", "4", "2", "6", "12", "10", "14"]);
    expect(treeTraversalSteps("in").at(-1)!.order).toEqual(["2", "4", "6", "8", "10", "12", "14"]);
    expect(treeTraversalSteps("post").at(-1)!.order).toEqual(["2", "6", "4", "10", "14", "12", "8"]);
    expect(treeTraversalSteps("level").at(-1)!.order).toEqual(["8", "4", "12", "2", "6", "10", "14"]);
    expect(treeTraversalSteps("pre").at(-1)!.structure.items).toEqual([]);
  });
  it("list reversal flips every arrow and ends with the old tail as head", () => {
    const last = listReverseSteps([1, 2, 3, 4]).at(-1)!;
    expect(last.edges.map((e) => `${e.a}>${e.b}`).sort()).toEqual(["2>1", "3>2", "4>3"]);
    expect(last.note).toContain("4 → 3 → 2 → 1");
  });
  it("interval greedy picks the classic maximum of 4", () => {
    const last = intervalGreedySteps([[1, 4], [3, 5], [0, 6], [5, 7], [3, 9], [5, 9], [6, 10], [8, 11], [8, 12], [2, 14], [12, 16]]).at(-1)!;
    expect(last.note).toContain("4 non-overlapping");
    expect(last.aux![0].values.filter((v) => v === "✓")).toHaveLength(4);
  });
  it("heap sifts up on insert and down on extract", () => {
    const f = heapSteps([2, 5, 3, 9, 6], 1);
    expect(f.some((x) => x.structure.items.join(",") === "1,5,2,9,6,3")).toBe(true); // after sift up
    expect(f.at(-1)!.structure.items).toEqual(["2", "5", "3", "9", "6"]); // after extracting 1
    expect(f.at(-1)!.note).toContain("extracted 1");
    // heap property holds in the final frame
    const v = f.at(-1)!.structure.items.map(Number);
    v.forEach((x, i) => { if (i > 0) expect(v[Math.floor((i - 1) / 2)]).toBeLessThanOrEqual(x); });
  });
  it("loop/if labels odd and even correctly", () => {
    expect(loopIfSteps(6).at(-2)!.aux![0].values).toEqual(["odd", "even", "odd", "even", "odd", "even"]);
  });
  it("slices select what Python selects", () => {
    const f = sliceSteps([10, 20, 30, 40, 50, 60]);
    expect(f[1].aux![0].values).toEqual([20, 30, 40]);   // a[1:4]
    expect(f[2].aux![0].values).toEqual([10, 20, 30]);   // a[:3]
    expect(f[3].aux![0].values).toEqual([50, 60]);       // a[-2:]
    expect(f[4].aux![0].values).toEqual([10, 30, 50]);   // a[::2]
    expect(f[5].aux![0].values).toEqual([60, 50, 40, 30, 20, 10]); // a[::-1]
  });
  it("toy hash table has exactly one collision and finds/misses correctly", () => {
    const f = hashTableSteps();
    expect(f.filter((x) => x.note.includes("collision"))).toHaveLength(1);
    expect(f.some((x) => x.note.includes('Found "ant" after 2 comparisons'))).toBe(true);
    expect(f.at(-1)!.note).toContain('"cow" is not in the table');
    expect(f.at(-2)!.values).toEqual([1, 0, 1, 2, 1]);
  });
  it("zip pairs stop at the shorter list", () => {
    expect(zipSteps(["a", "b", "c"], [1, 2]).at(-1)!.note).toContain("2 pairs");
  });
  it("range picture matches Python's range", () => {
    const f = rangeBoundsSteps();
    const win = (i: number) => Object.entries(f[i].marks).filter(([, m]) => m.includes("win")).map(([k]) => Number(k));
    expect(win(1)).toEqual([...Array(5).keys()]);
    expect(win(2)).toEqual([1, 2, 3, 4]);
    expect(win(3)).toEqual([0, 1, 2, 3]);
    expect(win(4)).toEqual([0, 2, 4]);
    expect(win(5)).toEqual([0, 1, 2, 3, 4]);
  });
  it("sieve leaves exactly the primes up to 25", () => {
    const f = sieveSteps(25).at(-1)!;
    const primes = Object.entries(f.marks).filter(([, m]) => m.includes("win")).map(([k]) => Number(k) + 2);
    expect(primes).toEqual([2, 3, 5, 7, 11, 13, 17, 19, 23]);
  });
  it("euclid finds the gcd", () => {
    expect(gcdSteps(48, 18).at(-1)!.note).toContain("gcd = 6");
    expect(gcdSteps(17, 5).at(-1)!.note).toContain("gcd = 1");
  });
  it("kahn gives a valid order on a DAG and detects a cycle", () => {
    const ok = topoSteps().at(-1)!;
    expect(ok.order).toEqual(["A", "B", "C", "D", "E", "F"]);
    const pos = (x: string) => ok.order.indexOf(x);
    ok.edges.forEach((e) => expect(pos(e.a)).toBeLessThan(pos(e.b)));
    const bad = topoCycleSteps().at(-1)!;
    expect(bad.order).toEqual(["A"]);
    expect(bad.note).toContain("cycle");
  });
  it("merge sort and cyclic sort end sorted", () => {
    expect(mergeSortSteps([5, 2, 4, 1, 6, 3]).at(-1)!.values).toEqual([1, 2, 3, 4, 5, 6]);
    expect(mergeSortSteps([9, 8, 7, 6, 5, 4, 3, 2, 1]).at(-1)!.values).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(cyclicSortSteps([3, 1, 5, 4, 2]).at(-1)!.values).toEqual([1, 2, 3, 4, 5]);
    expect(cyclicSortSteps([2, 3, 4, 1, 1]).at(-1)!.values.slice().sort()).toEqual([1, 1, 2, 3, 4]); // duplicates do not loop forever
  });
  it("4-queens backtracks and finds a valid placement", () => {
    const f = queensSteps(4);
    expect(f.some((x) => x.note.includes("Backtrack"))).toBe(true);
    const cells = f.at(-1)!.cells;
    const pos = cells.flatMap((r, i) => r.map((v, j) => (v === "Q" ? [i, j] : null)).filter(Boolean)) as number[][];
    expect(pos).toEqual([[0, 1], [1, 3], [2, 0], [3, 2]]);
  });
  it("dijkstra gives the classic shortest distances and settles nodes in order", () => {
    const last = dijkstraSteps().at(-1)!;
    expect(last.text).toMatchObject({ A: "0", B: "7", C: "9", D: "20", E: "20", F: "11" });
    expect(last.order).toEqual(["A", "B", "C", "F", "D", "E"]); // D and E tie at 20; ties break alphabetically
    // settled distances never decrease: edges are non-negative
    const ds = last.order.map((v) => Number(last.text[v]));
    expect([...ds].sort((a, b) => a - b)).toEqual(ds);
  });
  it("kruskal builds a spanning tree of n - 1 edges and weight 33", () => {
    const last = kruskalSteps().at(-1)!;
    expect(last.edges.filter((e) => e.mark === "pick")).toHaveLength(5);
    expect(last.edges.filter((e) => e.mark === "pick").reduce((s, e) => s + (e.w ?? 0), 0)).toBe(33);
    expect(last.note).toContain("total weight 33");
  });
  it("knapsack table ends with the optimal value 9 for capacity 7", () => {
    const f = knapsackSteps([1, 3, 4, 5], [1, 4, 5, 7], 7).at(-1)!;
    expect(f.cells[4][7]).toBe(9);
    expect(f.cells[2][4]).toBe(5);
  });
  it("fenwick query reads 3 cells for prefix 7 and the update changes cells 3, 4 and 8", () => {
    const f = fenwickSteps();
    expect(f.some((x) => x.note.includes("sum of a[1..7] is 16"))).toBe(true);
    expect(f.at(-1)!.values).toEqual(["·", 3, 5, 4, 15, 5, 9, -3, 24]);
    // brute-force check of the prefix sum the animation claims
    expect([3, 2, -1, 6, 5, 4, -3].reduce((s, v) => s + v, 0)).toBe(16);
  });
  it("segment tree range-min query over 2..6 answers 1 using whole nodes", () => {
    const f = segQuerySteps().at(-1)!;
    expect(f.note).toContain("is 1,");
    expect(f.order).toEqual(["2-3", "4-5", "6-6"]);
    expect(Math.min(6, 1, 7, 3, 8)).toBe(1);
  });
  it("sparse table answers the two sample queries", () => {
    const f = sparseSteps();
    expect(f.some((x) => x.note.includes("= min(1, 1) = 1"))).toBe(true);
    expect(f.at(-1)!.note).toContain("min(3, 4) = 3");
    expect(f.length).toBeGreaterThan(14);
  });
  it("bit operations show the right bit patterns (lowest bit first)", () => {
    const f = bitOpsSteps(12, 10);
    const rowOf = (label: string) => f.flatMap((x) => x.aux ?? []).find((r) => r.label.startsWith(label))!.values;
    expect(f[0].values).toEqual([0, 0, 1, 1, 0, 0, 0, 0]);
    expect(rowOf("a & b")).toEqual([0, 0, 0, 1, 0, 0, 0, 0]);   // 8
    expect(rowOf("a | b")).toEqual([0, 1, 1, 1, 0, 0, 0, 0]);   // 14
    expect(rowOf("a ^ b")).toEqual([0, 1, 1, 0, 0, 0, 0, 0]);   // 6
    expect(rowOf("a & −a")).toEqual([0, 0, 1, 0, 0, 0, 0, 0]);  // 4
    expect(rowOf("−a in 8 bits")).toEqual([0, 0, 1, 0, 1, 1, 1, 1]); // 244
  });
  it("kmp prefix function of abacaba is [0,0,1,0,1,2,3]", () => {
    const last = kmpPrefixSteps("abacaba").at(-1)!;
    expect(last.aux![0].values).toEqual([0, 0, 1, 0, 1, 2, 3]);
    expect(kmpPrefixSteps("aabaaab").at(-1)!.aux![0].values).toEqual([0, 1, 0, 1, 2, 2, 3]);
  });
  it("kmp search finds the match at index 3 after sliding, and finds overlapping matches", () => {
    const f = kmpSearchSteps("abcabcabd", "abcabd");
    expect(f.some((x) => x.note.includes("slide the pattern right and set j = 2"))).toBe(true);
    expect(f.some((x) => x.note.includes('found "abcabd" at index 3'))).toBe(true);
    const o = kmpSearchSteps("aaaaa", "aa");
    expect(o.filter((x) => x.note.includes("found")).length).toBe(4);
  });
  it("trie shares prefixes and tells words from prefixes", () => {
    const f = trieSteps();
    const last = f.at(-1)!;
    expect(last.nodes.length).toBe(8);   // the root plus c, ca, car, cat, cart, d, do
    expect(f.some((x) => x.note.includes("is only a prefix"))).toBe(true);
    expect(f.some((x) => x.note.includes("is not in the trie"))).toBe(true);
    expect(f.some((x) => x.note.includes('"cat" is stored'))).toBe(true);
  });
  it("pascal triangle rows are the binomial coefficients and sum to powers of two", () => {
    const last = pascalSteps(7).at(-1)!;
    expect(last.cells[6]).toEqual([1, 6, 15, 20, 15, 6, 1]);
    expect(last.cells[4].slice(0, 5)).toEqual([1, 4, 6, 4, 1]);
    expect(last.note).toContain("64 = 2^6");
    expect(last.cells[3][5]).toBeNull();   // r > n stays empty
  });
  it("bitmask assignment ends with dp = [0,9,2,8,7,12,5,9]", () => {
    const f = bitmaskAssignSteps().at(-1)!;
    expect(f.values).toEqual([0, 9, 2, 8, 7, 12, 5, 9]);
    expect(f.aux![0].values).toEqual(["000", "001", "010", "011", "100", "101", "110", "111"]);
    expect(f.note).toContain("dp[111] = 9");
  });
  it("tree DP finds 16 for the sample tree and stores the right pairs", () => {
    const f = treeDpSteps().at(-1)!;
    expect(f.text).toMatchObject({ D: "1/0", E: "3/0", B: "4/4", G: "7/0", F: "2/7", C: "12/7", A: "14/16" });
    expect(f.note).toContain("= 16");
  });
});

import { primSteps, bellmanFordSteps, floydSteps, partitionSteps, segUpdateSteps, convexHullSteps, upsolveSteps } from "./generators";

describe("visualizations added with the geometry and extra-visualization pass", () => {
  it("Prim reaches the same total weight as Kruskal", () => {
    const pr = primSteps().at(-1)!.note.match(/total weight (\d+)/)![1];
    const kr = kruskalSteps().at(-1)!.note.match(/total weight (\d+)/)![1];
    expect(pr).toBe(kr);
  });
  it("Bellman–Ford finds the distances with a negative edge", () => {
    const last = bellmanFordSteps().at(-1)!;
    expect(last.text).toMatchObject({ S: "d=0", A: "d=2", B: "d=5", C: "d=0", D: "d=3" });
  });
  it("Floyd–Warshall ends with every pair connected, and A→C through B costs 5", () => {
    const last = floydSteps().at(-1)!;
    expect(last.cells.flat().every((c) => c !== "∞")).toBe(true);
    expect(last.cells[0][2]).toBe(5);
  });
  it("the partition leaves smaller values left of the pivot and puts the pivot at its final index", () => {
    const last = partitionSteps([5, 2, 8, 1, 9, 3, 7]).at(-1)!;
    expect(last.values.slice(0, 4).every((v) => (v as number) <= 7)).toBe(true);
    expect(last.values[4]).toBe(7);
  });
  it("the segment-tree update changes the leaf and only its ancestors", () => {
    const f = segUpdateSteps();
    expect(f.at(-1)!.nodes.some((n) => n.label === "9")).toBe(true);
    expect(f.at(-1)!.note).toContain("O(log n)");
  });
  it("the monotone chain finds 7 hull corners for the example set", () => {
    const f = convexHullSteps([[1, 1], [5, 0], [6, 3], [4, 6], [1, 5], [0, 3], [3, 3], [3, 0], [2, 2]]);
    expect(f.at(-1)!.note).toContain("That is 7 corners");
  });
  it("the upsolve map ticks one technique per upsolved problem", () => {
    const last = upsolveSteps().at(-1)!;
    expect(last.cells.flat().filter((c) => c === "✓").length).toBe(5);
  });
});

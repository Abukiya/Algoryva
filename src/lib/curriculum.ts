export type Level = "FOUNDATION" | "BEGINNER" | "CORE" | "INTERMEDIATE" | "ADVANCED" | "EXPERT";
export type TopicDef = {
  slug: string; title: string; level: Level;
  prereqs: string[]; status: "PUBLISHED" | "COMING_SOON";
};

export const LEVELS: Level[] = ["FOUNDATION", "BEGINNER", "CORE", "INTERMEDIATE", "ADVANCED", "EXPERT"];

const t = (slug: string, title: string, level: Level, prereqs: string[] = [], status: TopicDef["status"] = "PUBLISHED"): TopicDef =>
  ({ slug, title, level, prereqs, status });

// PUBLISHED topics are taught by a full lesson (every topic is published; none are COMING_SOON). Most follow the uploaded A2SV lecture material; shortest-paths, mst, dp-bottom-up,
// fenwick-tree, segment-tree, sparse-table, string-algorithms, bit-manipulation, number-theory and dp-advanced are original content with no lecture source. COMING_SOON topics have no lesson yet (none remain).
export const TOPICS: TopicDef[] = [
  t("python-basics", "Python Basics", "FOUNDATION"),
  t("lists-tuples", "Lists & Tuples", "FOUNDATION", ["python-basics"]),
  t("sets-dicts", "Sets & Dictionaries", "FOUNDATION", ["python-basics"]),
  t("python-builtins", "Built-ins, Classes & Iterators", "FOUNDATION", ["lists-tuples", "sets-dicts"]),
  t("coding-practices", "Best Coding Practices", "FOUNDATION", ["python-basics"]),
  t("complexity", "Time & Space Complexity", "FOUNDATION", ["python-basics"]),

  t("arrays", "Arrays, Lists & Matrices", "BEGINNER", ["lists-tuples", "complexity"]),
  t("sorting-basics", "Sorting Basics", "BEGINNER", ["arrays"]),

  t("prefix-sum", "Prefix Sum", "CORE", ["arrays"]),
  t("two-pointers", "Two Pointers", "CORE", ["arrays"]),
  t("sliding-window", "Sliding Window", "CORE", ["two-pointers", "sets-dicts"]),
  t("binary-search", "Binary Search", "CORE", ["sorting-basics"]),
  t("recursion-1", "Recursion I", "CORE", ["complexity", "arrays"]),
  t("sorting-advanced", "Sorting II (Merge, Quick, Bucket, Cyclic)", "CORE", ["sorting-basics", "recursion-1"]),
  t("numerics", "Numerics & Math", "CORE", ["recursion-1"]),

  t("linked-lists", "Linked Lists", "INTERMEDIATE", ["arrays"]),
  t("stacks-queues", "Stacks, Queues & Monotonicity", "INTERMEDIATE", ["linked-lists"]),
  t("recursion-2", "Recursion II: Backtracking & Divide and Conquer", "INTERMEDIATE", ["recursion-1"]),
  t("greedy", "Greedy", "INTERMEDIATE", ["sorting-basics"]),
  t("trees", "Binary Trees & BSTs", "INTERMEDIATE", ["recursion-1"]),
  t("heap", "Heap", "INTERMEDIATE", ["trees"]),
  t("graphs", "Graphs", "INTERMEDIATE", ["arrays", "sets-dicts"]),
  t("bfs", "BFS", "INTERMEDIATE", ["graphs", "stacks-queues"]),
  t("dfs", "DFS", "INTERMEDIATE", ["graphs", "recursion-1"]),
  t("topological-sort", "Topological Sort", "INTERMEDIATE", ["bfs", "dfs"]),
  t("union-find", "Union-Find (DSU)", "INTERMEDIATE", ["graphs"]),
  t("dp-top-down", "Dynamic Programming: Top-Down", "INTERMEDIATE", ["recursion-2"]),
  t("dp-bottom-up", "Dynamic Programming: Bottom-Up (Tabulation, Knapsack)", "INTERMEDIATE", ["dp-top-down"]),

  t("shortest-paths", "Shortest Paths (Dijkstra, Bellman-Ford, Floyd-Warshall)", "ADVANCED", ["bfs", "heap"]),
  t("mst", "Minimum Spanning Tree", "ADVANCED", ["union-find"]),
  t("segment-tree", "Segment Tree", "ADVANCED", ["trees", "prefix-sum"]),
  t("fenwick-tree", "Fenwick Tree", "ADVANCED", ["prefix-sum"]),
  t("sparse-table", "Sparse Table", "ADVANCED", ["prefix-sum"]),
  t("dp-advanced", "Advanced DP (Bitmask, Digit, Tree DP)", "ADVANCED", ["dp-bottom-up", "bit-manipulation"]),
  t("number-theory", "Number Theory & Combinatorics", "ADVANCED", ["numerics"]),
  t("string-algorithms", "String Algorithms (KMP, Z, Rolling Hash, Trie)", "ADVANCED", ["arrays"]),
  t("bit-manipulation", "Bit Manipulation", "ADVANCED", ["numerics"]),
  t("geometry", "Computational Geometry", "ADVANCED", ["numerics"]),

  t("contest-strategy", "Contest Strategy & Time Management", "EXPERT", ["greedy", "dp-top-down"]),
  t("upsolving", "Upsolving & Pattern Recognition", "EXPERT", ["contest-strategy"]),
];

export const bySlug = new Map(TOPICS.map((x) => [x.slug, x]));
export const dependentsOf = (slug: string) => TOPICS.filter((x) => x.prereqs.includes(slug));

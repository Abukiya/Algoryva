import type { Lesson } from "./lessons";

// Original lesson text (not copied from the A2SV slides). Python-first.
export const MORE: Record<string, Lesson> = {
  complexity: { blocks: [
    { heading: "Why it matters", text: "Contest problems come with limits such as n up to 200000. A program does roughly 10^8 simple operations per second, so you must pick an algorithm whose growth fits the limit before you write any code." },
    { heading: "Big-O in practice", text: "Count how the work grows with n. One loop over the input is O(n). A loop inside a loop over the same input is O(n^2). Halving the range each step is O(log n). Sorting is O(n log n). For n = 200000, O(n^2) is far too slow, while O(n log n) is comfortable.",
      code: "def has_duplicate_slow(a):      # O(n^2)\n    for i in range(len(a)):\n        for j in range(i + 1, len(a)):\n            if a[i] == a[j]:\n                return True\n    return False\n\ndef has_duplicate_fast(a):      # O(n) time, O(n) memory\n    return len(set(a)) != len(a)" },
    { heading: "Space and trade-offs", text: "Extra memory often buys speed: the set above uses O(n) memory to remove a whole loop. Always state both time and space when you describe a solution." },
  ]},
  "sliding-window": { blocks: [
    { heading: "The problem", text: "Questions about contiguous subarrays or substrings (best sum of k elements, longest segment satisfying a rule) are O(n*k) or O(n^2) if you recompute each segment from scratch." },
    { heading: "Fixed-size window", text: "Keep the running total of the current window. Moving right adds one element and removes one, so each step is O(1) and the whole scan is O(n).",
      code: "def max_window_sum(a, k):\n    window = sum(a[:k])\n    best = window\n    for i in range(k, len(a)):\n        window += a[i] - a[i - k]\n        best = max(best, window)\n    return best" },
    { heading: "Variable-size window", text: "Expand the right edge every step. While the window breaks the rule, shrink from the left. This works when shrinking can only help, for example when all numbers are positive.",
      code: "def longest_under(a, s):\n    left = total = best = 0\n    for right, x in enumerate(a):\n        total += x\n        while total > s:\n            total -= a[left]\n            left += 1\n        best = max(best, right - left + 1)\n    return best" },
    { heading: "Common mistakes", text: "Using a variable window when negative numbers break monotonicity; forgetting to update the answer after shrinking; off-by-one when computing the window length as right - left + 1." },
  ]},
  "sorting-basics": { blocks: [
    { heading: "Simple sorts", text: "Bubble, selection and insertion sort all run in O(n^2). They are useful for understanding sorting and for tiny inputs. Insertion sort is also fast on nearly sorted data.",
      code: "def insertion_sort(a):\n    for i in range(1, len(a)):\n        x, j = a[i], i - 1\n        while j >= 0 and a[j] > x:\n            a[j + 1] = a[j]\n            j -= 1\n        a[j + 1] = x\n    return a" },
    { heading: "Counting sort", text: "When values are small integers in a known range, count how many times each value occurs and rebuild the array. This runs in O(n + k), where k is the range size, and beats comparison sorts when k is small." },
    { heading: "In real solutions", text: "In Python you will almost always call sorted() or list.sort(), which is O(n log n) and stable. Stable means equal elements keep their original order, which matters when sorting by one key after another." },
  ]},
  "recursion-1": { blocks: [
    { heading: "The idea", text: "A recursive function solves a problem by solving a smaller version of the same problem. Every recursive function needs a base case that stops the recursion and a step that moves toward it." },
    { heading: "Example: fast power", text: "x^n can be computed with about log n multiplications by squaring the half power.",
      code: "def power(x, n):\n    if n == 0:\n        return 1\n    half = power(x, n // 2)\n    return half * half if n % 2 == 0 else half * half * x" },
    { heading: "Common mistakes", text: "A missing or unreachable base case gives infinite recursion. Python limits depth to about 1000 by default; deep recursion may need an iterative version or a raised limit. Recomputing the same subproblem many times is what dynamic programming later fixes." },
  ]},
  "stacks-queues": { blocks: [
    { heading: "Stack and queue", text: "A stack is last-in, first-out: use a list with append and pop. A queue is first-in, first-out: use collections.deque with append and popleft (list.pop(0) is O(n))." },
    { heading: "Matching brackets", text: "Push opening brackets. On a closing bracket, the top of the stack must be its partner.",
      code: "def is_valid(s):\n    pairs = {')': '(', ']': '[', '}': '{'}\n    stack = []\n    for c in s:\n        if c in '([{':\n            stack.append(c)\n        elif not stack or stack.pop() != pairs[c]:\n            return False\n    return not stack" },
    { heading: "Monotonic stack", text: "Keep the stack ordered so that elements which can no longer be an answer are removed. Each element is pushed and popped once, so the total is O(n). Example: the next greater element to the right.",
      code: "def next_greater(a):\n    res = [-1] * len(a)\n    stack = []  # indices whose next greater value is still unknown\n    for i, x in enumerate(a):\n        while stack and a[stack[-1]] < x:\n            res[stack.pop()] = x\n        stack.append(i)\n    return res" },
  ]},
  "linked-lists": { blocks: [
    { heading: "Structure", text: "A linked list stores each value in a node that points to the next node. Inserting or removing after a known node is O(1), but reaching the k-th node takes O(k).",
      code: "class Node:\n    def __init__(self, val, next=None):\n        self.val = val\n        self.next = next" },
    { heading: "Reversing", text: "Walk once, pointing each node backwards. Save the next node before you overwrite the pointer.",
      code: "def reverse(head):\n    prev = None\n    while head:\n        nxt = head.next\n        head.next = prev\n        prev = head\n        head = nxt\n    return prev" },
    { heading: "Cycle detection (fast and slow pointers)", text: "Move one pointer one step and another two steps. If there is a cycle they meet; otherwise the fast pointer reaches the end. The same trick finds the middle of a list.",
      code: "def has_cycle(head):\n    slow = fast = head\n    while fast and fast.next:\n        slow = slow.next\n        fast = fast.next.next\n        if slow is fast:\n            return True\n    return False" },
  ]},
  greedy: { blocks: [
    { heading: "The idea", text: "A greedy algorithm builds a solution by always taking the best-looking choice right now. It is fast and simple, but it is only correct when that local choice never hurts the final answer." },
    { heading: "Example: maximum meetings", text: "To attend as many non-overlapping meetings as possible, always pick the meeting that ends earliest among those that fit. Sort by end time and scan.",
      code: "def max_meetings(intervals):\n    intervals.sort(key=lambda x: x[1])\n    count, last_end = 0, float('-inf')\n    for start, end in intervals:\n        if start >= last_end:\n            count += 1\n            last_end = end\n    return count" },
    { heading: "Proving it", text: "Use an exchange argument: take any optimal solution and show you can swap its first choice for the greedy choice without making it worse. If you cannot argue this, test the idea against a brute-force solution on small inputs before trusting it." },
  ]},
  trees: { blocks: [
    { heading: "Binary trees", text: "A binary tree node has a value and up to two children. Most tree problems are solved recursively: handle the empty tree, then combine the answers from the left and right subtrees.",
      code: "class TreeNode:\n    def __init__(self, val, left=None, right=None):\n        self.val = val\n        self.left = left\n        self.right = right\n\ndef height(node):\n    if not node:\n        return 0\n    return 1 + max(height(node.left), height(node.right))" },
    { heading: "Traversals", text: "Inorder visits left, node, right. Preorder visits node first, postorder visits node last. Level-order uses a queue.",
      code: "def inorder(node):\n    if not node:\n        return []\n    return inorder(node.left) + [node.val] + inorder(node.right)" },
    { heading: "Binary search trees", text: "In a BST every value in the left subtree is smaller than the node and every value in the right subtree is larger, so search, insert and delete follow one path from the root: O(height). The inorder traversal of a BST is sorted." },
  ]},
  heap: { blocks: [
    { heading: "What a heap gives you", text: "A heap is a tree stored in an array that always exposes its smallest (or largest) element. Push and pop cost O(log n); peeking costs O(1). Python's heapq is a min-heap." },
    { heading: "Example: k-th largest", text: "Keep a min-heap of size k. Its smallest element is then the k-th largest seen so far. Time is O(n log k).",
      code: "import heapq\n\ndef kth_largest(nums, k):\n    heap = []\n    for x in nums:\n        heapq.heappush(heap, x)\n        if len(heap) > k:\n            heapq.heappop(heap)\n    return heap[0]" },
    { heading: "Max-heap trick", text: "heapq has no max-heap. Push negated values and negate on the way out. For tuples, the first element decides the order, so push (priority, item)." },
  ]},
  graphs: { blocks: [
    { heading: "Vertices and edges", text: "A graph is a set of vertices connected by edges. Edges can be directed or undirected, and weighted or unweighted. Many problems (grids, dependencies, networks) are graphs in disguise." },
    { heading: "Adjacency list", text: "Store for each vertex the list of its neighbours. It uses O(V + E) memory and lets you loop over neighbours quickly. For an undirected edge add it in both directions.",
      code: "from collections import defaultdict\n\ndef build_graph(edges):\n    graph = defaultdict(list)\n    for u, v in edges:\n        graph[u].append(v)\n        graph[v].append(u)\n    return graph" },
    { heading: "Next steps", text: "Traversals (BFS and DFS) visit every reachable vertex in O(V + E). Use BFS for shortest paths in unweighted graphs and DFS for exploring, counting components and detecting cycles." },
  ]},
  bfs: { blocks: [
    { heading: "Idea", text: "Breadth-first search explores vertices in order of distance from the start: all vertices one edge away, then two edges away, and so on. That makes it the tool for shortest paths in unweighted graphs and grids." },
    { heading: "Implementation", text: "Use a queue and mark vertices when you enqueue them so each is processed once. Time is O(V + E).",
      code: "from collections import deque\n\ndef bfs(graph, start):\n    dist = {start: 0}\n    queue = deque([start])\n    while queue:\n        node = queue.popleft()\n        for nxt in graph[node]:\n            if nxt not in dist:\n                dist[nxt] = dist[node] + 1\n                queue.append(nxt)\n    return dist" },
    { heading: "Common mistakes", text: "Marking visited when you dequeue instead of when you enqueue can add the same vertex many times. On grids, check bounds before indexing. Use deque, not list.pop(0)." },
  ]},
  dfs: { blocks: [
    { heading: "Idea", text: "Depth-first search goes as deep as possible along one path before backing up. It is a natural fit for exploring everything reachable, counting connected components and searching for cycles." },
    { heading: "Counting components", text: "Start a DFS from every vertex not yet seen. Each start is a new component.",
      code: "def count_components(graph, n):\n    seen = set()\n\n    def dfs(u):\n        seen.add(u)\n        for v in graph[u]:\n            if v not in seen:\n                dfs(v)\n\n    comps = 0\n    for u in range(n):\n        if u not in seen:\n            dfs(u)\n            comps += 1\n    return comps" },
    { heading: "Common mistakes", text: "Forgetting the visited set makes cycles loop forever. Deep graphs can exceed Python's recursion limit, so use an explicit stack for large inputs." },
  ]},
  "union-find": { blocks: [
    { heading: "The problem", text: "You process a stream of 'connect a and b' operations and 'are a and b connected?' queries. Rebuilding components each time is too slow." },
    { heading: "Disjoint set union", text: "Each set is a tree with a representative root. find follows parents to the root (with path compression), and union attaches the smaller tree under the larger one. Operations are almost O(1) amortized.",
      code: "class DSU:\n    def __init__(self, n):\n        self.parent = list(range(n))\n        self.size = [1] * n\n\n    def find(self, x):\n        while self.parent[x] != x:\n            self.parent[x] = self.parent[self.parent[x]]\n            x = self.parent[x]\n        return x\n\n    def union(self, a, b):\n        a, b = self.find(a), self.find(b)\n        if a == b:\n            return False\n        if self.size[a] < self.size[b]:\n            a, b = b, a\n        self.parent[b] = a\n        self.size[a] += self.size[b]\n        return True" },
    { heading: "Recognize it", text: "Grouping items, counting components as edges are added, detecting the edge that closes a cycle (union returns False), and building minimum spanning trees." },
  ]},
  "dp-top-down": { blocks: [
    { heading: "The problem", text: "Some recursions solve the same subproblem many times. Climbing n stairs with 1 or 2 steps calls ways(n-2) from both ways(n) and ways(n-1), and the calls multiply exponentially." },
    { heading: "Memoization", text: "Write the recursion first, then cache each result by its arguments. Each distinct state is now computed once, so the cost is (number of states) times (work per state).",
      code: "from functools import lru_cache\n\n@lru_cache(maxsize=None)\ndef ways(n):\n    if n <= 1:\n        return 1\n    return ways(n - 1) + ways(n - 2)" },
    { heading: "How to design it", text: "Define what the state means in words, write the transition that relates a state to smaller states, then fix the base cases. If the state has too many values, look for a smaller description." },
  ]},
};

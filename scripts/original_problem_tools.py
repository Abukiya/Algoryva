#!/usr/bin/env python3
"""Reference solutions and hidden-test generator for the original problems added with the
shortest-paths, mst and dp-bottom-up lessons.

  python3 scripts/original_problem_tools.py solve <slug> < input.txt     # print the reference answer
  python3 scripts/original_problem_tools.py generate                     # cross-check, then print TypeScript test cases

`generate` first checks every reference solution against an independent brute-force method on many random small
inputs, so the expected outputs in src/content/hiddenTests.ts do not merely agree with their own bugs.
The vitest file src/content/reference.test.ts runs `solve` on every sample and hidden test.
"""
import heapq, itertools, json, math, random, sys

INF = float("inf")
MOD = 10**9 + 7


def read_ints(text):
    return [int(x) for x in text.split()]


# ---------------------------------------------------------------- reference solutions
def cheapest_route(text):
    d = read_ints(text); n, m = d[0], d[1]
    g = [[] for _ in range(n + 1)]
    for i in range(m):
        u, v, w = d[2 + 3 * i: 5 + 3 * i]
        g[u].append((v, w)); g[v].append((u, w))
    dist = [INF] * (n + 1); dist[1] = 0
    pq = [(0, 1)]
    while pq:
        x, u = heapq.heappop(pq)
        if x > dist[u]:
            continue
        for v, w in g[u]:
            if x + w < dist[v]:
                dist[v] = x + w; heapq.heappush(pq, (x + w, v))
    return str(dist[n] if dist[n] != INF else -1)


def negative_cycle_check(text):
    d = read_ints(text); n, m = d[0], d[1]
    edges = [tuple(d[2 + 3 * i: 5 + 3 * i]) for i in range(m)]
    dist = [0] * (n + 1)                     # every node starts at 0: finds a negative cycle anywhere
    for round_ in range(n):
        changed = False
        for a, b, w in edges:
            if dist[a] + w < dist[b]:
                dist[b] = dist[a] + w; changed = True
        if not changed:
            return "NO"
    return "YES"


def cable_network(text):
    d = read_ints(text); n, m = d[0], d[1]
    edges = sorted((d[2 + 3 * i + 2], d[2 + 3 * i], d[2 + 3 * i + 1]) for i in range(m))
    parent = list(range(n + 1))
    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]; x = parent[x]
        return x
    total = used = 0
    for w, a, b in edges:
        ra, rb = find(a), find(b)
        if ra != rb:
            parent[ra] = rb; total += w; used += 1
    return str(total if used == n - 1 else -1)


def extra_cables(text):
    d = read_ints(text); n, m = d[0], d[1]
    parent = list(range(n + 1))
    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]; x = parent[x]
        return x
    comps = n
    for i in range(m):
        a, b = d[2 + 2 * i], d[3 + 2 * i]
        ra, rb = find(a), find(b)
        if ra != rb:
            parent[ra] = rb; comps -= 1
    return str(m - (n - comps))


def knapsack_value(text):
    d = read_ints(text); n, cap = d[0], d[1]
    dp = [0] * (cap + 1)
    for i in range(n):
        wt, val = d[2 + 2 * i], d[3 + 2 * i]
        for c in range(cap, wt - 1, -1):
            dp[c] = max(dp[c], dp[c - wt] + val)
    return str(dp[cap])


def coin_combinations(text):
    d = read_ints(text); n, target = d[0], d[1]
    coins = d[2:2 + n]
    dp = [1] + [0] * target
    for c in coins:
        for a in range(c, target + 1):
            dp[a] = (dp[a] + dp[a - c]) % MOD
    return str(dp[target])


def longest_increasing_subsequence(text):
    from bisect import bisect_left
    d = read_ints(text); n = d[0]
    tails = []
    for x in d[1:1 + n]:
        i = bisect_left(tails, x)
        if i == len(tails): tails.append(x)
        else: tails[i] = x
    return str(len(tails))



# ---------------------------------------------------------------- range-query problems
def _ops_stream(text):
    d = read_ints(text)
    n, q = d[0], d[1]
    a = d[2:2 + n]
    return n, q, a, d, 2 + n


def range_sum_updates(text):
    n, q, a, d, p = _ops_stream(text)
    t = [0] * (n + 1)
    def add(i, v):
        while i <= n:
            t[i] += v; i += i & -i
    def pre(i):
        s_ = 0
        while i > 0:
            s_ += t[i]; i -= i & -i
        return s_
    for i, v in enumerate(a, 1):
        add(i, v)
    cur = list(a); out = []
    for _ in range(q):
        kind = d[p]
        if kind == 1:
            i, v = d[p + 1], d[p + 2]; p += 3
            add(i, v - cur[i - 1]); cur[i - 1] = v
        else:
            l, r = d[p + 1], d[p + 2]; p += 3
            out.append(str(pre(r) - pre(l - 1)))
    return "\n".join(out)


def inversion_count(text):
    d = read_ints(text); n = d[0]; a = d[1:1 + n]
    ranks = {v: i for i, v in enumerate(sorted(set(a)), 1)}
    t = [0] * (len(ranks) + 1)
    inv = 0
    for seen, x in enumerate(a):
        r = ranks[x]; c = 0; i = r
        while i > 0:
            c += t[i]; i -= i & -i
        inv += seen - c
        i = r
        while i <= len(ranks):
            t[i] += 1; i += i & -i
    return str(inv)


def _sparse(a, op):
    t = [list(a)]; k = 1
    while (1 << k) <= len(a):
        prev = t[-1]; h = 1 << (k - 1)
        t.append([op(prev[i], prev[i + h]) for i in range(len(a) - (1 << k) + 1)]); k += 1
    return t


def range_minimum_static(text):
    n, q, a, d, p = _ops_stream(text)
    t = _sparse(a, min); out = []
    for _ in range(q):
        l, r = d[p] - 1, d[p + 1] - 1; p += 2
        k = (r - l + 1).bit_length() - 1
        out.append(str(min(t[k][l], t[k][r - (1 << k) + 1])))
    return "\n".join(out)


def range_spread(text):
    n, q, a, d, p = _ops_stream(text)
    lo, hi = _sparse(a, min), _sparse(a, max); out = []
    for _ in range(q):
        l, r = d[p] - 1, d[p + 1] - 1; p += 2
        k = (r - l + 1).bit_length() - 1
        out.append(str(max(hi[k][l], hi[k][r - (1 << k) + 1]) - min(lo[k][l], lo[k][r - (1 << k) + 1])))
    return "\n".join(out)


def range_min_update(text):
    n, q, a, d, p = _ops_stream(text)
    t = [float("inf")] * n + list(a)
    for i in range(n - 1, 0, -1):
        t[i] = min(t[2 * i], t[2 * i + 1])
    out = []
    for _ in range(q):
        kind = d[p]
        if kind == 1:
            i, v = d[p + 1] - 1 + n, d[p + 2]; p += 3
            t[i] = v
            while i > 1:
                i //= 2; t[i] = min(t[2 * i], t[2 * i + 1])
        else:
            l, r = d[p + 1] - 1 + n, d[p + 2] + n; p += 3
            res = float("inf")
            while l < r:
                if l & 1: res = min(res, t[l]); l += 1
                if r & 1: r -= 1; res = min(res, t[r])
                l //= 2; r //= 2
            out.append(str(res))
    return "\n".join(out)


def range_add_range_sum(text):
    n, q, a, d, p = _ops_stream(text)
    sm = [0] * (4 * n); lz = [0] * (4 * n)
    def build(x, l, r):
        if l == r: sm[x] = a[l]; return
        m = (l + r) // 2; build(2 * x, l, m); build(2 * x + 1, m + 1, r); sm[x] = sm[2 * x] + sm[2 * x + 1]
    build(1, 0, n - 1)
    def push(x, l, r):
        if lz[x]:
            m = (l + r) // 2
            for c, cl, cr in ((2 * x, l, m), (2 * x + 1, m + 1, r)):
                sm[c] += lz[x] * (cr - cl + 1); lz[c] += lz[x]
            lz[x] = 0
    def upd(x, l, r, ql, qr, v):
        if qr < l or r < ql: return
        if ql <= l and r <= qr: sm[x] += v * (r - l + 1); lz[x] += v; return
        push(x, l, r); m = (l + r) // 2
        upd(2 * x, l, m, ql, qr, v); upd(2 * x + 1, m + 1, r, ql, qr, v); sm[x] = sm[2 * x] + sm[2 * x + 1]
    def qry(x, l, r, ql, qr):
        if qr < l or r < ql: return 0
        if ql <= l and r <= qr: return sm[x]
        push(x, l, r); m = (l + r) // 2
        return qry(2 * x, l, m, ql, qr) + qry(2 * x + 1, m + 1, r, ql, qr)
    out = []
    for _ in range(q):
        kind = d[p]
        if kind == 1:
            l, r, v = d[p + 1] - 1, d[p + 2] - 1, d[p + 3]; p += 4
            upd(1, 0, n - 1, l, r, v)
        else:
            l, r = d[p + 1] - 1, d[p + 2] - 1; p += 3
            out.append(str(qry(1, 0, n - 1, l, r)))
    return "\n".join(out)


# ---------------------------------------------------------------- bit and string problems
def bit_count_total(text):
    d = read_ints(text)
    return str(sum(bin(x).count("1") for x in d[1:1 + d[0]]))


def lonely_number(text):
    d = read_ints(text); r = 0
    for x in d[1:1 + d[0]]:
        r ^= x
    return str(r)


def subset_xor_count(text):
    d = read_ints(text); n, k = d[0], d[1]; a = d[2:2 + n]
    xs = [0] * (1 << n); count = 1 if k == 0 else 0
    for mask in range(1, 1 << n):
        low = (mask & -mask).bit_length() - 1
        xs[mask] = xs[mask & (mask - 1)] ^ a[low]
        count += xs[mask] == k
    return str(count)


def kmp_occurrences(text):
    lines = text.split("\n"); t, p = lines[0].strip(), lines[1].strip()
    pi = [0] * len(p); k = 0
    for i in range(1, len(p)):
        while k and p[i] != p[k]: k = pi[k - 1]
        if p[i] == p[k]: k += 1
        pi[i] = k
    hits = 0; k = 0
    for ch in t:
        while k and ch != p[k]: k = pi[k - 1]
        if ch == p[k]: k += 1
        if k == len(p): hits += 1; k = pi[k - 1]
    return str(hits)


def shortest_period(text):
    s_ = text.strip(); pi = [0] * len(s_); k = 0
    for i in range(1, len(s_)):
        while k and s_[i] != s_[k]: k = pi[k - 1]
        if s_[i] == s_[k]: k += 1
        pi[i] = k
    per = len(s_) - pi[-1]
    return str(per if len(s_) % per == 0 else len(s_))


def prefix_count(text):
    tok = text.split(); n, q = int(tok[0]), int(tok[1])
    words, queries = tok[2:2 + n], tok[2 + n:2 + n + q]
    root = {"c": 0, "k": {}}
    for w in words:
        node = root; node["c"] += 1
        for ch in w:
            node = node["k"].setdefault(ch, {"c": 0, "k": {}}); node["c"] += 1
    out = []
    for pre in queries:
        node = root
        for ch in pre:
            node = node["k"].get(ch)
            if node is None: break
        out.append(str(node["c"] if node else 0))
    return "\n".join(out)


# ---------------------------------------------------------------- number theory problems
def modular_inverse(text):
    a, m = read_ints(text)[:2]
    def ext(x, y):
        if y == 0: return x, 1, 0
        g, u, v = ext(y, x % y)
        return g, v, u - (x // y) * v
    g, x, _ = ext(a % m, m)
    return str(x % m) if g == 1 else "-1"


def ncr_queries(text):
    d = read_ints(text); q = d[0]
    qs = [(d[1 + 2 * i], d[2 + 2 * i]) for i in range(q)]
    top = max([n for n, _ in qs] + [0])
    fact = [1] * (top + 1)
    for i in range(1, top + 1): fact[i] = fact[i - 1] * i % MOD
    inv = [1] * (top + 1); inv[top] = pow(fact[top], MOD - 2, MOD)
    for i in range(top, 0, -1): inv[i - 1] = inv[i] * i % MOD
    return "\n".join(str(0 if r < 0 or r > n else fact[n] * inv[r] % MOD * inv[n - r] % MOD) for n, r in qs)


def grid_paths_modulo(text):
    R, C, a, b = read_ints(text)[:4]
    top = R + C
    fact = [1] * (top + 1)
    for i in range(1, top + 1): fact[i] = fact[i - 1] * i % MOD
    inv = [1] * (top + 1); inv[top] = pow(fact[top], MOD - 2, MOD)
    for i in range(top, 0, -1): inv[i - 1] = inv[i] * i % MOD
    def ncr(n, r): return fact[n] * inv[r] % MOD * inv[n - r] % MOD
    return str(ncr(a + b - 2, a - 1) * ncr(R - a + C - b, R - a) % MOD)


def coprime_count(text):
    n, m = read_ints(text)[:2]
    primes, x, dd = [], m, 2
    while dd * dd <= x:
        if x % dd == 0:
            primes.append(dd)
            while x % dd == 0: x //= dd
        dd += 1
    if x > 1: primes.append(x)
    total = 0
    for mask in range(1 << len(primes)):
        prod, bits = 1, 0
        for i, p_ in enumerate(primes):
            if mask >> i & 1: prod *= p_; bits += 1
        total += (-1) ** bits * (n // prod)
    return str(total)


# ---------------------------------------------------------------- advanced DP problems
def min_assignment(text):
    d = read_ints(text); n = d[0]
    cost = [d[1 + i * n: 1 + (i + 1) * n] for i in range(n)]
    dp = [INF] * (1 << n); dp[0] = 0
    for mask in range(1 << n):
        if dp[mask] == INF: continue
        k = bin(mask).count("1")
        if k == n: continue
        for j in range(n):
            if not mask >> j & 1:
                nxt = mask | (1 << j)
                dp[nxt] = min(dp[nxt], dp[mask] + cost[k][j])
    return str(dp[(1 << n) - 1])


def shortest_tour(text):
    d = read_ints(text); n = d[0]
    dist = [d[1 + i * n: 1 + (i + 1) * n] for i in range(n)]
    dp = [[INF] * n for _ in range(1 << n)]; dp[1][0] = 0
    for mask in range(1 << n):
        for last in range(n):
            if dp[mask][last] == INF or not mask >> last & 1: continue
            for nxt in range(n):
                if not mask >> nxt & 1:
                    nm = mask | (1 << nxt)
                    dp[nm][nxt] = min(dp[nm][nxt], dp[mask][last] + dist[last][nxt])
    full = (1 << n) - 1
    return str(min(dp[full][last] + dist[last][0] for last in range(n)))


def digit_sum_count(text):
    from functools import lru_cache
    N, S = read_ints(text)[:2]
    digits = list(map(int, str(N)))
    @lru_cache(maxsize=None)
    def go(pos, rem, tight):
        if rem < 0: return 0
        if pos == len(digits): return 1 if rem == 0 else 0
        limit = digits[pos] if tight else 9
        return sum(go(pos + 1, rem - dd, tight and dd == limit) for dd in range(limit + 1))
    total = go(0, S, True)
    return str(total - 1 if S == 0 else total)          # the number 0 is not in 1..N


def tree_independent_set(text):
    d = read_ints(text); n = d[0]
    w = d[1:1 + n]; edges = [(d[1 + n + 2 * i] - 1, d[2 + n + 2 * i] - 1) for i in range(n - 1)]
    g = [[] for _ in range(n)]
    for a, b in edges: g[a].append(b); g[b].append(a)
    parent = [-1] * n; order = []; seen = [False] * n; seen[0] = True; stack = [0]
    while stack:
        u = stack.pop(); order.append(u)
        for v in g[u]:
            if not seen[v]: seen[v] = True; parent[v] = u; stack.append(v)
    take = list(w); skip = [0] * n
    for u in reversed(order):
        p = parent[u]
        if p != -1: take[p] += skip[u]; skip[p] += max(take[u], skip[u])
    return str(max(take[0], skip[0]))


def no_adjacent_equal_digits(text):
    from functools import lru_cache
    N = read_ints(text)[0]
    digits = list(map(int, str(N)))
    @lru_cache(maxsize=None)
    def go(pos, last, tight, started):
        if pos == len(digits): return 1 if started else 0
        limit = digits[pos] if tight else 9; total = 0
        for dd in range(limit + 1):
            nt = tight and dd == limit
            if not started and dd == 0: total += go(pos + 1, -1, nt, False)
            elif dd == last: continue
            else: total += go(pos + 1, dd, nt, True)
        return total
    return str(go(0, -1, True, False))


# ---------------------------------------------------------------- geometry (exact integer arithmetic throughout)
def cross3(o, a, b):
    """Twice the signed area of triangle o, a, b: > 0 when b is left of the ray o -> a."""
    return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])


def orientation_test(text):
    v = read_ints(text)
    out = []
    for i in range(v[0]):
        x1, y1, x2, y2, x3, y3 = v[1 + 6 * i:7 + 6 * i]
        c = (x2 - x1) * (y3 - y1) - (y2 - y1) * (x3 - x1)
        out.append("LEFT" if c > 0 else "RIGHT" if c < 0 else "ON")
    return "\n".join(out)


def polygon_double_area(text):
    v = read_ints(text)
    n = v[0]
    pts = [(v[1 + 2 * i], v[2 + 2 * i]) for i in range(n)]
    s = 0
    for i in range(n):
        (x1, y1), (x2, y2) = pts[i], pts[(i + 1) % n]
        s += x1 * y2 - x2 * y1          # shoelace: exact big integers, no overflow in Python
    return str(abs(s))


def hull_corners(text):
    v = read_ints(text)
    pts = sorted(set((v[1 + 2 * i], v[2 + 2 * i]) for i in range(v[0])))
    if len(pts) <= 2:
        return str(len(pts))
    lower, upper = [], []
    for p in pts:                        # Andrew's monotone chain; <= 0 drops collinear points
        while len(lower) >= 2 and cross3(lower[-2], lower[-1], p) <= 0:
            lower.pop()
        lower.append(p)
    for p in reversed(pts):
        while len(upper) >= 2 and cross3(upper[-2], upper[-1], p) <= 0:
            upper.pop()
        upper.append(p)
    return str((len(lower) - 1) + (len(upper) - 1))


def _in_box(p, a, b):
    return min(a[0], b[0]) <= p[0] <= max(a[0], b[0]) and min(a[1], b[1]) <= p[1] <= max(a[1], b[1])


def segment_touch(text):
    v = read_ints(text)
    n = v[0]
    S = [((v[1 + 4 * i], v[2 + 4 * i]), (v[3 + 4 * i], v[4 + 4 * i])) for i in range(n)]

    def touch(s, t):
        (a, b), (c, d) = s, t
        d1, d2 = cross3(a, b, c), cross3(a, b, d)
        d3, d4 = cross3(c, d, a), cross3(c, d, b)
        if ((d1 > 0 and d2 < 0) or (d1 < 0 and d2 > 0)) and ((d3 > 0 and d4 < 0) or (d3 < 0 and d4 > 0)):
            return True                  # proper crossing
        return (d1 == 0 and _in_box(c, a, b)) or (d2 == 0 and _in_box(d, a, b)) or \
               (d3 == 0 and _in_box(a, c, d)) or (d4 == 0 and _in_box(b, c, d))   # an endpoint touches

    return "YES" if any(touch(S[i], S[j]) for i in range(n) for j in range(i + 1, n)) else "NO"


def interior_lattice(text):
    """Pick's theorem: A = I + B/2 - 1, so I = (2A - B + 2) / 2."""
    v = read_ints(text)
    n = v[0]
    pts = [(v[1 + 2 * i], v[2 + 2 * i]) for i in range(n)]
    twice_area, boundary = 0, 0
    for i in range(n):
        (x1, y1), (x2, y2) = pts[i], pts[(i + 1) % n]
        twice_area += x1 * y2 - x2 * y1
        boundary += math.gcd(abs(x2 - x1), abs(y2 - y1))
    return str((abs(twice_area) - boundary + 2) // 2)


# ---- independent brute-force methods
def brute_orientation(text):
    from fractions import Fraction
    v = read_ints(text)
    out = []
    for i in range(v[0]):
        x1, y1, x2, y2, x3, y3 = v[1 + 6 * i:7 + 6 * i]
        if x2 != x1:                     # compare with the line's height at x3, in exact fractions
            side = Fraction(y3) - (Fraction(y2 - y1, x2 - x1) * (x3 - x1) + y1)
            if x2 > x1:
                out.append("LEFT" if side > 0 else "RIGHT" if side < 0 else "ON")
            else:
                out.append("RIGHT" if side > 0 else "LEFT" if side < 0 else "ON")
        else:                            # vertical line: compare x3 with x1
            side = x3 - x1
            if y2 > y1:
                out.append("LEFT" if side < 0 else "RIGHT" if side > 0 else "ON")
            else:
                out.append("RIGHT" if side < 0 else "LEFT" if side > 0 else "ON")
    return "\n".join(out)


def brute_double_area(text):
    """Count lattice points by enumeration (ray casting for inside, direct test for the boundary); apply Pick."""
    v = read_ints(text)
    n = v[0]
    P = [(v[1 + 2 * i], v[2 + 2 * i]) for i in range(n)]

    def on_boundary(p):
        return any(cross3(P[i], P[(i + 1) % n], p) == 0 and _in_box(p, P[i], P[(i + 1) % n]) for i in range(n))

    def inside(p):
        c = False
        for i in range(n):
            (x1, y1), (x2, y2) = P[i], P[(i + 1) % n]
            if (y1 > p[1]) != (y2 > p[1]):
                lhs, rhs = (p[0] - x1) * (y2 - y1), (p[1] - y1) * (x2 - x1)
                if (lhs < rhs) if y2 > y1 else (lhs > rhs):
                    c = not c
        return c

    xs, ys = [p[0] for p in P], [p[1] for p in P]
    I = B = 0
    for x in range(min(xs), max(xs) + 1):
        for y in range(min(ys), max(ys) + 1):
            if on_boundary((x, y)):
                B += 1
            elif inside((x, y)):
                I += 1
    return str(2 * I + B - 2)            # Pick's theorem gives twice the area from I and B


def brute_hull_corners(text):
    from itertools import combinations
    v = read_ints(text)
    pts = sorted(set((v[1 + 2 * i], v[2 + 2 * i]) for i in range(v[0])))

    def covered(p, group):              # is p in the convex hull of this group (at most 3 points)?
        if len(group) == 1:
            return p == group[0]
        if len(group) == 2:
            a, b = group
            return cross3(a, b, p) == 0 and _in_box(p, a, b)
        a, b, c = group
        if cross3(a, b, c) == 0:
            return False                # a flat triple is covered by its extreme pair
        d1, d2, d3 = cross3(a, b, p), cross3(b, c, p), cross3(c, a, p)
        return not ((d1 > 0 or d2 > 0 or d3 > 0) and (d1 < 0 or d2 < 0 or d3 < 0))

    corners = 0
    for p in pts:
        others = [q for q in pts if q != p]
        # Caratheodory: p lies in conv(others) iff it lies in the hull of some at most 3 of them
        if not any(covered(p, g) for k in (1, 2, 3) for g in combinations(others, k)):
            corners += 1
    return str(corners)


def brute_segment(text):
    from fractions import Fraction
    v = read_ints(text)
    n = v[0]
    S = [((v[1 + 4 * i], v[2 + 4 * i]), (v[3 + 4 * i], v[4 + 4 * i])) for i in range(n)]

    def hit(s, t):                      # solve A + r*u = C + s*w with exact fractions
        (x1, y1), (x2, y2) = s
        (x3, y3), (x4, y4) = t
        den = (x2 - x1) * (y4 - y3) - (y2 - y1) * (x4 - x3)
        if den != 0:
            tt = Fraction((x3 - x1) * (y4 - y3) - (y3 - y1) * (x4 - x3), den)
            uu = Fraction((x3 - x1) * (y2 - y1) - (y3 - y1) * (x2 - x1), den)
            return 0 <= tt <= 1 and 0 <= uu <= 1
        if (x3 - x1) * (y2 - y1) - (y3 - y1) * (x2 - x1) != 0:
            return False                # parallel but not on the same line
        if x1 != x2:                    # collinear: overlap of the intervals along x
            a1, b1 = sorted((x1, x2)); a2, b2 = sorted((x3, x4))
        else:
            a1, b1 = sorted((y1, y2)); a2, b2 = sorted((y3, y4))
        return max(a1, a2) <= min(b1, b2)

    return "YES" if any(hit(S[i], S[j]) for i in range(n) for j in range(i + 1, n)) else "NO"


def brute_interior(text):
    """Count strictly interior lattice points directly (no formula)."""
    v = read_ints(text)
    n = v[0]
    P = [(v[1 + 2 * i], v[2 + 2 * i]) for i in range(n)]

    def on_boundary(p):
        return any(cross3(P[i], P[(i + 1) % n], p) == 0 and _in_box(p, P[i], P[(i + 1) % n]) for i in range(n))

    def inside(p):
        c = False
        for i in range(n):
            (x1, y1), (x2, y2) = P[i], P[(i + 1) % n]
            if (y1 > p[1]) != (y2 > p[1]):
                lhs, rhs = (p[0] - x1) * (y2 - y1), (p[1] - y1) * (x2 - x1)
                if (lhs < rhs) if y2 > y1 else (lhs > rhs):
                    c = not c
        return c

    xs, ys = [p[0] for p in P], [p[1] for p in P]
    return str(sum(1 for x in range(min(xs), max(xs) + 1) for y in range(min(ys), max(ys) + 1)
                   if not on_boundary((x, y)) and inside((x, y))))


# ---- random small inputs for the cross-checks
def angle_sort(pts):
    """Sort points by angle around the origin, counterclockwise from the positive x-axis, with exact integers."""
    import functools
    def half(p):
        return 0 if (p[1] > 0 or (p[1] == 0 and p[0] > 0)) else 1
    def cmp(a, b):
        if half(a) != half(b):
            return half(a) - half(b)
        c = a[0] * b[1] - a[1] * b[0]
        return -1 if c > 0 else (1 if c < 0 else 0)
    return sorted(pts, key=functools.cmp_to_key(cmp))


def star_polygon(rng, lo=-6, hi=6):
    """A simple polygon: points sorted by angle around the origin, which lies strictly inside."""
    while True:
        cand = list({(rng.randint(lo, hi), rng.randint(lo, hi)) for _ in range(rng.randint(3, 8))} - {(0, 0)})
        if len(cand) < 3:
            continue
        if any(cross3((0, 0), a, b) == 0 and a[0] * b[0] + a[1] * b[1] > 0
               for i, a in enumerate(cand) for b in cand[i + 1:]):
            continue                    # two points in the same direction from the origin
        cand = angle_sort(cand)
        if all(cross3((0, 0), cand[i], cand[(i + 1) % len(cand)]) > 0 for i in range(len(cand))):
            return cand


def polygon_text(pts):
    return f"{len(pts)}\n" + "\n".join(f"{x} {y}" for x, y in pts)


def random_geometry(slug, rng):
    if slug == "orientation-test":
        rows = []
        for _ in range(rng.randint(1, 5)):
            while True:
                p = [rng.randint(-4, 4) for _ in range(6)]
                if (p[0], p[1]) != (p[2], p[3]):
                    break
            rows.append(" ".join(map(str, p)))
        return f"{len(rows)}\n" + "\n".join(rows)
    if slug == "polygon-double-area":
        return polygon_text(star_polygon(rng))
    if slug == "interior-lattice-points":
        return polygon_text(star_polygon(rng))
    if slug == "hull-corners":
        n = rng.randint(1, 7)
        return f"{n}\n" + "\n".join(f"{rng.randint(0, 4)} {rng.randint(0, 4)}" for _ in range(n))
    if slug == "segment-touch":
        rows = []
        for _ in range(rng.randint(1, 4)):
            while True:
                s = [rng.randint(0, 4) for _ in range(4)]
                if (s[0], s[1]) != (s[2], s[3]):
                    break
            rows.append(" ".join(map(str, s)))
        return f"{len(rows)}\n" + "\n".join(rows)
    raise KeyError(slug)


GEOMETRY_SLUGS = ["orientation-test", "polygon-double-area", "hull-corners", "segment-touch", "interior-lattice-points"]

SOLVERS_GEOMETRY = {"orientation-test": orientation_test, "polygon-double-area": polygon_double_area,
                    "hull-corners": hull_corners, "segment-touch": segment_touch,
                    "interior-lattice-points": interior_lattice}
BRUTE_GEOMETRY = {"orientation-test": brute_orientation, "polygon-double-area": brute_double_area,
                  "hull-corners": brute_hull_corners, "segment-touch": brute_segment,
                  "interior-lattice-points": brute_interior}


SOLVERS = {
    "cheapest-route": cheapest_route, "negative-cycle-check": negative_cycle_check, "cable-network": cable_network,
    "extra-cables": extra_cables, "knapsack-value": knapsack_value, "coin-combinations": coin_combinations,
    "longest-increasing-subsequence": longest_increasing_subsequence,
    "range-sum-updates": range_sum_updates, "inversion-count": inversion_count, "range-minimum-static": range_minimum_static,
    "range-spread": range_spread, "range-min-update": range_min_update, "range-add-range-sum": range_add_range_sum,
    "bit-count-total": bit_count_total, "lonely-number": lonely_number, "subset-xor-count": subset_xor_count,
    "kmp-occurrences": kmp_occurrences, "shortest-period": shortest_period, "prefix-count": prefix_count,
    "modular-inverse": modular_inverse, "ncr-queries": ncr_queries, "grid-paths-modulo": grid_paths_modulo, "coprime-count": coprime_count,
    "min-assignment": min_assignment, "shortest-tour": shortest_tour, "digit-sum-count": digit_sum_count,
    "tree-independent-set": tree_independent_set, "no-adjacent-equal-digits": no_adjacent_equal_digits,
}


# ---------------------------------------------------------------- independent brute-force checks
def brute_cheapest(text):
    d = read_ints(text); n, m = d[0], d[1]
    dist = [[INF] * (n + 1) for _ in range(n + 1)]
    for i in range(1, n + 1): dist[i][i] = 0
    for i in range(m):
        u, v, w = d[2 + 3 * i: 5 + 3 * i]
        dist[u][v] = min(dist[u][v], w); dist[v][u] = min(dist[v][u], w)
    for k in range(1, n + 1):
        for i in range(1, n + 1):
            for j in range(1, n + 1):
                dist[i][j] = min(dist[i][j], dist[i][k] + dist[k][j])
    return str(dist[1][n] if dist[1][n] != INF else -1)


def brute_negcycle(text):
    d = read_ints(text); n, m = d[0], d[1]
    dist = [[INF] * (n + 1) for _ in range(n + 1)]
    for i in range(1, n + 1): dist[i][i] = 0
    for i in range(m):
        a, b, w = d[2 + 3 * i: 5 + 3 * i]
        dist[a][b] = min(dist[a][b], w)
    for k in range(1, n + 1):
        for i in range(1, n + 1):
            for j in range(1, n + 1):
                if dist[i][k] + dist[k][j] < dist[i][j]:
                    dist[i][j] = dist[i][k] + dist[k][j]
    return "YES" if any(dist[i][i] < 0 for i in range(1, n + 1)) else "NO"


def brute_mst(text):
    d = read_ints(text); n, m = d[0], d[1]
    edges = [tuple(d[2 + 3 * i: 5 + 3 * i]) for i in range(m)]
    best = None
    for chosen in itertools.combinations(edges, n - 1):
        p = list(range(n + 1))
        def find(x):
            while p[x] != x: x = p[x]
            return x
        for a, b, w in chosen:
            p[find(a)] = find(b)
        if len({find(i) for i in range(1, n + 1)}) == 1:
            c = sum(w for _, _, w in chosen)
            best = c if best is None else min(best, c)
    return str(best if best is not None else -1)


def brute_extra(text):
    d = read_ints(text); n, m = d[0], d[1]
    pairs = [(d[2 + 2 * i], d[3 + 2 * i]) for i in range(m)]
    def comps(es):
        adj = {i: set() for i in range(1, n + 1)}
        for a, b in es: adj[a].add(b); adj[b].add(a)
        seen, c = set(), 0
        for s in adj:
            if s in seen: continue
            c += 1; stack = [s]; seen.add(s)
            while stack:
                u = stack.pop()
                for v in adj[u]:
                    if v not in seen: seen.add(v); stack.append(v)
        return c
    base = comps(pairs)
    for removed in range(m, -1, -1):             # the largest number of cables whose removal changes nothing
        for drop in itertools.combinations(range(m), removed):
            keep = [p for i, p in enumerate(pairs) if i not in drop]
            if comps(keep) == base:
                return str(removed)
    return "0"


def brute_knapsack(text):
    d = read_ints(text); n, cap = d[0], d[1]
    items = [(d[2 + 2 * i], d[3 + 2 * i]) for i in range(n)]
    best = 0
    for mask in range(1 << n):
        w = sum(items[i][0] for i in range(n) if mask >> i & 1)
        if w <= cap: best = max(best, sum(items[i][1] for i in range(n) if mask >> i & 1))
    return str(best)


def brute_coins(text):
    d = read_ints(text); n, target = d[0], d[1]
    coins = d[2:2 + n]
    def go(i, rem):
        if rem == 0: return 1
        if i == len(coins): return 0
        total, used = 0, 0
        while used * coins[i] <= rem:
            total += go(i + 1, rem - used * coins[i]); used += 1
        return total
    return str(go(0, target) % MOD)


def brute_lis(text):
    d = read_ints(text); n = d[0]; a = d[1:1 + n]
    dp = [1] * n
    for i in range(n):
        for j in range(i):
            if a[j] < a[i]: dp[i] = max(dp[i], dp[j] + 1)
    return str(max(dp))



def _walk_ops(text, kinds):
    n, q, a, d, p = _ops_stream(text)
    a = list(a); out = []
    for _ in range(q):
        kind = d[p]
        if kind == 1 and kinds == "set":
            a[d[p + 1] - 1] = d[p + 2]; p += 3
        elif kind == 1 and kinds == "add":
            for i in range(d[p + 1] - 1, d[p + 2]): a[i] += d[p + 3]
            p += 4
        else:
            out.append((a[d[p + 1] - 1: d[p + 2]])); p += 3
    return out


def brute_range_sum_updates(text): return "\n".join(str(sum(x)) for x in _walk_ops(text, "set"))
def brute_range_min_update(text): return "\n".join(str(min(x)) for x in _walk_ops(text, "set"))
def brute_range_add_sum(text): return "\n".join(str(sum(x)) for x in _walk_ops(text, "add"))


def _static_queries(text):
    n, q, a, d, p = _ops_stream(text)
    return [a[d[p + 2 * i] - 1: d[p + 2 * i + 1]] for i in range(q)]


def brute_range_min_static(text): return "\n".join(str(min(x)) for x in _static_queries(text))
def brute_spread(text): return "\n".join(str(max(x) - min(x)) for x in _static_queries(text))


def brute_inversions(text):
    d = read_ints(text); n = d[0]; a = d[1:1 + n]
    return str(sum(1 for i in range(n) for j in range(i + 1, n) if a[i] > a[j]))


def brute_bits(text):
    d = read_ints(text); total = 0
    for x in d[1:1 + d[0]]:
        while x:
            total += x & 1; x >>= 1
    return str(total)


def brute_lonely(text):
    from collections import Counter
    d = read_ints(text); c = Counter(d[1:1 + d[0]])
    return str(next(v for v, k in c.items() if k % 2 == 1))


def brute_subset_xor(text):
    from functools import reduce
    d = read_ints(text); n, k = d[0], d[1]; a = d[2:2 + n]
    return str(sum(1 for r in range(n + 1) for comb in itertools.combinations(a, r) if reduce(lambda x, y: x ^ y, comb, 0) == k))


def brute_kmp(text):
    lines = text.split("\n"); t, p = lines[0].strip(), lines[1].strip()
    return str(sum(1 for i in range(len(t) - len(p) + 1) if t[i:i + len(p)] == p))


def brute_period(text):
    s_ = text.strip(); n = len(s_)
    return str(next(p for p in range(1, n + 1) if n % p == 0 and s_[:p] * (n // p) == s_))


def brute_prefix(text):
    tok = text.split(); n, q = int(tok[0]), int(tok[1])
    words, queries = tok[2:2 + n], tok[2 + n:2 + n + q]
    return "\n".join(str(sum(w.startswith(x) for w in words)) for x in queries)


def brute_inverse(text):
    a, m = read_ints(text)[:2]
    return str(next((x for x in range(m) if a * x % m == 1 % m), -1))


def brute_ncr(text):
    from math import comb
    d = read_ints(text); q = d[0]
    return "\n".join(str(comb(d[1 + 2 * i], d[2 + 2 * i]) % MOD if d[2 + 2 * i] <= d[1 + 2 * i] else 0) for i in range(q))


def brute_grid(text):
    R, C, a, b = read_ints(text)[:4]
    def count(r1, c1, r2, c2):
        if r2 < r1 or c2 < c1: return 0
        dp = [[0] * (c2 - c1 + 1) for _ in range(r2 - r1 + 1)]
        for i in range(len(dp)):
            for j in range(len(dp[0])):
                dp[i][j] = 1 if i == 0 and j == 0 else (dp[i - 1][j] if i else 0) + (dp[i][j - 1] if j else 0)
        return dp[-1][-1]
    return str(count(1, 1, a, b) * count(a, b, R, C) % MOD)


def brute_coprime(text):
    from math import gcd
    n, m = read_ints(text)[:2]
    return str(sum(1 for k in range(1, n + 1) if gcd(k, m) == 1))


def brute_assign(text):
    d = read_ints(text); n = d[0]
    cost = [d[1 + i * n: 1 + (i + 1) * n] for i in range(n)]
    return str(min(sum(cost[i][p[i]] for i in range(n)) for p in itertools.permutations(range(n))))


def brute_tour(text):
    d = read_ints(text); n = d[0]
    dist = [d[1 + i * n: 1 + (i + 1) * n] for i in range(n)]
    if n == 1: return "0"
    return str(min(dist[0][p[0]] + sum(dist[p[i]][p[i + 1]] for i in range(n - 2)) + dist[p[-1]][0] for p in itertools.permutations(range(1, n))))


def brute_digit_sum(text):
    N, S = read_ints(text)[:2]
    return str(sum(1 for k in range(1, N + 1) if sum(map(int, str(k))) == S))


def brute_tree_mis(text):
    d = read_ints(text); n = d[0]
    w = d[1:1 + n]; edges = [(d[1 + n + 2 * i] - 1, d[2 + n + 2 * i] - 1) for i in range(n - 1)]
    best = 0
    for mask in range(1 << n):
        if all(not (mask >> a & 1 and mask >> b & 1) for a, b in edges):
            best = max(best, sum(w[i] for i in range(n) if mask >> i & 1))
    return str(best)


def brute_adjacent(text):
    N = read_ints(text)[0]
    return str(sum(1 for k in range(1, N + 1) if all(a != b for a, b in zip(str(k), str(k)[1:]))))


BRUTE = {"cheapest-route": brute_cheapest, "negative-cycle-check": brute_negcycle, "cable-network": brute_mst,
         "extra-cables": brute_extra, "knapsack-value": brute_knapsack, "coin-combinations": brute_coins,
         "longest-increasing-subsequence": brute_lis,
         "range-sum-updates": brute_range_sum_updates, "inversion-count": brute_inversions, "range-minimum-static": brute_range_min_static,
         "range-spread": brute_spread, "range-min-update": brute_range_min_update, "range-add-range-sum": brute_range_add_sum,
         "bit-count-total": brute_bits, "lonely-number": brute_lonely, "subset-xor-count": brute_subset_xor,
         "kmp-occurrences": brute_kmp, "shortest-period": brute_period, "prefix-count": brute_prefix,
         "modular-inverse": brute_inverse, "ncr-queries": brute_ncr, "grid-paths-modulo": brute_grid, "coprime-count": brute_coprime,
         "min-assignment": brute_assign, "shortest-tour": brute_tour, "digit-sum-count": brute_digit_sum,
         "tree-independent-set": brute_tree_mis, "no-adjacent-equal-digits": brute_adjacent}

# ---------------------------------------------------------------- older original problems (first lessons): references + brute force
def range_sum_queries(text):
    v = read_ints(text)
    n, q = v[0], v[1]
    P = [0]
    for x in v[2:2 + n]:
        P.append(P[-1] + x)               # prefix sums: range sum = P[r] - P[l - 1]
    base = 2 + n
    return "\n".join(str(P[v[base + 2 * i + 1]] - P[v[base + 2 * i] - 1]) for i in range(q))


def pair_with_target_sum(text):
    v = read_ints(text)
    n, T = v[0], v[1]
    a = v[2:2 + n]
    i, j = 0, n - 1                       # two pointers on a sorted array
    while i < j:
        s = a[i] + a[j]
        if s == T:
            return "YES"
        if s < T:
            i += 1
        else:
            j -= 1
    return "NO"


def first_position_at_least_x(text):
    import bisect
    v = read_ints(text)
    n, q = v[0], v[1]
    a = v[2:2 + n]
    return "\n".join(str(bisect.bisect_left(a, x) + 1) for x in v[2 + n:2 + n + q])


def longest_window_under_budget(text):
    v = read_ints(text)
    n, S = v[0], v[1]
    a = v[2:2 + n]
    best = lo = total = 0                 # positive numbers: a sliding window with a shrinking left end
    for hi in range(n):
        total += a[hi]
        while total > S:
            total -= a[lo]
            lo += 1
        best = max(best, hi - lo + 1)
    return str(best)


def balanced_brackets(text):
    s = text.strip()
    match = {")": "(", "]": "[", "}": "{"}
    stack = []
    for ch in s:
        if ch in "([{":
            stack.append(ch)
        elif not stack or stack[-1] != match[ch]:
            return "NO"
        else:
            stack.pop()
    return "NO" if stack else "YES"


def count_islands(text):
    tokens = text.split()
    R, C = int(tokens[0]), int(tokens[1])
    grid = tokens[2:2 + R]
    seen = [[False] * C for _ in range(R)]
    count = 0
    for r in range(R):
        for c in range(C):
            if grid[r][c] == "#" and not seen[r][c]:
                count += 1
                seen[r][c] = True
                stack = [(r, c)]
                while stack:                  # flood fill the whole island
                    y, x = stack.pop()
                    for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                        ny, nx = y + dy, x + dx
                        if 0 <= ny < R and 0 <= nx < C and grid[ny][nx] == "#" and not seen[ny][nx]:
                            seen[ny][nx] = True
                            stack.append((ny, nx))
    return str(count)


def stair_ways(text):
    n = int(text.split()[0])
    a, b = 1, 1                           # ways(0) = 1, ways(1) = 1, ways(k) = ways(k-1) + ways(k-2)
    for _ in range(n):
        a, b = b, (a + b) % MOD
    return str(a)


# ---- independent brute-force methods
def brute_range_sum(text):
    v = read_ints(text)
    n, q = v[0], v[1]
    a = v[2:2 + n]
    base = 2 + n
    return "\n".join(str(sum(a[v[base + 2 * i] - 1:v[base + 2 * i + 1]])) for i in range(q))


def brute_pair(text):
    v = read_ints(text)
    n, T = v[0], v[1]
    a = v[2:2 + n]
    return "YES" if any(a[i] + a[j] == T for i in range(n) for j in range(i + 1, n)) else "NO"


def brute_first_pos(text):
    v = read_ints(text)
    n, q = v[0], v[1]
    a = v[2:2 + n]
    out = []
    for x in v[2 + n:2 + n + q]:
        out.append(str(next((i + 1 for i in range(n) if a[i] >= x), n + 1)))
    return "\n".join(out)


def brute_window(text):
    v = read_ints(text)
    n, S = v[0], v[1]
    a = v[2:2 + n]
    best = 0
    for i in range(n):
        for j in range(i, n):
            if sum(a[i:j + 1]) <= S:
                best = max(best, j - i + 1)
    return str(best)


def brute_brackets(text):
    s = text.strip()
    while True:                            # delete adjacent matched pairs until nothing changes
        t = s.replace("()", "").replace("[]", "").replace("{}", "")
        if t == s:
            break
        s = t
    return "YES" if s == "" else "NO"


def brute_islands(text):
    tokens = text.split()
    R, C = int(tokens[0]), int(tokens[1])
    grid = tokens[2:2 + R]
    cells = [(r, c) for r in range(R) for c in range(C) if grid[r][c] == "#"]
    parent = {p: p for p in cells}        # union-find over land cells
    def find(x):
        while parent[x] != x:
            x = parent[x]
        return x
    for (r, c) in cells:
        for nb in ((r + 1, c), (r, c + 1)):
            if nb in parent:
                ra, rb = find((r, c)), find(nb)
                if ra != rb:
                    parent[ra] = rb
    return str(len({find(p) for p in cells}))


def brute_stairs(text):
    from math import comb
    n = int(text.split()[0])
    total = 0
    for twos in range(n // 2 + 1):         # choose how many 2-steps; the rest are 1-steps, in any order
        ones = n - 2 * twos
        total += comb(ones + twos, twos)
    return str(total % MOD)


OLD_SLUGS = ["range-sum-queries", "pair-with-target-sum", "first-position-at-least-x", "longest-window-under-budget",
             "balanced-brackets", "count-islands", "stair-ways"]
SOLVERS_OLD = {"range-sum-queries": range_sum_queries, "pair-with-target-sum": pair_with_target_sum,
               "first-position-at-least-x": first_position_at_least_x, "longest-window-under-budget": longest_window_under_budget,
               "balanced-brackets": balanced_brackets, "count-islands": count_islands, "stair-ways": stair_ways}
BRUTE_OLD = {"range-sum-queries": brute_range_sum, "pair-with-target-sum": brute_pair,
             "first-position-at-least-x": brute_first_pos, "longest-window-under-budget": brute_window,
             "balanced-brackets": brute_brackets, "count-islands": brute_islands, "stair-ways": brute_stairs}


def random_old(slug, rng):
    if slug == "range-sum-queries":
        n, q = rng.randint(1, 6), rng.randint(1, 4)
        rows = [f"{n} {q}", " ".join(str(rng.randint(-5, 5)) for _ in range(n))]
        for _ in range(q):
            l = rng.randint(1, n); r = rng.randint(l, n); rows.append(f"{l} {r}")
        return "\n".join(rows)
    if slug == "pair-with-target-sum":
        n = rng.randint(2, 6)
        return f"{n} {rng.randint(-10, 10)}\n" + " ".join(map(str, sorted(rng.randint(-5, 5) for _ in range(n))))
    if slug == "first-position-at-least-x":
        n, q = rng.randint(1, 6), rng.randint(1, 4)
        return f"{n} {q}\n" + " ".join(map(str, sorted(rng.randint(-5, 5) for _ in range(n)))) + "\n" + " ".join(str(rng.randint(-6, 6)) for _ in range(q))
    if slug == "longest-window-under-budget":
        n = rng.randint(1, 7)
        return f"{n} {rng.randint(1, 15)}\n" + " ".join(str(rng.randint(1, 6)) for _ in range(n))
    if slug == "balanced-brackets":
        def gen(depth):
            if depth == 0 or rng.random() < 0.3:
                return ""
            o, c = rng.choice([("(", ")"), ("[", "]"), ("{", "}")])
            return o + gen(depth - 1) + c + gen(depth - 1)
        if rng.random() < 0.5:
            return gen(3)[:8] or "()"
        return "".join(rng.choice("()[]{}") for _ in range(rng.randint(1, 8)))
    if slug == "count-islands":
        R, C = rng.randint(1, 5), rng.randint(1, 5)
        return f"{R} {C}\n" + "\n".join("".join("#" if rng.random() < 0.4 else "." for _ in range(C)) for _ in range(R))
    if slug == "stair-ways":
        return str(rng.randint(1, 40))
    raise KeyError(slug)


SOLVERS.update(SOLVERS_OLD)
BRUTE.update(BRUTE_OLD)
SOLVERS.update(SOLVERS_GEOMETRY)
BRUTE.update(BRUTE_GEOMETRY)


# ---------------------------------------------------------------- input builders
def graph_text(n, edges, extra_header=""):
    return f"{n} {len(edges)}\n" + "\n".join(" ".join(map(str, e)) for e in edges)


def rnd_weighted(rng, n, m, lo, hi, directed=False):
    return [(rng.randint(1, n), rng.randint(1, n), rng.randint(lo, hi)) for _ in range(m)]


def random_cases(slug, rng):
    if slug in OLD_SLUGS:
        return random_old(slug, rng)
    if slug in GEOMETRY_SLUGS:
        return random_geometry(slug, rng)
    if slug in ("cheapest-route", "cable-network"):
        n = rng.randint(2, 6); m = rng.randint(0, 9)
        if slug == "cable-network":
            m = rng.randint(max(0, n - 2), 9)
        return graph_text(n, rnd_weighted(rng, n, m, 1, 12))
    if slug == "negative-cycle-check":
        n = rng.randint(1, 5); m = rng.randint(0, 8)
        return graph_text(n, rnd_weighted(rng, n, m, -6, 8))
    if slug == "extra-cables":
        n = rng.randint(1, 6); m = rng.randint(0, 7)
        return f"{n} {m}\n" + "\n".join(f"{rng.randint(1, n)} {rng.randint(1, n)}" for _ in range(m))
    if slug == "knapsack-value":
        n = rng.randint(1, 8); cap = rng.randint(0, 15)
        return f"{n} {cap}\n" + "\n".join(f"{rng.randint(1, 9)} {rng.randint(1, 20)}" for _ in range(n))
    if slug == "coin-combinations":
        n = rng.randint(1, 4); coins = rng.sample(range(1, 9), n)
        return f"{n} {rng.randint(0, 14)}\n{' '.join(map(str, coins))}"
    if slug == "longest-increasing-subsequence":
        n = rng.randint(1, 10)
        return f"{n}\n{' '.join(str(rng.randint(-5, 9)) for _ in range(n))}"
    if slug in ("range-sum-updates", "range-min-update"):
        n = rng.randint(1, 9); q = rng.randint(1, 9)
        ops = [f"1 {rng.randint(1, n)} {rng.randint(-9, 9)}" if rng.random() < 0.4 else f"2 {(l := rng.randint(1, n))} {rng.randint(l, n)}" for _ in range(q - 1)]
        ops.append(f"2 {(l := rng.randint(1, n))} {rng.randint(l, n)}")
        return f"{n} {q}\n{' '.join(str(rng.randint(-9, 9)) for _ in range(n))}\n" + "\n".join(ops)
    if slug == "range-add-range-sum":
        n = rng.randint(1, 9); q = rng.randint(1, 10)
        ops = []
        for _ in range(q - 1):
            l = rng.randint(1, n); r = rng.randint(l, n)
            ops.append(f"1 {l} {r} {rng.randint(-5, 5)}" if rng.random() < 0.5 else f"2 {l} {r}")
        l = rng.randint(1, n); ops.append(f"2 {l} {rng.randint(l, n)}")
        return f"{n} {q}\n{' '.join(str(rng.randint(-9, 9)) for _ in range(n))}\n" + "\n".join(ops)
    if slug in ("range-minimum-static", "range-spread"):
        n = rng.randint(1, 12); q = rng.randint(1, 8)
        qs = [(l := rng.randint(1, n), rng.randint(l, n)) for _ in range(q)]
        return f"{n} {q}\n{' '.join(str(rng.randint(-20, 20)) for _ in range(n))}\n" + "\n".join(f"{a} {b}" for a, b in qs)
    if slug == "inversion-count":
        n = rng.randint(1, 10)
        return f"{n}\n{' '.join(str(rng.randint(-5, 9)) for _ in range(n))}"
    if slug == "bit-count-total":
        n = rng.randint(1, 6)
        return f"{n}\n" + " ".join(str(rng.randrange(1 << rng.randint(1, 20))) for _ in range(n))
    if slug == "lonely-number":
        pairs = rng.randint(0, 4); vals = rng.sample(range(-9, 10), pairs + 1)
        arr = [v for v in vals[:pairs] for _ in range(2)] + [vals[pairs]]; rng.shuffle(arr)
        return f"{len(arr)}\n" + " ".join(map(str, arr))
    if slug == "subset-xor-count":
        n = rng.randint(1, 8)
        return f"{n} {rng.randint(0, 15)}\n" + " ".join(str(rng.randint(0, 15)) for _ in range(n))
    if slug == "kmp-occurrences":
        return "".join(rng.choice("ab") for _ in range(rng.randint(1, 14))) + "\n" + "".join(rng.choice("ab") for _ in range(rng.randint(1, 4)))
    if slug == "shortest-period":
        unit = "".join(rng.choice("ab") for _ in range(rng.randint(1, 4))); t = unit * rng.randint(1, 4)
        if rng.random() < 0.3: t += rng.choice("ab")
        return t
    if slug == "prefix-count":
        words = ["".join(rng.choice("ab") for _ in range(rng.randint(1, 4))) for _ in range(rng.randint(1, 6))]
        qs = ["".join(rng.choice("ab") for _ in range(rng.randint(1, 3))) for _ in range(rng.randint(1, 5))]
        return f"{len(words)} {len(qs)}\n{' '.join(words)}\n{' '.join(qs)}"
    if slug == "modular-inverse":
        return f"{rng.randint(1, 40)} {rng.randint(1, 30)}"
    if slug == "ncr-queries":
        q = rng.randint(1, 6)
        return f"{q}\n" + "\n".join(f"{rng.randint(0, 12)} {rng.randint(0, 14)}" for _ in range(q))
    if slug == "grid-paths-modulo":
        R, C = rng.randint(1, 6), rng.randint(1, 6)
        return f"{R} {C} {rng.randint(1, R)} {rng.randint(1, C)}"
    if slug == "coprime-count":
        return f"{rng.randint(1, 60)} {rng.randint(1, 40)}"
    if slug == "min-assignment":
        n = rng.randint(1, 6)
        return f"{n}\n" + "\n".join(" ".join(str(rng.randint(1, 20)) for _ in range(n)) for _ in range(n))
    if slug == "shortest-tour":
        n = rng.randint(1, 6)
        return f"{n}\n" + "\n".join(" ".join("0" if i == j else str(rng.randint(1, 20)) for j in range(n)) for i in range(n))
    if slug == "digit-sum-count":
        return f"{rng.randint(1, 3000)} {rng.randint(0, 30)}"
    if slug == "tree-independent-set":
        n = rng.randint(1, 9); edges = [(rng.randrange(1, i + 1), i + 1) for i in range(1, n)]
        return f"{n}\n{' '.join(str(rng.randint(1, 9)) for _ in range(n))}" + "".join(f"\n{a} {b}" for a, b in edges)
    if slug == "no-adjacent-equal-digits":
        return f"{rng.randint(1, 3000)}"
    raise KeyError(slug)


def rng_op(rng, n):
    if rng.random() < 0.5:
        return f"1 {rng.randint(1, n)} {rng.randint(-20, 20)}"
    l = rng.randint(1, n)
    return f"2 {l} {rng.randint(l, n)}"


def rng_range_op(rng, n):
    l = rng.randint(1, n); r = rng.randint(l, n)
    return f"1 {l} {r} {rng.randint(-5, 5)}" if rng.random() < 0.5 else f"2 {l} {r}"


def hidden_inputs(rng):
    out = {}
    out["cheapest-route"] = [
        "2 0\n",
        "2 1\n1 2 5",
        "3 3\n1 2 1000000000\n2 3 1000000000\n1 3 2000000001",
        "4 2\n1 2 3\n3 4 3",
        "6 8\n1 2 7\n1 3 9\n1 6 14\n2 3 10\n2 4 15\n3 4 11\n3 6 2\n4 5 6",
        graph_text(9, rnd_weighted(rng, 9, 14, 1, 20)),
        graph_text(10, [(i, i + 1, rng.randint(1, 9)) for i in range(1, 10)] + [(1, 10, 100), (1, 10, 40)]),
    ]
    out["negative-cycle-check"] = [
        "1 0\n",
        "3 3\n1 2 4\n2 3 -6\n3 1 1",
        "3 2\n1 2 -5\n2 3 -5",
        "4 4\n1 2 1\n3 4 -3\n4 3 1\n2 1 1",
        "3 3\n1 2 0\n2 3 0\n3 1 0",
        "2 2\n1 2 -1\n2 1 1",
        graph_text(6, rnd_weighted(rng, 6, 10, -4, 9)),
    ]
    out["cable-network"] = [
        "1 0\n",
        "3 1\n1 2 4",
        "4 5\n1 2 1\n2 3 4\n3 4 2\n1 3 3\n1 4 10",
        "3 4\n1 2 5\n1 2 2\n2 3 7\n3 3 1",
        "6 9\n1 2 7\n1 3 9\n1 6 14\n2 3 10\n2 4 15\n3 4 11\n3 6 2\n4 5 6\n5 6 9",
        graph_text(8, rnd_weighted(rng, 8, 14, 1, 30)),
        "5 3\n1 2 1000000000\n2 3 1000000000\n3 4 1000000000",
    ]
    out["extra-cables"] = [
        "1 0\n",
        "3 3\n1 1\n1 2\n1 2",
        "5 5\n1 2\n2 3\n3 1\n4 5\n1 2",
        "6 3\n1 2\n2 3\n4 5",
        "4 6\n1 2\n2 3\n3 4\n4 1\n1 3\n2 4",
        "7 9\n" + "\n".join(f"{rng.randint(1, 7)} {rng.randint(1, 7)}" for _ in range(9)),
    ]
    out["knapsack-value"] = [
        "1 4\n5 10",
        "3 10\n2 3\n3 4\n5 8",
        "4 7\n1 1\n3 4\n4 5\n5 7",
        "3 0\n1 5\n2 6\n3 7",
        "5 11\n6 20\n5 18\n4 15\n3 9\n2 5",
        "8 20\n" + "\n".join(f"{rng.randint(1, 9)} {rng.randint(1, 30)}" for _ in range(8)),
    ]
    out["coin-combinations"] = [
        "1 0\n7",
        "1 3\n2",
        "3 5\n1 2 5",
        "2 10\n5 10",
        "3 4\n3 5 7",
        "3 1000\n1 2 5",
        "4 100\n1 5 10 25",
    ]
    out["longest-increasing-subsequence"] = [
        "1\n7",
        "5\n3 3 3 3 3",
        "5\n5 4 3 2 1",
        "6\n1 2 3 4 5 6",
        "8\n10 9 2 5 3 7 101 18",
        "9\n1 3 2 3 1 4 5 4 6",
        "12\n" + " ".join(str(rng.randint(-20, 20)) for _ in range(12)),
    ]
    out["range-sum-updates"] = [
        "1 1\n5\n2 1 1",
        "3 4\n1000000000 1000000000 1000000000\n2 1 3\n1 2 -1000000000\n2 1 3\n2 2 2",
        "5 5\n1 2 3 4 5\n2 1 5\n1 3 10\n2 1 3\n2 3 5\n2 5 5",
        "4 6\n-3 4 -1 2\n2 1 4\n1 1 7\n2 1 2\n1 4 -9\n2 3 4\n2 1 4",
        "8 8\n" + " ".join(str(rng.randint(-9, 9)) for _ in range(8)) + "\n" + "\n".join(rng_op(rng, 8) for _ in range(8)) + "\n2 1 8",
        "6 7\n0 0 0 0 0 0\n1 3 5\n1 3 -5\n2 1 6\n1 6 8\n2 6 6\n2 4 6\n2 1 3",
    ]
    out["inversion-count"] = [
        "1\n7",
        "3\n3 3 3",
        "5\n2 4 1 3 5",
        "5\n5 4 3 2 1",
        "4\n1 1000000000 -1000000000 5",
        "10\n" + " ".join(str(rng.randint(-8, 8)) for _ in range(10)),
        "6\n1 2 3 4 5 6",
    ]
    out["range-minimum-static"] = [
        "1 1\n42\n1 1",
        "8 3\n5 2 6 1 7 3 8 4\n2 7\n1 8\n5 5",
        "5 4\n-1 -5 -3 -5 -2\n1 5\n1 1\n3 5\n2 4",
        "4 2\n1000000000 -1000000000 1000000000 -999999999\n1 4\n3 4",
        "10 6\n" + " ".join(str(rng.randint(-30, 30)) for _ in range(10)) + "\n1 10\n2 9\n3 3\n4 7\n1 2\n9 10",
        "7 3\n3 3 3 3 3 3 3\n1 7\n2 6\n4 4",
    ]
    out["range-spread"] = [
        "1 1\n9\n1 1",
        "8 3\n5 2 6 1 7 3 8 4\n2 7\n1 8\n5 5",
        "5 3\n4 4 4 4 4\n1 5\n2 3\n5 5",
        "4 2\n1000000000 -1000000000 1000000000 -1000000000\n1 4\n2 3",
        "9 6\n" + " ".join(str(rng.randint(-25, 25)) for _ in range(9)) + "\n1 9\n2 8\n3 3\n4 6\n1 2\n8 9",
    ]
    out["range-min-update"] = [
        "1 2\n5\n1 1 -3\n2 1 1",
        "5 5\n4 2 7 1 9\n2 1 5\n1 4 8\n2 1 5\n2 3 5\n2 4 4",
        "3 5\n9 9 9\n2 1 3\n1 2 1\n2 1 3\n1 2 9\n2 1 3",
        "6 6\n-5 3 8 -2 0 7\n2 1 6\n1 1 100\n2 1 6\n1 4 50\n2 3 5\n2 2 4",
        "8 8\n" + " ".join(str(rng.randint(-20, 20)) for _ in range(8)) + "\n" + "\n".join(rng_op(rng, 8) for _ in range(7)) + "\n2 1 8",
    ]
    out["range-add-range-sum"] = [
        "1 3\n5\n2 1 1\n1 1 1 4\n2 1 1",
        "5 4\n1 2 3 4 5\n2 1 5\n1 2 4 10\n2 1 5\n2 3 3",
        "4 5\n0 0 0 0\n1 1 4 1\n1 2 3 1000000000\n2 1 4\n2 2 3\n2 1 1",
        "6 6\n3 -2 5 0 -7 4\n1 1 3 -4\n2 2 5\n1 4 6 6\n2 1 6\n1 1 6 -1\n2 3 4",
        "8 10\n" + " ".join(str(rng.randint(-9, 9)) for _ in range(8)) + "\n" + "\n".join(rng_range_op(rng, 8) for _ in range(9)) + "\n2 1 8",
    ]
    out["bit-count-total"] = [
        "1\n0",
        "3\n1 2 3",
        "4\n255 256 1023 1024",
        "2\n1000000000000000000 1000000000000000000",
        "1\n1152921504606846975",
        "6\n" + " ".join(str(rng.randrange(1 << 40)) for _ in range(6)),
    ]
    out["lonely-number"] = [
        "1\n7",
        "3\n-3 5 5",
        "5\n4 1 2 1 2",
        "7\n1000000000 9 9 -1000000000 -1000000000 7 7",
        "9\n" + " ".join(map(str, (lambda v: (lambda a: (rng.shuffle(a), a)[1])([x for x in v[:4] for _ in range(2)] + [v[4]]))(rng.sample(range(-50, 50), 5)))),
        "5\n0 0 0 0 6",
    ]
    out["subset-xor-count"] = [
        "1 0\n5",
        "3 0\n1 1 1",
        "4 7\n1 2 4 8",
        "5 3\n1 2 3 1 2",
        "12 6\n" + " ".join(str(rng.randint(0, 7)) for _ in range(12)),
        "6 100\n1 2 3 4 5 6",
        "10 0\n" + " ".join(str(rng.randint(0, 3)) for _ in range(10)),
    ]
    out["kmp-occurrences"] = [
        "a\na",
        "aaaaa\naa",
        "abcabcabd\nabcabd",
        "abc\nabcd",
        "abababab\nabab",
        "mississippi\nissi",
        "zzzz\nzzzzzz",
        "abcdefgh\nxyz",
    ]
    out["shortest-period"] = [
        "a",
        "abab",
        "abcabcabc",
        "abcabcab",
        "aaaaaa",
        "abcd",
        "xyxyxyxyxyxy",
        "aabaabaabaab",
    ]
    out["prefix-count"] = [
        "1 1\napple\napp",
        "5 4\napple app apt bat bath\nap\napp\nba\nz",
        "4 3\ndog dog dot do\ndo\ndog\ndoge",
        "3 3\na ab abc\na ab abc",
        "6 5\n" + " ".join("".join(rng.choice("abc") for _ in range(rng.randint(1, 4))) for _ in range(6)) + "\na\nab\nb\nc\nca",
    ]
    out["modular-inverse"] = [
        "3 11",
        "4 8",
        "1 1",
        "10 17",
        "999999937 1000000007",
        "6 9",
        "123456789 1000000007",
        "2 1000000000",
    ]
    out["ncr-queries"] = [
        "1\n0 0",
        "3\n5 2\n10 0\n10 10",
        "3\n3 5\n0 0\n7 8",
        "4\n100000 50000\n1000000 500000\n1000000 1\n1000000 1000000",
        "5\n" + "\n".join(f"{(n := rng.randint(0, 2000))} {rng.randint(0, n)}" for _ in range(5)),
    ]
    out["grid-paths-modulo"] = [
        "1 1 1 1",
        "3 3 2 2",
        "3 7 1 1",
        "5 5 5 5",
        "4 6 3 2",
        "1000 1000 500 500",
        "1000000 1000000 1 1",
        "6 4 6 1",
    ]
    out["coprime-count"] = [
        "1 1",
        "30 30",
        "100 12",
        "1000000000000 30030",
        "1000000000000 999999999989",
        "50 1",
        "7 7",
        "60 60",
    ]
    def matrix(n, lo, hi, diag0=False):
        return "\n".join(" ".join("0" if diag0 and i == j else str(rng.randint(lo, hi)) for j in range(n)) for i in range(n))
    out["min-assignment"] = [
        "1\n5",
        "3\n9 2 7\n6 4 3\n5 8 1",
        "3\n4 4 4\n4 4 4\n4 4 4",
        "4\n1000000 1 1000000 1000000\n1000000 1000000 1 1000000\n1000000 1000000 1000000 1\n1 1000000 1000000 1000000",
        "8\n" + matrix(8, 1, 50),
        "10\n" + matrix(10, 1, 100),
    ]
    out["shortest-tour"] = [
        "1\n0",
        "2\n0 7\n9 0",
        "4\n0 10 15 20\n10 0 35 25\n15 35 0 30\n20 25 30 0",
        "5\n0 3 1 1 1\n3 0 3 1 1\n1 3 0 3 1\n1 1 3 0 3\n1 1 1 3 0",
        "8\n" + matrix(8, 1, 40, True),
        "9\n" + matrix(9, 1, 40, True),
    ]
    out["digit-sum-count"] = [
        "1 1",
        "100 1",
        "99 0",
        "99 9",
        "1000000000000000000 1",
        "1000000000000000000 162",
        "999999999999999999 81",
        "5000 12",
    ]
    out["tree-independent-set"] = [
        "1\n5",
        "2\n3 8\n1 2",
        "5\n1 1 1 1 10\n1 2\n2 3\n3 4\n4 5",
        "7\n3 4 5 1 3 2 7\n1 2\n1 3\n2 4\n2 5\n3 6\n6 7",
        "6\n5 5 5 5 5 5\n1 2\n1 3\n1 4\n1 5\n1 6",
        "9\n" + " ".join(str(rng.randint(1, 20)) for _ in range(9)) + "".join(f"\n{rng.randrange(1, i + 1)} {i + 1}" for i in range(1, 9)),
        "1000\n" + " ".join(str(rng.randint(1, 1000000000)) for _ in range(1000)) + "".join(f"\n{i} {i + 1}" for i in range(1, 1000)),
    ]
    out["no-adjacent-equal-digits"] = [
        "1",
        "9",
        "10",
        "11",
        "100",
        "1000",
        "123456",
        "1000000000000000000",
        "123456789012345678",
    ]
    # ---- geometry: explicit edge cases first, then seeded random inputs (appended, so earlier problems keep their streams)
    def big_star(n, bound=10**9):
        while True:
            pts = []
            while len(pts) < n:
                p = (rng.randint(-bound, bound), rng.randint(-bound, bound))
                if p != (0, 0) and all(cross3((0, 0), p, q) != 0 or p[0] * q[0] + p[1] * q[1] <= 0 for q in pts):
                    pts.append(p)
            pts = angle_sort(pts)
            if all(cross3((0, 0), pts[i], pts[(i + 1) % n]) > 0 for i in range(n)):
                return pts
    out["orientation-test"] = [
        "1\n-1000000000 -1000000000 1000000000 1000000000 0 1",
        "3\n0 0 4 0 2 1\n0 0 4 0 2 0\n0 0 4 0 2 -1",
        "2\n5 5 9 5 5 9\n0 0 -3 -3 9 9",
        "1\n3 3 1 1 -1 -1",
    ] + [random_geometry("orientation-test", rng) for _ in range(3)]
    out["polygon-double-area"] = [
        "4\n-1000000000 -1000000000\n1000000000 -1000000000\n1000000000 1000000000\n-1000000000 1000000000",
        "6\n0 0\n2 0\n2 1\n1 1\n1 2\n0 2",
        "3\n0 0\n0 3\n4 0",
        polygon_text(big_star(60)),
    ] + [random_geometry("polygon-double-area", rng) for _ in range(3)]
    out["hull-corners"] = [
        "1\n5 5",
        "4\n0 0\n4 0\n4 4\n0 4",
        "4\n0 0\n1 1\n2 2\n3 3",
        "5\n2 2\n2 2\n0 0\n0 0\n3 1",
        "3\n1000000000 0\n0 1000000000\n-1000000000 -1000000000",
        "120\n" + "\n".join(f"{rng.randint(-10**9, 10**9)} {rng.randint(-10**9, 10**9)}" for _ in range(120)),
    ] + [random_geometry("hull-corners", rng) for _ in range(2)]
    out["segment-touch"] = [
        "2\n0 0 4 4\n0 4 4 0",
        "2\n0 0 1 0\n2 0 3 0",
        "3\n0 0 2 0\n1 0 3 0\n5 5 6 6",
        "2\n0 0 1 1\n1 1 2 0",
        "2\n0 0 1 0\n0 1 1 1",
        "150\n" + "\n".join(" ".join(str(rng.randint(-10**9, 10**9)) for _ in range(4)) for _ in range(150)),
    ] + [random_geometry("segment-touch", rng) for _ in range(2)]
    out["interior-lattice-points"] = [
        "4\n-1000000000 -1000000000\n1000000000 -1000000000\n1000000000 1000000000\n-1000000000 1000000000",
        "4\n0 0\n4 0\n4 4\n0 4",
        "3\n0 0\n4 0\n0 3",
        polygon_text(big_star(60)),
    ] + [random_geometry("interior-lattice-points", rng) for _ in range(3)]
    return out


def cmd_generate():
    rng = random.Random(20260930)
    for slug in SOLVERS:
        for _ in range(400):
            t = random_cases(slug, rng)
            a, b = SOLVERS[slug](t), BRUTE[slug](t)
            assert a == b, f"{slug}: reference {a} != brute force {b} on input:\n{t}"
        print(f"// cross-checked {slug}: 400 random cases agree with an independent brute force", file=sys.stderr)
    tests = hidden_inputs(random.Random(77))
    lines = []
    for slug, inputs in tests.items():
        lines.append(f"  {json.dumps(slug)}: [")
        for t in inputs:
            t = t.rstrip("\n")
            lines.append(f"    {{ input: {json.dumps(t)}, expected: {json.dumps(SOLVERS[slug](t))} }},")
        lines.append("  ],")
    print("\n".join(lines))


if __name__ == "__main__":
    if len(sys.argv) >= 3 and sys.argv[1] == "solve":
        print(SOLVERS[sys.argv[2]](sys.stdin.read()))
    elif len(sys.argv) >= 2 and sys.argv[1] == "generate":
        cmd_generate()
    else:
        print(__doc__); sys.exit(1)

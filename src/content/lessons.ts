export type LessonBlock = { heading: string; text: string; code?: string };
export type Lesson = { blocks: LessonBlock[] };

// Original lesson text (not copied from the A2SV slides). Python-first.
import { MORE } from "./lessons-more";

const BASE: Record<string, Lesson> = {
  "prefix-sum": { blocks: [
    { heading: "The problem", text: "You have an array and many questions of the form: what is the sum of elements from index l to r? Recomputing each sum costs O(n) per query, which is too slow when there are many queries." },
    { heading: "Idea", text: "Precompute running totals once. If P[i] is the sum of the first i elements (with P[0] = 0), then the sum of a[l..r] is P[r+1] - P[l]. Preprocessing is O(n); each query is O(1); memory is O(n)." },
    { heading: "Example", text: "For a = [2, 4, 1, 5, 3] the prefix array is P = [0, 2, 6, 7, 12, 15]. The sum of a[1..3] = 4 + 1 + 5 = 10 equals P[4] - P[1] = 12 - 2.",
      code: "def build(a):\n    p = [0]\n    for x in a:\n        p.append(p[-1] + x)\n    return p\n\ndef range_sum(p, l, r):  # inclusive l..r\n    return p[r + 1] - p[l]" },
    { heading: "Common mistakes", text: "Off-by-one errors are the main risk. Using a leading 0 in P avoids a special case for l = 0. Also watch for integer overflow in languages with fixed-size integers (not an issue in Python)." },
    { heading: "Recognize it", text: "Reach for prefix sums when you see repeated range-sum queries on data that does not change, or when a condition can be rewritten as a difference of two running totals." },
  ]},
  "binary-search": { blocks: [
    { heading: "The problem", text: "Finding a value in a sorted array by scanning is O(n). If the data is sorted, you can discard half of the remaining range at every step, giving O(log n)." },
    { heading: "Lower bound", text: "The most useful form finds the first index whose value is >= target. Keep the invariant that the answer lies in [lo, hi].",
      code: "def lower_bound(a, target):\n    lo, hi = 0, len(a)\n    while lo < hi:\n        mid = (lo + hi) // 2\n        if a[mid] < target:\n            lo = mid + 1\n        else:\n            hi = mid\n    return lo  # len(a) if every element is smaller" },
    { heading: "Binary search on the answer", text: "The same idea works on any monotonic yes/no question: if 'is x big enough?' is false up to some point and true afterwards, search for that boundary directly, even when there is no array.",
      code: "def first_true(lo, hi, ok):\n    # smallest x in [lo, hi] with ok(x) True; ok must be monotonic\n    while lo < hi:\n        mid = (lo + hi) // 2\n        if ok(mid):\n            hi = mid\n        else:\n            lo = mid + 1\n    return lo" },
    { heading: "Common mistakes", text: "Infinite loops from moving lo or hi to mid instead of mid + 1 or mid; forgetting that the data must be sorted (or the predicate monotonic); mixing inclusive and exclusive bounds." },
  ]},
  "two-pointers": { blocks: [
    { heading: "The problem", text: "Many array problems ask about pairs or subarrays. Checking every pair is O(n^2). When the array is sorted or the property is monotonic, two indices moving in one direction can cover the search in O(n)." },
    { heading: "Example: pair with a target sum", text: "In a sorted array, put one pointer at each end. If the sum is too small, move the left pointer right; if too large, move the right pointer left.",
      code: "def pair_with_sum(a, target):\n    i, j = 0, len(a) - 1\n    while i < j:\n        s = a[i] + a[j]\n        if s == target:\n            return i, j\n        if s < target:\n            i += 1\n        else:\n            j -= 1\n    return None" },
    { heading: "Why it is correct", text: "When the sum is too small, a[i] cannot pair with anything at or left of j, so it can be discarded safely. Each step removes one candidate, so there are at most n steps." },
    { heading: "Recognize it", text: "Sorted input, pair or triplet conditions, merging two sorted sequences, or a window whose validity changes monotonically as it grows." },
  ]},
};

// Static lessons; an admin-edited lesson in the database takes precedence at render time.
export const LESSONS: Record<string, Lesson> = { ...MORE, ...BASE };

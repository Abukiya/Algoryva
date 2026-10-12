import { describe, expect, it } from "vitest";
import { binarySearchSteps, bubbleSortSteps, pairSumSteps, slidingWindowSteps } from "./steps";

describe("visualization steps", () => {
  it("binary search finds present values and reports absent ones", () => {
    const a = [1, 3, 5, 7, 9, 11];
    expect(binarySearchSteps(a, 7).at(-1)!.note).toContain("Found at index 3");
    expect(binarySearchSteps(a, 4).at(-1)!.note).toContain("not in the array");
  });
  it("bubble sort ends sorted without mutating earlier frames", () => {
    const f = bubbleSortSteps([3, 1, 2]);
    expect(f.at(-1)!.values).toEqual([1, 2, 3]);
    expect(f[0].values).toEqual([3, 1, 2]);
  });
  it("two pointers finds the pair or gives up", () => {
    expect(pairSumSteps([1, 2, 4, 7, 11, 15], 13).at(-1)!.note).toContain("Pair found");
    expect(pairSumSteps([1, 2, 3], 100).at(-1)!.note).toContain("No pair");
  });
  it("sliding window tracks the best sum", () => {
    expect(slidingWindowSteps([2, 1, 5, 1, 3, 2], 3).at(-1)!.note).toContain("Best = 9");
  });
});

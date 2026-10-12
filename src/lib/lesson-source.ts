/** Which lesson learners see for a topic. A published admin lesson wins over the built-in text, whatever its kind. */
export type LessonSource = "custom-live" | "custom-draft" | "full" | "outline" | "none";

/** Every value of the Prisma ContentStatus enum that a custom lesson row can hold. Only PUBLISHED is shown to learners. */
export type CustomLessonStatus = "DRAFT" | "PUBLISHED" | "COMING_SOON";

export function lessonSource(o: { customStatus: CustomLessonStatus | null; hasFull: boolean; hasOutline: boolean }): LessonSource {
  // COMING_SOON is not live either, so learners keep seeing the built-in lesson (matches the learner query, which filters on PUBLISHED).
  if (o.customStatus === "PUBLISHED") return "custom-live";
  if (o.customStatus === "DRAFT") return "custom-draft";
  if (o.hasFull) return "full";
  if (o.hasOutline) return "outline";
  return "none";
}

/** Exact-match grading only (trims trailing whitespace per line). No code execution: the user pastes expected output for now. */
export function gradeOutput(expected: string, actual: string): boolean {
  const norm = (s: string) => s.replace(/\r\n/g, "\n").split("\n").map((l) => l.replace(/\s+$/, "")).join("\n").replace(/\n+$/, "");
  return norm(expected) === norm(actual);
}

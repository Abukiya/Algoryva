import { toggleSolved } from "@/app/problems/actions";
import { Icon } from "@/components/Icon";

/**
 * The solved mark on a problem row. External problems get a real checkbox that submits toggleSolved, which works without JavaScript.
 * Internal problems are read-only here: only the judge can mark them solved, so a click would have nothing to do.
 * Guests see the state but cannot change it.
 */
export function SolvedCheckbox({ problemId, title, checked, external, signedIn }: { problemId: string; title: string; checked: boolean; external: boolean; signedIn: boolean }) {
  const box = `grid h-7 w-7 shrink-0 place-items-center rounded-md border-2 transition ${checked ? "border-ok bg-ok text-white" : "border-line-strong bg-surface text-transparent"}`;
  if (!signedIn || !external) {
    const why = !signedIn ? "Log in to track solved problems" : "Solved by passing every test in Check your answer";
    return (
      <span role="img" aria-label={`${checked ? "Solved" : "Not solved"}. ${why}.`} title={why} className={box}>
        <Icon name="check" size={15} strokeWidth={3} />
      </span>
    );
  }
  return (
    <form action={toggleSolved} className="shrink-0">
      <input type="hidden" name="problemId" value={problemId} />
      <button type="submit" role="checkbox" aria-checked={checked} aria-label={`Mark ${title} as ${checked ? "not solved" : "solved"}`} title={checked ? "Click to unmark" : "Click once you have solved it on the platform"} className={`${box} hover:border-brand`}>
        <Icon name="check" size={15} strokeWidth={3} />
      </button>
    </form>
  );
}

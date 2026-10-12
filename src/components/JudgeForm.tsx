"use client";
import { useActionState } from "react";
import { checkOutput } from "@/app/problems/judge-actions";
import { Icon } from "@/components/Icon";
import { SubmitButton } from "@/components/SubmitButton";
import { Callout } from "@/components/ui";
import Link from "next/link";

export type FailHelp = { title: string; slug: string; complete: boolean };

/** Answer checker. The judge compares pasted text; no user code runs on the server (unchanged behaviour). */
export function JudgeForm({ problemId, sampleCount, contestId, help = [] }: { problemId: string; sampleCount: number; contestId?: string; help?: FailHelp[] }) {
  const [state, action] = useActionState(checkOutput, undefined);
  const n = Math.max(sampleCount, 1);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="problemId" value={problemId} />
      {contestId && <input type="hidden" name="contestId" value={contestId} />}
      <Callout>Run your program on each test input yourself, then paste its output below. Test 1 is the sample; the others are hidden. This checks the text you paste and does not run your code.</Callout>
      {Array.from({ length: n }).map((_, i) => {
        const r = state?.results[i];
        return (
          <div key={i}>
            <label htmlFor={`out-${i}`} className="label flex items-center justify-between">
              <span>Output for test {i + 1}{i === 0 ? " (sample)" : " (hidden)"}</span>
              {r && <span className={`chip animate-pop ${r.pass ? "chip-ok" : "chip-bad"}`}><Icon name={r.pass ? "check" : "x"} size={12} strokeWidth={2.6} />{r.pass ? "Passed" : "Failed"}</span>}
            </label>
            <textarea id={`out-${i}`} name="output" rows={3} spellCheck={false} className={`input font-mono ${r ? (r.pass ? "border-ok/60" : "border-bad/60") : ""}`} />
          </div>
        );
      })}
      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton className="btn btn-primary" pendingLabel="Checking">Check answer</SubmitButton>
        {state && <span className="tnum text-sm font-semibold text-soft" aria-live="polite">{state.results.filter((r) => r.pass).length} of {state.results.length} tests passed</span>}
      </div>
      {state?.note && <Callout tone="warn" title={state.allPass ? "Tests matched, but nothing was recorded" : "Not checked"}>{state.note}</Callout>}
      {state && !state.note && (state.allPass
        ? <div className="animate-pop"><Callout tone="ok" title="All tests passed">This problem is marked as solved.</Callout></div>
        : (
          <Callout tone="bad" title="Not all tests passed yet">
            <p>Recheck the failing tests. Trailing spaces and blank lines are ignored; everything else must match exactly.</p>
            <p className="mt-2 font-semibold">Before you retry, check the usual suspects:</p>
            <ul className="mt-1 list-disc space-y-1 pl-5">
              <li>Does your code handle the smallest input (empty, one element)?</li>
              <li>Is an off-by-one hiding in a boundary (inclusive vs exclusive)?</li>
              <li>Did you print exactly the format asked for?</li>
              {help.map((h) => <li key={h.slug}>Review <Link className="font-bold underline" href={h.complete ? `/learn/${h.slug}#mistakes` : `/learn/${h.slug}`}>{h.title}{h.complete ? ": common mistakes" : ""}</Link>{h.complete && <>, or <Link className="font-bold underline" href={`/learn/${h.slug}#recognize`}>how to recognize the technique</Link></>}.</li>)}
            </ul>
            <p className="mt-2">Found what went wrong? <Link className="font-bold underline" href={`/mistakes?problem=${problemId}`}>Log it</Link> so your reviews can target it.</p>
          </Callout>
        ))}
    </form>
  );
}

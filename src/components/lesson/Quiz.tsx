"use client";
import { useState, useTransition } from "react";
import type { Quiz as Q } from "@/content/lesson-types";
import { Inline } from "./Inline";
import { Icon } from "@/components/Icon";
import { submitQuiz, type QuizOutcome } from "@/app/learn/actions";
import { passMark } from "@/lib/mastery";

export function Quiz({ slug, checks, loggedIn, alreadyPassed }: { slug: string; checks: Q[]; loggedIn: boolean; alreadyPassed: boolean }) {
  const [picked, setPicked] = useState<(number | null)[]>(() => checks.map(() => null));
  const [outcome, setOutcome] = useState<QuizOutcome | null>(null);
  const [pending, start] = useTransition();
  const answered = picked.filter((p) => p !== null).length;
  const score = picked.reduce<number>((n, p, i) => n + (p === checks[i].answer ? 1 : 0), 0);
  const done = answered === checks.length;
  const need = passMark(checks.length);

  const choose = (qi: number, oi: number) => { if (picked[qi] === null) setPicked((p) => p.map((x, i) => (i === qi ? oi : x))); };
  const save = () => start(async () => setOutcome(await submitQuiz(slug, picked as number[])));
  const retry = () => { setPicked(checks.map(() => null)); setOutcome(null); };

  return (
    <section id="mastery-check" aria-labelledby="mc-h" className="card card-pad">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="mc-h" className="flex items-center gap-2 text-2xl font-extrabold"><Icon name="target" className="text-brand" />Mastery check</h2>
        <span className="tnum chip">{answered} of {checks.length} answered</span>
      </div>
      <p className="mt-1 text-sm text-soft">Answer from understanding, not memory of the page. You need {need} of {checks.length}. Each answer is explained, and you can retry as often as you like.{alreadyPassed && " You have already passed this check."}</p>
      <ol className="mt-5 space-y-6">
        {checks.map((c, qi) => {
          const p = picked[qi];
          return (
            <li key={qi}>
              <fieldset>
                <legend className="font-bold"><span className="mr-2 text-muted">{qi + 1}.</span><Inline text={c.q} /></legend>
                <div className="mt-2 grid gap-2">
                  {c.options.map((o, oi) => {
                    const right = p !== null && oi === c.answer, wrong = p === oi && oi !== c.answer;
                    return (
                      <button key={oi} type="button" onClick={() => choose(qi, oi)} disabled={p !== null} aria-pressed={p === oi}
                        className={`flex items-start gap-3 rounded-ctl border px-3.5 py-2.5 text-left text-[15px] transition-colors ${right ? "border-ok bg-ok/10" : wrong ? "border-bad bg-bad/10" : "border-line-strong bg-surface hover:border-brand"} disabled:cursor-default`}>
                        <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border border-line-strong text-[11px] font-bold">{right ? <Icon name="check" size={12} strokeWidth={3} className="text-ok" /> : wrong ? "×" : String.fromCharCode(65 + oi)}</span>
                        <span className="min-w-0"><Inline text={o} /></span>
                      </button>
                    );
                  })}
                </div>
                {p !== null && <p role="status" className={`mt-2 rounded-lg px-3 py-2 text-sm ${p === c.answer ? "bg-ok/10 text-fg" : "bg-warn/10 text-fg"}`}><strong>{p === c.answer ? "Correct. " : "Not quite. "}</strong><Inline text={c.why} /></p>}
              </fieldset>
            </li>
          );
        })}
      </ol>
      {done && (
        <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-line pt-5" aria-live="polite">
          <p className="font-extrabold">{score} of {checks.length} correct{score >= need ? ". That is a pass." : `. ${need} needed to pass.`}</p>
          {!outcome && loggedIn && score >= need && <button className="btn btn-primary" onClick={save} disabled={pending}>{pending ? "Saving" : "Save my result"}</button>}
          {!outcome && loggedIn && score < need && <button className="btn btn-primary" onClick={save} disabled={pending}>{pending ? "Saving" : "Save this attempt"}</button>}
          {!loggedIn && <span className="text-sm text-soft">Log in to keep your result and count it towards mastery.</span>}
          {score < need && <button className="btn btn-secondary" onClick={retry}>Try again</button>}
          {outcome && (outcome.ok ? <span role="status" className="flex items-center gap-2 text-sm font-bold text-ok"><Icon name="check" size={16} strokeWidth={2.6} />{outcome.passed ? (outcome.firstPass ? "Passed and saved. Mastery check done." : "Saved.") : "Attempt saved."}</span> : <span role="alert" className="text-sm font-bold text-bad">{outcome.error}</span>)}
        </div>
      )}
    </section>
  );
}

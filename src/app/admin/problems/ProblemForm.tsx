"use client";
import { useActionState, useState } from "react";
import { saveProblem } from "./actions";

export type FormValues = {
  id?: string; kind: "INTERNAL" | "EXTERNAL"; title: string; difficulty: string; status: string; position: number; topics: string[];
  externalUrl: string; statement: string; inputSpec: string; outputSpec: string; constraints: string; sampleInput: string; sampleOutput: string;
};

export function ProblemForm({ initial, topics }: { initial: FormValues; topics: { slug: string; title: string }[] }) {
  const [state, action, pending] = useActionState(saveProblem, undefined);
  const [kind, setKind] = useState(initial.kind);
  const f = "input";
  const L = ({ t, children }: { t: string; children: React.ReactNode }) => <label className="block"><span className="label">{t}</span>{children}</label>;
  return (
    <form action={action} className="card card-pad max-w-3xl space-y-5">
      {initial.id && <input type="hidden" name="id" value={initial.id} />}
      <L t="Type"><select name="kind" value={kind} onChange={(e) => setKind(e.target.value as FormValues["kind"])} disabled={!!initial.id} className={f}><option value="EXTERNAL">External link</option><option value="INTERNAL">Original problem</option></select></L>
      {initial.id && <input type="hidden" name="kind" value={kind} />}
      <L t="Title"><input name="title" defaultValue={initial.title} required maxLength={120} className={f} /></L>
      <div className="grid grid-cols-3 gap-3">
        <L t="Difficulty"><select name="difficulty" defaultValue={initial.difficulty} className={f}>{["EASY", "MEDIUM", "HARD", "EXPERT"].map((d) => <option key={d}>{d}</option>)}</select></L>
        <L t="Status"><select name="status" defaultValue={initial.status} className={f}><option value="DRAFT">Draft</option><option value="PUBLISHED">Published</option></select></L>
        <L t="Position"><input name="position" type="number" min={0} max={9999} defaultValue={initial.position} className={f} /></L>
      </div>
      <fieldset><legend className="label">Topics (1-6)</legend>
        <div className="well grid gap-0.5 p-2 text-sm sm:grid-cols-2">{topics.map((t) => <label key={t.slug} className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-surface"><input className="h-4 w-4 accent-[rgb(var(--brand))]" type="checkbox" name="topics" value={t.slug} defaultChecked={initial.topics.includes(t.slug)} /> {t.title}</label>)}</div></fieldset>
      {kind === "EXTERNAL" ? (
        <L t="Problem URL (leetcode, codeforces, hackerrank, atcoder, cses)"><input name="externalUrl" defaultValue={initial.externalUrl} required className={f} /></L>
      ) : (<>
        <L t="Statement"><textarea name="statement" defaultValue={initial.statement} required rows={6} className={f} /></L>
        <L t="Input format"><textarea name="inputSpec" defaultValue={initial.inputSpec} rows={3} className={f} /></L>
        <L t="Output format"><textarea name="outputSpec" defaultValue={initial.outputSpec} rows={2} className={f} /></L>
        <L t="Constraints"><textarea name="constraints" defaultValue={initial.constraints} rows={3} className={f} /></L>
        <div className="grid grid-cols-2 gap-3">
          <L t="Sample input"><textarea name="sampleInput" defaultValue={initial.sampleInput} rows={3} className={`${f} font-mono`} /></L>
          <L t="Sample output"><textarea name="sampleOutput" defaultValue={initial.sampleOutput} rows={3} className={`${f} font-mono`} /></L>
        </div></>)}
      <p role="alert" className="field-error">{state?.error}</p>
      <button disabled={pending} className="btn btn-primary">{pending ? "Saving" : "Save problem"}</button>
    </form>
  );
}

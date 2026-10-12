"use client";
import { useActionState } from "react";
import { saveContest } from "./actions";

export type Values = { id?: string; title: string; description: string; durationMin: number; status: string; problemIds: string[] };
export function ContestForm({ initial, problems }: { initial: Values; problems: { id: string; title: string }[] }) {
  const [state, action, pending] = useActionState(saveContest, undefined);
  const f = "input";
  return (
    <form action={action} className="card card-pad max-w-2xl space-y-5">
      {initial.id && <input type="hidden" name="id" value={initial.id} />}
      <label className="block"><span className="label">Title</span><input name="title" defaultValue={initial.title} required maxLength={120} className={f} /></label>
      <label className="block"><span className="label">Description</span><textarea name="description" defaultValue={initial.description} rows={3} className={f} /></label>
      <div className="grid grid-cols-2 gap-3">
        <label className="block"><span className="label">Duration (minutes)</span><input name="durationMin" type="number" min={5} max={600} defaultValue={initial.durationMin} className={f} /></label>
        <label className="block"><span className="label">Status</span><select name="status" defaultValue={initial.status} className={f}><option value="DRAFT">Draft</option><option value="PUBLISHED">Published</option></select></label>
      </div>
      <fieldset><legend className="label">Problems, in order (1-12)</legend>
        <div className="well max-h-72 space-y-0.5 overflow-y-auto p-2 text-sm">{problems.map((p) => (
          <label key={p.id} className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-surface"><input className="h-4 w-4 accent-[rgb(var(--brand))]" type="checkbox" name="problemIds" value={p.id} defaultChecked={initial.problemIds.includes(p.id)} /> {p.title}</label>))}</div>
        <p className="hint">Checked order does not set contest order; edit the list to reorder before your first save.</p></fieldset>
      <p role="alert" className="field-error">{state?.error}</p>
      <button disabled={pending} className="btn btn-primary">{pending ? "Saving" : "Save contest"}</button>
    </form>
  );
}

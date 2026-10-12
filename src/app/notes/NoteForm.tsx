"use client";
import { useActionState } from "react";
import { createNote } from "./actions";
import { Icon } from "@/components/Icon";

export function NoteForm({ defaults }: { defaults?: { title?: string; body?: string; tags?: string } }) {
  const [state, action, pending] = useActionState(createNote, undefined);
  return (
    <form action={action} className="space-y-4">
      <label className="block"><span className="label">Title</span><input name="title" required maxLength={120} defaultValue={defaults?.title} className="input" /></label>
      <label className="block"><span className="label">Note</span><textarea name="body" required rows={6} defaultValue={defaults?.body} className="input font-mono" spellCheck={false} /></label>
      <label className="block"><span className="label">Tags (comma separated)</span><input name="tags" placeholder="prefix-sum, indexing" defaultValue={defaults?.tags} className="input" /><span className="hint">Up to 5 tags. Letters, numbers and dashes.</span></label>
      <p role="alert" className="field-error">{state?.error && <><Icon name="alert" size={16} className="mt-0.5 shrink-0" />{state.error}</>}</p>
      {state?.ok && <p role="status" className="flex animate-pop items-center gap-2 text-sm font-bold text-ok"><Icon name="check" size={16} strokeWidth={2.6} />Note saved</p>}
      <button disabled={pending} className="btn btn-primary">{pending ? "Saving" : "Save note"}</button>
    </form>
  );
}

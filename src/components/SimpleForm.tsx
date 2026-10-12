"use client";
import { useActionState } from "react";
import type { AuthState } from "@/app/auth-actions";
import { Icon } from "@/components/Icon";

type Field = { name: string; label: string; type?: string; autoComplete?: string; hidden?: string };
export function SimpleForm({ action, fields, submitLabel }: { action: (s: AuthState, f: FormData) => Promise<AuthState>; fields: Field[]; submitLabel: string }) {
  const [state, formAction, pending] = useActionState(action, undefined);
  return (
    <form action={formAction} className="space-y-4">
      {fields.map((f) => f.hidden !== undefined
        ? <input key={f.name} type="hidden" name={f.name} value={f.hidden} />
        : <label key={f.name} className="block"><span className="label">{f.label}</span><input name={f.name} type={f.type ?? "text"} required autoComplete={f.autoComplete} className="input h-11" /></label>)}
      <p role="alert" className="field-error">{state?.error && <><Icon name="alert" size={16} className="mt-0.5 shrink-0" />{state.error}</>}</p>
      {state?.message && <p role="status" className="flex items-start gap-2 rounded-xl border border-ok/30 bg-ok/[.07] p-3 text-sm font-semibold text-ok"><Icon name="check" size={16} className="mt-0.5 shrink-0" />{state.message}</p>}
      <button disabled={pending} className="btn btn-primary btn-lg w-full">{pending && <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />}{pending ? "Please wait" : submitLabel}</button>
    </form>
  );
}

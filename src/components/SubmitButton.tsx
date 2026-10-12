"use client";
import { useFormStatus } from "react-dom";
import type { ReactNode } from "react";

/** Submit button that shows a pending state for any server-action form. Drop-in for <button> inside a <form action={...}>. */
export function SubmitButton({ children, pendingLabel, className = "btn btn-primary", name, value }: { children: ReactNode; pendingLabel?: string; className?: string; name?: string; value?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" name={name} value={value} disabled={pending} aria-disabled={pending} className={className}>
      {pending && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />}
      {pending ? pendingLabel ?? children : children}
    </button>
  );
}

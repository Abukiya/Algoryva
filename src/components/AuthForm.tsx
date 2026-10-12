"use client";
import { useActionState, useId, useState, type KeyboardEvent } from "react";
import type { FormState } from "@/app/actions";
import { Icon } from "@/components/Icon";

type Props = { action: (s: FormState, f: FormData) => Promise<FormState>; register?: boolean; submitLabel: string };

/** Mirrors the server rules in src/lib/auth/validation.ts so most mistakes are caught before a round trip. */
const PASSWORD_MIN = 10;
const PASSWORD_MAX = 128;
const USERNAME_PATTERN = "[a-zA-Z0-9_]{3,24}";

function PasswordField({ register }: { register?: boolean }) {
  const id = useId();
  const [shown, setShown] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const check = (e: KeyboardEvent<HTMLInputElement>) => setCapsLock(e.getModifierState("CapsLock"));
  return (
    <div className="block">
      <label htmlFor={id} className="label">Password</label>
      <div className="relative mt-1.5">
        <input
          id={id}
          name="password"
          type={shown ? "text" : "password"}
          required
          minLength={register ? PASSWORD_MIN : undefined}
          maxLength={PASSWORD_MAX}
          autoComplete={register ? "new-password" : "current-password"}
          onKeyDown={check}
          onKeyUp={check}
          onBlur={() => setCapsLock(false)}
          aria-describedby={capsLock ? `${id}-caps` : register ? `${id}-hint` : undefined}
          className="input h-11 w-full pr-12"
        />
        <button
          type="button"
          onClick={() => setShown((v) => !v)}
          aria-label={shown ? "Hide password" : "Show password"}
          aria-pressed={shown}
          title={shown ? "Hide password" : "Show password"}
          className="absolute right-1 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-muted transition hover:text-fg"
        >
          <Icon name={shown ? "eyeOff" : "eye"} size={18} />
        </button>
      </div>
      {capsLock && <span id={`${id}-caps`} className="hint text-warn">Caps Lock is on.</span>}
      {register && !capsLock && <span id={`${id}-hint`} className="hint">Use {PASSWORD_MIN} to {PASSWORD_MAX} characters.</span>}
    </div>
  );
}

export function AuthForm({ action, register, submitLabel }: Props) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const usernameId = useId();
  return (
    <form action={formAction} className="space-y-4">
      <label className="block"><span className="label">Email</span><input name="email" type="email" required maxLength={254} autoComplete="email" autoCapitalize="none" spellCheck={false} className="input mt-1.5 h-11 w-full" /></label>
      {register && (
        <label className="block" htmlFor={usernameId}>
          <span className="label">Username</span>
          <input id={usernameId} name="username" required minLength={3} maxLength={24} pattern={USERNAME_PATTERN} autoComplete="username" autoCapitalize="none" spellCheck={false} className="input mt-1.5 h-11 w-full" aria-describedby={`${usernameId}-hint`} />
          <span id={`${usernameId}-hint`} className="hint">3 to 24 letters, numbers or underscores. Shown on contest standings.</span>
        </label>
      )}
      <PasswordField register={register} />
      <p role="alert" className="field-error">{state?.error && <><Icon name="alert" size={16} className="mt-0.5 shrink-0" />{state.error}</>}</p>
      <button disabled={pending} className="btn btn-primary btn-lg w-full">{pending && <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />}{pending ? "Please wait" : submitLabel}</button>
    </form>
  );
}

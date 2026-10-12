import Link from "next/link";
import type { ReactNode } from "react";
import { Icon, type IconName } from "@/components/Icon";
import { tokenize } from "@/lib/highlight";
import { CopyButton } from "@/components/CopyButton";

/** Page title block. `actions` sits on the right on wide screens and wraps below on phones. */
export function PageHeader({ title, lead, actions, kicker }: { title: string; lead?: ReactNode; actions?: ReactNode; kicker?: ReactNode }) {
  return (
    <header className="mb-7 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
      <div className="min-w-0 max-w-2xl">
        {kicker && <div className="mb-2 flex items-center gap-2 text-sm text-muted">{kicker}</div>}
        <h1 className="text-3xl font-extrabold sm:text-4xl">{title}</h1>
        {lead && <p className="mt-2 text-[15px] text-soft">{lead}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

/** An empty screen is an invitation: say what is missing and offer the next action. */
export function EmptyState({ icon = "inbox", title, children, action }: { icon?: IconName; title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="rounded-card border border-dashed border-line-strong bg-surface/60 px-6 py-10 text-center">
      <span className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-sunken text-muted"><Icon name={icon} size={20} /></span>
      <p className="mt-3 font-bold">{title}</p>
      {children && <p className="mx-auto mt-1 max-w-sm text-sm text-soft">{children}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

export function Callout({ tone = "info", title, children }: { tone?: "info" | "warn" | "ok" | "bad"; title?: string; children: ReactNode }) {
  const map = { info: ["info", "border-brand/25 bg-brand/[.06] text-brand"], warn: ["alert", "border-warn/30 bg-warn/[.07] text-warn"], ok: ["check", "border-ok/30 bg-ok/[.07] text-ok"], bad: ["alert", "border-bad/30 bg-bad/[.07] text-bad"] } as const;
  const [icon, cls] = map[tone];
  return (
    <div className={`flex gap-3 rounded-xl border p-4 ${cls}`} role={tone === "bad" ? "alert" : "note"}>
      <Icon name={icon as IconName} size={18} className="mt-0.5 shrink-0" />
      <div className="min-w-0 text-sm text-fg">{title && <p className="font-bold">{title}</p>}<div className={title ? "mt-0.5 text-soft" : ""}>{children}</div></div>
    </div>
  );
}

/** Circular progress. Pure SVG, no JS. */
export function Ring({ value, size = 64, stroke = 7, children, color = "rgb(var(--brand))" }: { value: number; size?: number; stroke?: number; children?: ReactNode; color?: string }) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r, pct = Math.max(0, Math.min(1, value));
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgb(var(--sunken))" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct)} style={{ transition: "stroke-dashoffset .8s var(--ease)" }} />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  );
}

export function ProgressBar({ value, max, label, color }: { value: number; max: number; label: string; color?: string }) {
  const pct = max ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="bar" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max} aria-label={label}>
      <span style={{ width: `${pct}%`, ...(color ? { background: color } : {}) }} />
    </div>
  );
}

export function CodeBlock({ code, label = "python" }: { code: string; label?: string }) {
  return (
    <figure className="code-block my-4 text-left">
      <figcaption className="flex items-center justify-between border-b border-line px-4 py-1.5 text-xs text-muted">
        <span className="font-mono">{label}</span><CopyButton text={code} />
      </figcaption>
      <pre tabIndex={0}><code>{tokenize(code).map((t, i) => t.t === "txt" ? t.v : <span key={i} className={`tok-${t.t}`}>{t.v}</span>)}</code></pre>
    </figure>
  );
}

/** Small stat tile: number first, plain label. */
export function Stat({ label, value, hint, icon }: { label: string; value: ReactNode; hint?: ReactNode; icon?: IconName }) {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 text-[13px] font-semibold text-muted">{icon && <Icon name={icon} size={15} />}{label}</div>
      <div className="tnum mt-1 text-3xl font-extrabold leading-none">{value}</div>
      {hint && <div className="mt-1.5 text-xs text-muted">{hint}</div>}
    </div>
  );
}

export function LinkButton({ href, children, variant = "secondary", size, icon }: { href: string; children: ReactNode; variant?: "primary" | "secondary" | "quiet"; size?: "sm" | "lg"; icon?: IconName }) {
  return <Link href={href} className={`btn btn-${variant} ${size ? `btn-${size}` : ""}`}>{children}{icon && <Icon name={icon} size={16} />}</Link>;
}

import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { LOCKUP, WORDMARK_PATH, WORDMARK_VIEWBOX } from "@/components/brand/wordmark-path";

/**
 * The one place the Algoryva logo is rendered.
 *
 * - `full`       mark + wordmark, laid out exactly as in the official primary logo.
 * - `mark`       the standalone symbol (compact spaces, small headers).
 * - `responsive` mark below the `sm` breakpoint, full logo from `sm` up.
 *
 * `size` is the height of the mark in CSS px; the wordmark scales with it. The wordmark is a vector filled with the
 * theme's `--logo-word` colour (navy on paper, white on ink), so no light/dark variant switching is needed. The mark
 * is a raster cut-out from the supplied logo and reads on both themes. Width and height are always set, so nothing shifts.
 */
export type AlgoryvaLogoProps = {
  variant?: "full" | "mark" | "responsive";
  size?: number;
  /** When set, the logo is a link whose accessible name is `label`. */
  href?: string;
  label?: string;
  className?: string;
  /** Raise the mark's fetch priority (first paint: landing and auth headers). Logos always load eagerly. */
  priority?: boolean;
};

const MARK_ASPECT = LOCKUP.markWidth / LOCKUP.markHeight;
const MARKS = [160, 320, 640] as const;
const px = (n: number) => Math.round(n * 100) / 100;

function Mark({ size, priority }: { size: number; priority?: boolean }) {
  const w = px(size * MARK_ASPECT);
  const srcSet = MARKS.map((m) => `/brand/algoryva-mark-${m}.webp ${m}w`).join(", ");
  return (
    // A plain <img> on purpose: the assets are pre-sized static files, and srcSet lets the browser pick by device pixel ratio.
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/brand/algoryva-mark-320.webp" srcSet={srcSet} sizes={`${w}px`} width={Math.round(w)} height={Math.round(size)} style={{ width: w, height: size }} alt="" aria-hidden="true" draggable={false}
      loading="eager" decoding="async" fetchPriority={priority ? "high" : undefined} className="block shrink-0 select-none" />
  );
}

function Full({ size, priority }: { size: number; priority?: boolean }) {
  const k = size / LOCKUP.markHeight;                       // official lockup units -> px
  const wordH = px(((WORDMARK_VIEWBOX.h / 10) * k));
  const wordW = px(((WORDMARK_VIEWBOX.w / 10) * k));
  return (
    <span className="inline-flex shrink-0 items-start" style={{ height: size, width: px(LOCKUP.width * k), columnGap: px((LOCKUP.wordX - LOCKUP.markWidth) * k) }} aria-hidden="true">
      <Mark size={size} priority={priority} />
      <svg viewBox={`0 0 ${WORDMARK_VIEWBOX.w} ${WORDMARK_VIEWBOX.h}`} width={wordW} height={wordH} className="algoryva-wordmark block shrink-0" style={{ marginTop: px(LOCKUP.wordY * k) }} focusable="false">
        <path d={WORDMARK_PATH} fill="currentColor" />
      </svg>
    </span>
  );
}

export function AlgoryvaLogo({ variant = "full", size = 32, href, label = BRAND.homeLabel, className = "", priority }: AlgoryvaLogoProps) {
  const inner =
    variant === "mark" ? <Mark size={size} priority={priority} /> :
    variant === "full" ? <Full size={size} priority={priority} /> : (
      <>
        <span className="sm:hidden"><Mark size={size} priority={priority} /></span>
        <span className="hidden sm:inline-flex"><Full size={size} priority={priority} /></span>
      </>
    );
  const base = `inline-flex items-center rounded-md ${className}`;
  if (href) return <Link href={href} aria-label={label} className={base}>{inner}</Link>;
  return <span role="img" aria-label={BRAND.name} className={base}>{inner}</span>;
}

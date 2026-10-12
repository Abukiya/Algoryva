# Algoryva brand integration

Source of truth: the supplied logo sheet (primary logo, standalone symbol, dark theme, scalability/favicon/app icon).
The logo was not redesigned; assets were extracted from that image.

## Where things are

| What | Path |
|---|---|
| Logo component (single source for the UI) | `src/components/brand/AlgoryvaLogo.tsx` |
| Wordmark vector path + official lockup geometry | `src/components/brand/wordmark-path.ts` |
| Name, title, description, theme colours | `src/lib/brand.ts` |
| Mark (WebP 160/320/640, PNG 640) | `public/brand/algoryva-mark-*.webp`, `algoryva-mark.png` |
| Wordmark SVG (navy / white) | `public/brand/algoryva-wordmark.svg`, `algoryva-wordmark-light.svg` |
| Standalone lockups (for docs, decks; mark embedded) | `public/brand/algoryva-lockup.svg`, `algoryva-lockup-light.svg` |
| Email logo | `public/brand/algoryva-lockup-email.png` |
| Favicon / app icons | `src/app/favicon.ico`, `icon.png`, `apple-icon.png` |
| PWA icons + manifest | `public/icons/*`, `src/app/manifest.ts` |
| Share images | `src/app/opengraph-image.png`, `twitter-image.png` (+ `.alt.txt`) |

## Variants

`<AlgoryvaLogo variant="full" | "mark" | "responsive" size={n} href="/" />`

- `full`: mark + wordmark, laid out with the proportions measured on the primary logo.
- `mark`: standalone symbol.
- `responsive`: mark below `sm`, full logo from `sm` up.
- `size` is the mark height in px; the wordmark scales with it. Width/height are always set (no layout shift).
- With `href` it renders a link named "Algoryva home"; without, an image named "Algoryva".
- Light/dark: the wordmark uses `currentColor` from the `--logo-word` token (navy on paper, white on ink), so no variant switching is needed. The mark works on both.

## Where it is used

Sidebar (desktop), top bar (phones: mark; tablets: full), landing header and footer, auth frame (login, register, forgot/reset password, verify email, onboarding). Admin pages sit inside the same shell, so they carry the same logo.

## Collapsible sidebar

On laptop widths and up the sidebar has a Collapse / Expand button (bottom of the sidebar). Expanded = 15.5rem with the full logo; collapsed = a 4.5rem icon rail with the mark, icon-only navigation (names via `aria-label`, tooltips via `title`), dividers in place of the section headings, and stacked avatar / theme / log-out (guests get icon buttons for log in / sign up). The choice is stored in `localStorage` (`sidebar`) and restored before first paint by the inline script in `src/app/layout.tsx`; the layout is driven purely by CSS from `<html data-sidebar="collapsed">` (rules at the end of `globals.css`), so there is no flash and no hydration mismatch. Phones and tablets keep the bottom tab bar. Covered by `tests/e2e/sidebar.spec.ts` (not yet run).

## Branding changes

- All user-facing "cp/platform" text replaced (navbar, landing copy and footer, auth, metadata, emails, README, `.env.example`, handoff doc). The hand-drawn `LogoMark` was removed.
- Palette: neutrals and brand blue now come from the logo sheet (paper `#F4FAFA`, ink `#20283B`, wordmark navy `#1C2433`, royal blue `#3A59E0`; dark-mode brand `#789CFF`). Only the token block in `src/app/globals.css` changed; all components already used tokens. Contrast checked: every text/background token pair is at least 4.7:1 in both themes.
- Landing hero copy now opens "Algoryva is a curriculum where...".

## Metadata

`metadataBase` (from `SITE_URL`), application name, title default and `%s | Algoryva` template, description, Open Graph and Twitter (site name, cards, generated share image), Apple web-app title, light/dark `themeColor`. Landing page sets its own canonical, Open Graph and Twitter tags. A web app manifest was added (none existed).

## Favicon and app icons

Dark rounded tile with the standalone mark, as in the supplied favicon / app icon panels. 16/32/48 px favicon uses a larger mark for legibility. Maskable icon has extra safe-zone padding.

## Emails

Plain-text bodies and subjects now say Algoryva ("Reset your Algoryva password", "Verify your Algoryva email"). An HTML alternative with the logo header is sent alongside. The logo image needs a public URL, so it is only used when `SITE_URL` is `https://`; otherwise the header shows the wordmark as text. Delivery logic is unchanged.

## Implementation decisions

- **Mark is a raster cut-out, not a vector.** The mark is a soft multi-face gradient ribbon and the source is a 1376x768 image. A hand redraw would risk drifting from the official design. The cut-out is upsampled 4x with edge colours unmixed from the background (no halo on dark). If a vector master exists, replace the three WebP files and keep the component API.
- **Wordmark is a true vector**, traced from the sheet with corner-aware Bezier fitting.
- Dockerfile now copies `public/` into the standalone image (there was no `public/` before, so this was not needed until now).
- Internal identifiers intentionally kept: database name `cp_platform` (`docker-compose.yml`, `.env.example`). Renaming would orphan existing local databases. The npm package name was changed to `algoryva`.

## Validation performed (and not performed)

Performed, in a sandbox without npm network access:
- Rendered the real `Shell` markup, expanded and collapsed, signed in and out, light and dark (Tailwind utilities hand-mocked): widths 248px / 72px, no overflow.
- Rendered the real `AlgoryvaLogo` output (React server rendering) in mocks of sidebar, top bar, landing and auth headers, light and dark, at 1366/700/390/280 px. No overflow, apart from the 280 px landing header in my mock, which lacks the toggle-hiding rule the real page has (not re-run at that width).
- Wordmark vs source: silhouette overlap about 0.94. Mark and icons visually compared on light and dark.
- Mailer exercised with a mocked `fetch` (https and localhost cases, escaping).
- Repo-wide search for old brand names.
- `tsc` syntax pass: no syntax errors; remaining errors come from missing type packages in the sandbox.
- WCAG contrast check on tokens.

**Not performed** (could not be run here): `npm install`, typecheck, lint, unit tests, Playwright e2e (a small `tests/e2e/brand.spec.ts` was added but never run), `next build`, and a visual pass over the real pages. Please run:

```
npm install && npx prisma generate
npm run typecheck && npm run lint && npm test && npm run build
npx playwright test
```

then look at landing, auth, dashboard, problem pages, admin, mobile, and both themes. Things most worth eyeballing: dark-mode use of the new brand blue on chips and buttons, the mark's navy face on dark surfaces, and the landing header at very narrow widths.

## Running the e2e tests

Playwright starts `next dev` (see `playwright.config.ts`), which shares the `.next` folder with `next build`. After a build, run `rm -rf .next` (or stop any running dev server) before `npx playwright test`, otherwise the dev server serves a half-replaced build and pages such as `/register` fail to load. The tests also need the seeded database.

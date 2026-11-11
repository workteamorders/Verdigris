# Prompt for Codex: make the Verdigris site feel alive

Paste everything below the line into Codex, with the repository root as the working directory.

---

You are improving the front end of **Verdigris**, an ERC-721 collection ("Verdigris Discs") with a static Next.js site. The site is correct and accessible but visually plain. Your job is to make it feel alive and distinctive: a living, cursor-reactive background, live interactive elements, and a set of original artwork that replaces every placeholder "example" visual. Contracts and on-chain logic are out of scope.

## 0. Read first (do not skip)

1. `README.md`, `docs/DECISIONS.md` (visual direction C, Step 3 tokens), `web/src/styles/tokens.css`, `web/src/styles/base.css`.
2. `web/node_modules/next/dist/docs/` for any Next.js API you use. This is Next.js 16 with `output: 'export'`; do not rely on memory.
3. `web/src/components/` (Wheel, Disc, Panel, Badge, Button, Layout, SiteHeader, AppShell, StyleguideDemos) and `web/src/app/(site)/HomeView.tsx`, `calendar/CalendarView.tsx`, `mint/MintView.tsx`.
4. `/styleguide` (`web/src/app/styleguide/page.tsx`). It is the component reference; extend it for everything you add.

## 1. The concept you must serve

Time sets the identity. An 84-day Count opens one **Sign** (12) and one **Numeral** (7) per **Day**. A **Disc** is a bronze medal; **Patina** (verdigris, levels 0 to 4) spreads from the rim the longer it sits unmoved, and any move resets it to clean bronze. Palette: deep oxblood field, warm bronze, verdigris green, bone-white text (all already in `tokens.css`). Visual direction C: raised panels with corner rivets, one shape language, three elevations at most.

Every new visual idea should feel like *bronze aging over time*, not generic "web3 gradients".

## 2. Deliverables

### A. Live background (site-wide, behind all content)
- A canvas-based ambient background component, mounted once in the `(site)` layout (not on `/styleguide`, `/offline`, or 404 unless you add a reduced version there).
- Look: a dark bronze/oxblood field with slowly drifting, soft verdigris bloom (speckles and blobs that grow and fade, echoing Patina). It must keep moving at idle (slow drift, gentle breathing) and never look like a screensaver loop.
- Cursor interaction: the pointer acts as a warm lens. Near the cursor, bloom is attracted, brightens, or parts, then relaxes smoothly after the cursor leaves (use damped springs, not instant jumps). A click or tap sends a soft ripple of new bloom. Touch devices: track touch position and tap; no hover dependency.
- Scroll: subtle parallax or density change with scroll depth, using `transform`/`opacity` or canvas state only.
- Fallbacks, all required:
  - `prefers-reduced-motion: reduce` renders a **static** frame (one drawn frame, no animation loop) or the CSS gradient only.
  - No JS, or canvas unsupported, shows a pure-CSS gradient built from tokens.
  - `navigator.connection.saveData`, or `hardwareConcurrency <= 4`, uses a reduced particle count.
  - Pause the loop when the tab is hidden (`visibilitychange`) or the canvas is off-screen.
  - Cap device pixel ratio at 2, and render at half resolution if frames exceed the budget (measure with `performance.now()`; target a stable 60 fps on a mid-range phone, degrade gracefully).
- The canvas is `aria-hidden="true"`, `pointer-events: none`, `position: fixed`, behind everything (`z-index` from a token). It must never reduce text contrast: keep background luminance low behind text, and re-run `pnpm check:contrast`. Text on busy areas must sit on existing opaque `Panel` surfaces.
- Start the effect after first paint (`requestIdleCallback` with a timeout fallback) so it does not affect LCP. No layout shift.

### B. Live elements (interactive, tied to real data when available)
Build these as reusable components, each with all states (default, hover, focus-visible, active, disabled, loading, empty, error) and add each to `/styleguide`:
1. **Wheel hero**: the 12-Sign wheel slowly rotates; the current Day's Sign is highlighted; hovering a Sign shows its name, the pointer drags it with inertia; keyboard users can step through Signs with arrow keys (roving tabindex). When a live Count exists (`useCount`), it points at today's Sign; otherwise it stays an EXAMPLE and says so.
2. **Tilting Disc card**: pointer-driven 3D tilt (small angle), a moving specular sheen (CSS variables updated via `requestAnimationFrame`, animating `transform`/`opacity` only), and a Patina "bloom" transition when the level changes. Use it in Gallery cards, the Disc detail page, Mint preview, and Vault.
3. **Patina timeline**: on Home, scrubbing a slider (or scroll position) from level 0 to 4 grows the bloom on a Disc in real time. Keyboard operable, labelled, with the thresholds from `useCount`/`patina.ts`.
4. **Live Count clock**: a ticking time-to-next-Day readout (tabular numerals, no layout shift) with a subtle rim sweep.
5. **Calendar interaction**: hover or focus on a Day lights its whole Sign row and Numeral column; today pulses softly.
6. **Micro-interactions**: magnetic buttons (very small pull, disabled for touch and reduced motion), staggered reveal on scroll using `IntersectionObserver` with `opacity`/`transform`, animated number counters for minted totals, soft focus rings.
- All motion uses `transform` and `opacity` only (the canvas is the one exception). Durations and easings come from the `--dur-*` and `--ease-*` tokens; add new motion tokens to `tokens.css` if needed. Honour `prefers-reduced-motion` everywhere (replace motion with instant state changes, not with nothing).

### C. Our own artwork, replacing every placeholder
Right now several visuals are "example" stand-ins (the Home wheel and discs labelled EXAMPLE, the Patina row, empty-state drawings, the hero treatment, favicon/OG image). Replace them with an **original, cohesive asset kit** that we own:
- Hero artwork for Home (an original composition of the bronze Disc, the wheel, and Patina), section dividers, rivet and border ornaments, wheel tick marks, empty-state and error illustrations, 404 and offline art, a favicon and app icon set, and an Open Graph image (1200x630).
- Produce them as hand-authored **inline SVG React components** or SVG files under `web/public/`, drawn from tokens (CSS custom properties, no hard-coded colours outside the artwork files that need them). Keep one stroke weight family and one geometric language that matches the existing Sign glyphs.
- Everything must be original: no stock art, no traced or copied assets, no assets from other collections.
- **Do not change** `web/src/lib/disc.ts`, the contract renderer, the 12 Sign glyph definitions, or on-chain output. `pnpm check:parity` must still print "99 Discs byte-identical". The web `Disc` keeps using the TypeScript port.
- Rule for sample data: wherever a visual represents sample (not real chain) data, it keeps a visible **EXAMPLE** label (this is a project rule). New artwork that is purely decorative does not need the label, but must not imitate a real minted Disc or claim a real Day.

## 3. Hard constraints (from the project; do not violate)

**Do not touch:** `contracts/`, any `.env*`, `.dev.vars`, `vercel.*.vars`, keys, seed phrases, deployment records. Never open or print secret files. Never broadcast a transaction or ask for a key.

**Style bans:** no pixel-art, no blue+yellow "Theorem" look, no Windows-XP chrome, no cream thick-line panels, no nautical/star-map/ruler motifs, no fantasy or RPG kitsch. Never use Aztec, Maya, Mexica or Tonalpohualli names, or any Mesoamerican glyph, face, god, animal or pyramid motif. Do not draw any known character, mascot, logo, album or book cover.

**Copy:** English. Fixed vocabulary: Count, Day, Sign, Numeral, Disc, Patina, Vault. Banned words: earn, yield, profit, passive income, APY, reward(s), dividend, investment (as a solicitation), guaranteed, moon, floor price as a promise, will appreciate, gain value, and any claim that scarcity or Patina adds value. No "verified" or "audited" labels. Footer disclaimers stay. `pnpm copy:check` must pass.

**Design system:** every value comes from CSS tokens (`pnpm check:tokens` must pass; add tokens, do not inline values). WCAG AA contrast (`pnpm check:contrast`). 4/8 spacing. At most 3 elevations. 44 px touch targets. Visible focus. No layout shift. Dark theme only, as built.

**Technical:**
- Static export only, no server-held state. The only server code is `web/functions/api/rpc.ts`; do not change it.
- The CSP in `web/public/_headers` is `default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; worker-src 'self'`. Nothing may load from a CDN, remote font, remote image or remote script. No `eval`. If you need a worker, it must be a file served from the same origin.
- **No new paid services. Prefer zero new dependencies.** If a library is truly needed, it must be free, MIT-compatible, tree-shakeable, and justified in `docs/DECISIONS.md`. A hand-written canvas loop is expected for the background.
- Add `esbuild: false`-style entries to `pnpm-workspace.yaml` `allowBuilds` for any new dependency with an install script (pnpm 12 fails the install otherwise).
- Respect `useId`/SSR: components must render identically on the server and the first client render (the site is statically exported).

## 4. Performance budget (must not regress)

Measured on mobile Lighthouse against a static server with brotli: Home 91, Mint 97, Calendar 90, Rules 96, Vault 96, Gallery 88; Accessibility 100, Best Practices 96, SEO 100. After your changes: **no page below 90 Performance (raise Gallery if you can), Accessibility and SEO stay 100, Best Practices at least 95, CLS under 0.1**. The background must add well under 15 KB of gzipped JavaScript, and TBT must not rise noticeably. If a feature breaks the budget, scale it back and say so.

## 5. How to work

1. Make a branch. Commit in small steps (tokens, background, each live element, artwork kit, styleguide).
2. Put all new tokens in `tokens.css`; document each new component on `/styleguide` with every state.
3. After each major step run: `cd web && pnpm typecheck && pnpm check:contrast && pnpm check:tokens && pnpm check:parity && pnpm build && pnpm copy:check`.
4. Look at the result: `node scripts/shots.mjs <site url> <out dir>` captures every page at 360, 768 and 1440 plus a greyscale capture. Open the images and judge them honestly. If the greyscale capture loses hierarchy, fix it.
5. Measure Lighthouse mobile on `/`, `/mint/`, `/calendar/`, `/gallery/`, `/rules/`, `/vault/` and record the numbers.
6. Test with a throttled CPU (4x) and with `prefers-reduced-motion` on. Test with keyboard only.

## 6. Acceptance checklist

- [ ] Background is live at idle, reacts to cursor and touch, ripples on click, pauses when hidden, and is static under reduced motion.
- [ ] The five live elements exist, are keyboard operable, and appear in `/styleguide` in all states.
- [ ] No "example" stand-in visual remains that looks unfinished; all replaced by the original asset kit. EXAMPLE labels remain on sample-data visuals.
- [ ] `pnpm check:parity` still reports 99 byte-identical Discs; `disc.ts` unchanged.
- [ ] `typecheck`, `check:contrast`, `check:tokens`, `copy:check`, and `build` pass.
- [ ] Lighthouse budget in section 4 met, with numbers recorded.
- [ ] No horizontal overflow at 360, 768 and 1440.
- [ ] A short entry appended to `docs/DECISIONS.md` ("UI motion and artwork") listing what was added, any dependency, any budget trade-off, and anything not verified. No time estimates anywhere.

## 7. Final report

Reply with: what changed (grouped by A, B, C), the Lighthouse table before and after, screenshots for Home at 360 and 1440, anything you could not verify, and any decision you want the owner to confirm. Do not claim the contracts are tested or audited, and do not describe Patina or scarcity as adding value.

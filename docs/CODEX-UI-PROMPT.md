# Prompt for Codex (v2): make the Verdigris site feel alive, with full effects

Paste everything below the line into Codex, with the repository root as the working directory. Work on a new branch.

---

You are raising the front end of **Verdigris** (ERC-721 "Verdigris Discs", static Next.js site) from correct-but-plain to striking. The target is the craft level of a premium, art-directed launch site: strong illustration, confident type, tactile detail, and motion that is alive but never gets in the way. Contracts and on-chain logic are out of scope.

## 0. What "premium" means here (lessons from a reference site)

A reference site we studied reaches this level **without** heavy effects: no WebGL, no animation library, one CSS marquee. Its quality comes from art direction: a full-bleed hand-engraved hero illustration, a three-voice type system (display, text, mono label), numbered chapters with ornamental rules, captioned "plates", and tactile cards. Take that *standard of craft*. Do **not** copy its look: cream paper cards with tape are a banned style here, blackletter or any fantasy/RPG flavour is banned here, and its copy about earning or rewards is banned here. Everything must be original and in our own language: bronze aging into verdigris.

## 1. Read first (do not skip)

1. `README.md`, `docs/DECISIONS.md` (visual direction C, tokens), `web/src/styles/tokens.css`, `web/src/styles/base.css`.
2. `web/node_modules/next/dist/docs/` for every Next.js API you use (Next.js 16, `output: 'export'`). Do not rely on memory. In particular check what the installed docs say about View Transitions in the App Router and static export before using them.
3. `web/src/components/` (Wheel, Disc, Panel, Badge, Button, Layout, SiteHeader, AppShell, StyleguideDemos), `web/src/app/(site)/HomeView.tsx`, `calendar/CalendarView.tsx`, `mint/MintView.tsx`, `gallery/GalleryView.tsx`, and `/styleguide` (`web/src/app/styleguide/page.tsx`), which you must extend for everything you add.

## 2. The concept every effect must serve

Time sets the identity. An 84-day Count opens one **Sign** (12) and one **Numeral** (7) per **Day**. A **Disc** is a bronze medal. **Patina** (verdigris, levels 0 to 4) spreads from the rim the longer a Disc sits unmoved; any move resets it to clean bronze. Palette: oxblood field, warm bronze, verdigris, bone text (already tokens). Visual direction C: raised panels with corner rivets, one shape language, at most three elevations.

If an effect does not feel like *bronze aging, striking, or catching light*, cut it.

## 3. Motion tiers (the safety net for "full effect")

Implement one small module, `web/src/lib/motion.ts`, plus a React context, that picks a tier once on the client and exposes it to components:

- **Full**: desktop-class device, fine pointer, no `saveData`, `hardwareConcurrency >= 8`, and a sustained frame-time check passes. Everything below is on, including the optional WebGL layer.
- **Medium**: default for capable devices that fail a Full condition. Canvas 2D background, CSS scroll-driven effects, tilt, transitions; no WebGL.
- **Minimal**: `prefers-reduced-motion: reduce`, `saveData`, `hardwareConcurrency <= 4`, or a failed frame-time check. Static background frame, no parallax, no tilt, no marquee motion, state changes are instant (replace motion with a clear instant state, not with nothing).
- A footer control **"Motion: Full / Reduced"** lets the visitor override (persist in `localStorage` inside try/catch; the page must render correctly without it). The OS reduced-motion setting always wins over a stored "Full".
- The tier can drop at runtime: if the rolling average frame time exceeds the budget for about two seconds, step down one tier and tear down the heavy layer.
- Heavy work starts after first paint (`requestIdleCallback` with a timeout fallback) so LCP is untouched.

## 4. Deliverables

### A. Art direction (biggest lever; do this first)
- **Hero illustration**: an original full-bleed engraved-style composition for Home: a very large bronze Disc, half-cropped, with fine engraved line texture (hatching, stippling) drawn as SVG. Patina creeps in from the rim as the visitor scrolls (see B2). It is decorative, so it must not imitate a real minted Disc or claim a real Day.
- **Typography**: add a distinctive self-hosted display face with an SIL OFL licence (CSP allows `font-src 'self'` only), latin subset, `font-display: swap` with a metric-matched fallback via `next/font/local` or an equivalent. Propose two or three candidates in `docs/DECISIONS.md` with licence links and pick one: an engraved or stamped serif, not blackletter, not fantasy. Three voices: display for headings, the existing serif for text, DM Mono for labels. Keep total font payload small (subset, woff2, at most about 3 files added).
- **Chapter structure**: numbered chapters (I, II, III...) with ornamental rules, and captioned "Plate" labels on artwork. Original ornaments only: rivets, rim ticks, divider rules, corner pieces, section marks.
- **Asset kit** (inline SVG React components or files under `web/public/`, all coloured from tokens): hero art, dividers, ornament set, empty-state and error illustrations, 404 and offline art, favicon and app icons, Open Graph image 1200x630. One stroke-weight family and one geometric language matching the existing Sign glyphs. No stock art, no traced assets, no assets from other collections.
- Replace every "example" stand-in visual that looks unfinished. Wherever a visual represents **sample** (not real chain) data it keeps a visible **EXAMPLE** label (project rule). Purely decorative artwork needs no label.
- **Do not change** `web/src/lib/disc.ts`, the contract renderer, the 12 Sign glyph definitions, or on-chain output. `pnpm check:parity` must still print "99 Discs byte-identical".

### B. Live effects
1. **Living background (Medium and Full)**: a fixed canvas-2D layer behind all content, mounted once in the `(site)` layout. Dark bronze/oxblood field with slow drifting verdigris bloom that grows and fades. Alive at idle, never a visible loop. The cursor is a warm lens: bloom is attracted and brightens near it, then relaxes with damped springs after it leaves; click or tap sends a ripple; touch is supported with no hover dependency; scroll adds slight parallax or density change. `aria-hidden`, `pointer-events: none`, z-index from a token. Pause when the tab is hidden or the canvas is off-screen; cap DPR at 2; render at half resolution if over budget.
2. **Patina follows scroll (CSS, no JS)**: use CSS scroll-driven animations (`animation-timeline: scroll()` / `view()`) so verdigris grows from the rim of the hero Disc as the visitor scrolls. Animate `transform`, `opacity`, or a mask only. Wrap in `@supports (animation-timeline: scroll())`; elsewhere show a static mid-Patina state.
3. **Optional WebGL shader layer (Full tier only)**: a hand-written fragment shader (no library, about 100 lines) producing a reaction-diffusion or metaball verdigris growth over bronze, driven by cursor position and time. It replaces the canvas-2D layer when active. Feature-detect WebGL, handle context loss, keep shader source in a TS string (no `eval`, no remote loading), and tear down fully when the tier drops. If this cannot hold the frame budget, ship without it and say so.
4. **Tilting Disc card**: pointer-driven 3D tilt (small angle), a moving specular sheen (CSS variables updated in `requestAnimationFrame`; animate `transform`/`opacity`), and a Patina bloom transition when the level changes. Use in Gallery cards, Disc detail, Mint preview, Vault.
5. **"Strike" animation on mint success**: the Disc is struck like a coin: a short bright flash, one expanding ring, a few fine verdigris sparks that settle, then the Disc rests. About one second, skippable, no confetti, instant under Minimal. It must not hide the transaction result or the receipt link.
6. **Wheel hero**: the 12-Sign wheel rotates slowly; today's Sign is highlighted (from `useCount` when live, otherwise EXAMPLE and labelled); hover shows the Sign name; drag with inertia; keyboard stepping with arrow keys (roving tabindex).
7. **Sticky wheel in Calendar**: on `/calendar`, the wheel stays pinned (`position: sticky`) and rotates to each Sign as the visitor scrolls through that Sign's rows. Do not break the existing accessible data table; the wheel is an addition.
8. **Patina scrubber**: a keyboard-operable slider (level 0 to 4, thresholds from `patina.ts`) that grows the bloom on a Disc live.
9. **Live Count clock**: ticking time-to-next-Day (tabular numerals, no layout shift) with a subtle rim sweep.
10. **Page and element transitions**: a Gallery card morphs into its Disc detail page using the View Transitions API as progressive enhancement, only if the installed Next.js docs support it with static export; otherwise do a CSS fade/translate transition. Never block navigation on an animation.
11. **Marquee ticker**: CSS-only strip of Signs and plain facts ("84 Days", "12 Signs", "7 Numerals", "No token", "Contracts with no admin"), pauses on hover and focus, static under Minimal. No promotional or value claims.
12. **Type and micro-motion**: headline reveal per word (`transform`/`opacity`, `IntersectionObserver`), animated counters for minted totals, subtle magnetic buttons (fine pointer only, Full tier only), calendar hover/focus lighting the Sign row and Numeral column, today's cell pulsing softly.
13. **Cursor loupe (optional, Full tier, fine pointer only)**: over Discs the cursor gains a small ring that marks the hovered Disc; never replace the cursor site-wide, never over form fields or the Mint dialog.

Every new component needs all states (default, hover, focus-visible, active, disabled, loading, empty, error) and a section on `/styleguide`. Motion durations and easings come from `--dur-*` and `--ease-*` tokens; add new tokens to `tokens.css`, never inline values.

## 5. Hard constraints (from the project; do not violate)

**Do not touch**: `contracts/`, any `.env*`, `.dev.vars`, `vercel.*.vars`, keys, seed phrases, deployment records, `web/functions/api/rpc.ts`. Never open or print secret files. Never broadcast a transaction or ask for a key.

**Style bans**: no pixel-art, no blue+yellow "Theorem" look, no Windows-XP chrome, no cream thick-line panels, no nautical, star-map or ruler motifs, no fantasy or RPG kitsch (this includes blackletter). Never use Aztec, Maya, Mexica or Tonalpohualli names, or any Mesoamerican glyph, face, god, animal or pyramid motif. Never draw a known character, mascot, logo, album or book cover.

**Copy**: English. Fixed vocabulary: Count, Day, Sign, Numeral, Disc, Patina, Vault. Banned: earn, yield, profit, passive income, APY, reward(s), dividend, investment (as a solicitation), guaranteed, moon, floor price as a promise, will appreciate, gain value, and any claim that scarcity or Patina adds value. No "verified" or "audited" labels. Footer disclaimers stay. `pnpm copy:check` must pass.

**Design system**: all values from CSS tokens (`pnpm check:tokens`), WCAG AA (`pnpm check:contrast`), 4/8 spacing, at most 3 elevations, 44 px touch targets, visible focus, no layout shift, dark theme only. DOM animation uses `transform` and `opacity` only; the canvas, the WebGL layer, and CSS scroll-driven mask effects are the only exceptions. Respect `prefers-reduced-motion` everywhere.

**Technical**: static export only, no server-held state. CSP in `web/public/_headers`: `default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; worker-src 'self'`. Nothing from a CDN, remote font, image or script; no `eval`; a worker must be a same-origin file. **No paid services. Prefer zero new dependencies**; no GSAP, no Lenis or other smooth-scroll library (native scroll stays), no Three.js. If a library is truly needed it must be free, tree-shakeable, and justified in `docs/DECISIONS.md`. Add any dependency with an install script to `allowBuilds` in `web/pnpm-workspace.yaml` (`name: false` unless it genuinely needs to run), because pnpm 12 fails the install otherwise. Components must render identically on the server and the first client render (`useId`, no `window` at render).

## 6. Performance budget (must not regress)

Mobile Lighthouse on a static server with brotli, before your work: Home 91, Mint 97, Calendar 90, Rules 96, Vault 96, Gallery 88; Accessibility 100, Best Practices 96, SEO 100. After: **no page below 90 Performance (raise Gallery if you can), Accessibility and SEO stay 100, Best Practices at least 95, CLS under 0.1.** Heavy effects must start after first paint. The always-on motion code (tier module, canvas background) stays well under 15 KB gzipped; the WebGL layer is a separate lazy chunk loaded only in the Full tier. Lighthouse itself runs on a throttled mobile profile, so it will exercise the Minimal or Medium path; also verify the Full tier by hand on a desktop browser and record the frame time. If a feature breaks the budget, scale it back and say so.

## 7. How to work

1. New branch. Small commits: tokens and tier module, art direction and type, background, each live effect, asset kit, styleguide.
2. After each major step: `cd web && pnpm typecheck && pnpm check:contrast && pnpm check:tokens && pnpm check:parity && pnpm build && pnpm copy:check`.
3. Look at the result: `node scripts/shots.mjs <site url> <out dir>` captures every page at 360, 768 and 1440 plus greyscale. Open the images and judge honestly; if greyscale loses hierarchy, fix it.
4. Measure Lighthouse mobile on `/`, `/mint/`, `/calendar/`, `/gallery/`, `/rules/`, `/vault/`.
5. Test with CPU throttled 4x, with `prefers-reduced-motion` on, with keyboard only, and with JavaScript disabled (CSS-only fallbacks must still look intentional).

## 8. Acceptance checklist

- [ ] Tier system works: Full, Medium, Minimal; footer override; reduced-motion always wins; runtime step-down.
- [ ] Background is live at idle, reacts to cursor and touch, ripples on click, pauses when hidden, static under Minimal.
- [ ] Patina-on-scroll works in CSS with a static fallback.
- [ ] WebGL layer is Full-tier only, lazy, torn down on step-down, or consciously left out with a note.
- [ ] Mint "strike" animation, tilting Disc card, wheel hero, sticky calendar wheel, scrubber, live clock, marquee, and headline reveal exist, are keyboard operable, and appear in `/styleguide` in all states.
- [ ] Hero illustration, ornament set, display font, chapters and plates are in; no unfinished example visual remains; EXAMPLE labels remain on sample-data visuals.
- [ ] `check:parity` still reports 99 byte-identical Discs; `disc.ts` unchanged.
- [ ] `typecheck`, `check:contrast`, `check:tokens`, `copy:check`, `build` pass.
- [ ] Lighthouse budget in section 6 met, with numbers recorded.
- [ ] No horizontal overflow at 360, 768, 1440.
- [ ] A "UI motion and artwork" entry in `docs/DECISIONS.md`: font candidates and the choice with licence, dependencies, budget trade-offs, what was not verified. No time estimates anywhere.

## 9. Final report

Reply with: what changed (grouped by A and B), the Lighthouse table before and after, Home screenshots at 360 and 1440, the measured frame time in the Full tier, anything you could not verify, and any decision the owner must confirm (font choice, WebGL in or out). Do not claim the contracts are tested or audited, and do not describe Patina or scarcity as adding value.

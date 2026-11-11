import { MotionDemos } from '@/components/StyleguideDemos';
import type { Metadata } from 'next';
import { SiteHeader } from '@/components/SiteHeader';
import { Button } from '@/components/Button';
import { Badge, type BadgeTone } from '@/components/Badge';
import { Panel, LinkPanel } from '@/components/Panel';
import { Tooltip } from '@/components/Tooltip';
import { QuotaChart } from '@/components/QuotaChart';
import { Skeleton, DiscSkeleton, EmptyState, ErrorState } from '@/components/States';
import { Disc } from '@/components/Disc';
import { Wheel, type WheelState } from '@/components/Wheel';
import { BannerDemo, DialogDemo, FormDemo, TableDemo, ToastDemo } from '@/components/StyleguideDemos';
import { SIGNS } from '@/lib/signs';
import { LEVEL_NAMES, type PatinaLevel } from '@/lib/patina';
import contrast from '@/lib/contrast.generated.json';
import styles from './Styleguide.module.css';

export const metadata: Metadata = {
  title: 'Styleguide',
  description: 'Internal reference: design tokens, components with every state, the Disc and the wheel.',
  robots: { index: false },
};

const COLOURS: ReadonlyArray<[string, string]> = [
  ['field', 'Base field'],
  ['surface', 'Slab'],
  ['surface-2', 'Slab 2'],
  ['line', 'Line'],
  ['line-strong', 'Line, strong'],
  ['text', 'Text'],
  ['text-dim', 'Text, dim'],
  ['accent', 'Accent (bone)'],
  ['patina', 'Patina'],
  ['patina-text', 'Patina, text'],
  ['patina-deep', 'Patina, deep'],
  ['success', 'Success'],
  ['danger', 'Danger'],
  ['warning', 'Warning'],
  ['info', 'Info'],
  ['patina-0', 'Patina 0'],
  ['patina-1', 'Patina 1'],
  ['patina-2', 'Patina 2'],
  ['patina-3', 'Patina 3'],
  ['patina-4', 'Patina 4'],
];

const TYPE: ReadonlyArray<[string, string, string]> = [
  ['--fs-4xl', 'var(--fs-4xl)', 'Day 31'],
  ['--fs-3xl', 'var(--fs-3xl)', 'Slashes 3'],
  ['--fs-2xl', 'var(--fs-2xl)', 'Exposure report'],
  ['--fs-xl', 'var(--fs-xl)', 'Today is Slashes 3'],
  ['--fs-lg', 'var(--fs-lg)', 'One Sign and one Numeral open each Day'],
  ['--fs-md', 'var(--fs-md)', 'Body text is 16px with a 1.6 line height.'],
  ['--fs-sm', 'var(--fs-sm)', 'Hints and table text'],
  ['--fs-xs', 'var(--fs-xs)', 'LABEL, SMALL CAPS TRACKING'],
];

const SPACES = ['space-1', 'space-2', 'space-3', 'space-4', 'space-5', 'space-6', 'space-7', 'space-8', 'space-9'] as const;
const STATES = ['default', 'hover', 'active', 'focus', 'disabled', 'loading'] as const;
const VARIANTS = ['primary', 'secondary', 'ghost', 'danger'] as const;
const LEVELS: readonly PatinaLevel[] = [0, 1, 2, 3, 4];
const BADGES: ReadonlyArray<[BadgeTone, string]> = [
  ['neutral', 'Preview data'],
  ['success', 'Confirmed'],
  ['danger', 'Sold out'],
  ['warning', 'Not deployed'],
  ['info', 'Test clock'],
  ['patina', 'Patina level 2'],
];
const WHEELS: ReadonlyArray<{ state: WheelState; sign: number; numeral: number; caption?: string; note: string }> = [
  { state: 'undeployed', sign: 6, numeral: 3, note: 'Preview pair shown before deployment' },
  { state: 'today', sign: 6, numeral: 3, note: 'Today: the lit pair opens now' },
  { state: 'soldout', sign: 6, numeral: 3, caption: '07:42:19', note: 'Today sold out: next Day opens in' },
  { state: 'before', sign: 0, numeral: 1, caption: '02 d 04:11:09', note: 'Before the start: Day 1 countdown' },
  { state: 'done', sign: 6, numeral: 3, note: 'Count finished: the wheel stops' },
  { state: 'loading', sign: 6, numeral: 3, note: 'Loading: skeleton in the same shape' },
  { state: 'disabled', sign: 6, numeral: 3, note: 'Disabled' },
  { state: 'error', sign: 6, numeral: 3, note: 'RPC failed: nothing is lost' },
];

function buttonProps(state: (typeof STATES)[number]) {
  return {
    forceState: state === 'hover' || state === 'active' || state === 'focus' ? state : undefined,
    disabled: state === 'disabled',
    loading: state === 'loading',
  } as const;
}

export default function StyleguidePage() {
  return (
    <>
      <SiteHeader status={{ tone: 'warning', label: 'Not deployed · Preview data' }} />
      <main id="main" className={`container ${styles.page}`}>
        <header className={styles.intro}>
          <p className="label">Internal reference · Direction C, Exposure Rack</p>
          <h1>Styleguide</h1>
          <p>Every value on this page comes from one token file. Every component is shown in every state it can be in. Discs are drawn by the TypeScript port of the contract renderer, which is byte-identical to the on-chain output.</p>
          <ul className={styles.toc}>
            {['tokens', 'components', 'discs', 'wheel'].map((s) => (
              <li key={s}>
                <a href={`#${s}`}>{s}</a>
              </li>
            ))}
          </ul>
        </header>

        <section id="tokens" className={styles.section} aria-labelledby="h-tokens">
          <h2 id="h-tokens">Tokens</h2>

          <div className={styles.sub}>
            <h3>Colour</h3>
            <div className={styles.swatches}>
              {COLOURS.map(([name, label]) => (
                <div className={styles.swatch} key={name}>
                  <span className={styles.chip} style={{ background: `var(--${name})` }} />
                  <span>--{name}</span>
                  <span>{label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.sub}>
            <h3>Contrast, checked by script ({contrast.filter((c) => c.pass).length} of {contrast.length} pairs pass)</h3>
            <p className="dim">Text pairs need 4.5:1. Component edges and focus rings need 3:1. The check runs with pnpm check:contrast.</p>
            <div className={styles.contrast} role="table" aria-label="Contrast pairs">
              {contrast.map((c) => (
                <div key={`${c.fg}-${c.bg}-${c.min}`} role="row" style={{ display: 'contents' }}>
                  <span role="cell" className={styles.sampleText} style={{ color: `var(--${c.fg})`, background: `var(--${c.bg})` }}>
                    {c.what}
                  </span>
                  <span role="cell">{c.ratio}:1</span>
                  <span role="cell">{c.pass ? `pass (min ${c.min})` : `FAIL (min ${c.min})`}</span>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.sub}>
            <h3>Type</h3>
            <p className="dim">Schibsted Grotesk for display, Source Serif 4 for reading, DM Mono for numbers and labels. Self-hosted, swap loading, Latin subset.</p>
            <div className={styles.scale}>
              {TYPE.map(([token, size, sample]) => (
                <div key={token} className={styles.typeRow}>
                  <span className="label">{token}</span>
                  <span style={{ fontSize: size, fontFamily: token.includes('xs') || token.includes('sm') || token.includes('md') ? 'var(--font-body)' : 'var(--font-display)', fontWeight: token.includes('xs') || token.includes('sm') || token.includes('md') ? 400 : 800, lineHeight: 'var(--lh-tight)' }}>{sample}</span>
                </div>
              ))}
              <div className={styles.typeRow}>
                <span className="label">mono, tabular</span>
                <span className="mono" style={{ fontSize: 'var(--fs-lg)' }}>0.020 ETH · 07:42:19 · 9 / 24</span>
              </div>
            </div>
          </div>

          <div className={styles.sub}>
            <h3>Spacing, multiples of 4 and 8</h3>
            <div className={styles.scale}>
              {SPACES.map((s) => (
                <div key={s} className={styles.space}>
                  <span style={{ minWidth: '6rem' }}>--{s}</span>
                  <span className={styles.bar} style={{ width: `var(--${s})` }} />
                </div>
              ))}
            </div>
          </div>

          <div className={styles.sub}>
            <h3>Shape, elevation and the motif</h3>
            <p className="dim">One shape language: square, 1px lines, no radius except for round parts. The motif is the bolted slab: four bolts, used on the wheel plate, panels, dialogs and the exposure rack.</p>
            <div className={styles.grid3}>
              <div className={styles.elevBox} style={{ boxShadow: 'var(--elev-flat)', border: 'var(--stroke) solid var(--line)' }}>
                <span className="label">Flat</span>
              </div>
              <div className={`${styles.elevBox} bolted`}>
                <span className="label">Raised: bolted slab</span>
              </div>
              <div className={`${styles.elevBox} bolted`} style={{ ['--bolt-elev' as string]: 'var(--elev-floating)' }}>
                <span className="label">Floating: dialogs, toasts</span>
              </div>
            </div>
          </div>

          <div className={styles.sub}>
            <h3>Motion</h3>
            <p className="dim">One character, exposure: steady and linear-feeling, no bounce. Nothing animates except transform and opacity. Reduced motion turns every duration to zero.</p>
            <div className={styles.motion}>
              <span>--dur-micro</span>
              <span>100ms · press feedback</span>
              <span>--dur-element</span>
              <span>200ms · hover, fade, switch</span>
              <span>--dur-panel</span>
              <span>320ms · dialog, drawer, bottom sheet</span>
            </div>
          </div>
        </section>

        <section id="components" className={styles.section} aria-labelledby="h-components">
          <h2 id="h-components">Components</h2>

          <div className={styles.sub}>
            <h3>Buttons</h3>
            <p className="dim">One primary button per view. Press sinks the button by the depth of its edge within 100ms. Loading keeps the width.</p>
            {VARIANTS.map((v) => (
              <div key={v} className={styles.stack}>
                <span className="label">{v}</span>
                <div className={styles.stateGrid}>
                  {STATES.map((s) => (
                    <div key={s} className={styles.stack}>
                      <Button variant={v} {...buttonProps(s)}>
                        Mint Disc
                      </Button>
                      <span className="label">{s}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <div className={styles.stack}>
              <span className="label">icon only · sizes</span>
              <div className={styles.row}>
                <Button variant="icon" icon="copy" aria-label="Copy address" />
                <Button variant="icon" icon="external" aria-label="Open in explorer" />
                <Button variant="icon" icon="copy" aria-label="Copy address, hover" forceState="hover" />
                <Button variant="icon" icon="copy" aria-label="Copy address, disabled" disabled />
                <Button size="sm">Small</Button>
                <Button size="md">Medium</Button>
                <Button size="lg" variant="primary">
                  Large
                </Button>
              </div>
            </div>
          </div>

          <div className={styles.sub}>
            <h3>Forms</h3>
            <p className="dim">Labels always visible. Errors are specific and appear on blur, never on the first keystroke. Type a short value, then tab out, to see one.</p>
            <FormDemo />
          </div>

          <div className={styles.sub}>
            <h3>Panels</h3>
            <div className={styles.grid3}>
              <Panel as="section">
                <h3>Static panel</h3>
                <p className="dim">A bolted slab for grouped information.</p>
              </Panel>
              <LinkPanel href="/calendar/" title="Calendar">
                <p className="dim">Interactive panel: one target, one link, the whole card is the hit area. Hover to see.</p>
              </LinkPanel>
              <LinkPanel href="/calendar/" title="Calendar, hover" forceState="hover">
                <p className="dim">Pinned hover state.</p>
              </LinkPanel>
              <LinkPanel href="/calendar/" title="Calendar, focus" forceState="focus">
                <p className="dim">Pinned focus state.</p>
              </LinkPanel>
            </div>
          </div>

          <div className={styles.sub}>
            <h3>Badges</h3>
            <p className="dim">Icon plus label plus colour. A badge never says “verified” or “audited”.</p>
            <div className={styles.row}>
              {BADGES.map(([tone, label]) => (
                <Badge key={tone} tone={tone}>
                  {label}
                </Badge>
              ))}
            </div>
          </div>

          <div className={styles.sub}>
            <h3>Navigation</h3>
            <p className="dim">The header above is the real one: current page marked, skip link first in the tab order. Below 1024px the links move into a drawer. Resize to see it.</p>
          </div>

          <div className={styles.sub}>
            <h3>Dialog and drawer</h3>
            <p className="dim">Focus moves inside, Esc closes, focus returns to the trigger, the page behind cannot scroll. On phones the dialog becomes a bottom sheet. Danger actions name the verb.</p>
            <DialogDemo />
          </div>

          <div className={styles.sub}>
            <h3>Toast</h3>
            <p className="dim">Title plus one line, gone after five seconds, closable, announced by screen readers.</p>
            <ToastDemo />
          </div>

          <div className={styles.sub}>
            <h3>Notices</h3>
            <BannerDemo />
          </div>

          <div className={styles.sub}>
            <h3>Table</h3>
            <p className="dim">Sticky header, numbers right-aligned in tabular figures, focusable rows, visible sort state. Below tablet width every row becomes a card.</p>
            <TableDemo />
          </div>

          <div className={styles.sub}>
            <h3>Chart</h3>
            <QuotaChart
              title="9 of 24 Ordinary Discs are left today"
              rows={[
                { tier: 'Ordinary', minted: 15, cap: 24 },
                { tier: 'Fine', minted: 16, cap: 16 },
                { tier: 'Crown', minted: 3, cap: 8 },
              ]}
            />
            <p className="dim">Preview data.</p>
          </div>

          <div className={styles.sub}>
            <h3>System states</h3>
            <div className={styles.grid3}>
              <div className={styles.stack}>
                <span className="label">Skeleton, same shape as the content</span>
                <div style={{ width: '10rem' }}>
                  <DiscSkeleton />
                </div>
                <Skeleton height="var(--space-5)" />
                <Skeleton width="60%" />
              </div>
              <EmptyState heading="h3" title="No Discs in your Vault yet" action={<Button variant="primary">Mint today&#39;s Disc</Button>}>
                Mint one and it will appear here with its Patina date.
              </EmptyState>
              <ErrorState heading="h3" title="Cannot read the chain" what="The network did not answer, so today's numbers are missing." safe="Your Discs and funds are not affected. Nothing was sent." next={<Button variant="secondary">Try again</Button>} />
            </div>
          </div>

          <div className={styles.sub}>
            <h3>Tooltip</h3>
            <p>
              Patina reads{' '}
              <Tooltip text="Time since the last move, read when the metadata is requested. Marketplaces may show an older image.">
                time since the last move
              </Tooltip>
              . Hover or focus the dotted text. The tooltip never holds the only copy of important information.
            </p>
          </div>
        </section>

        <section id="discs" className={styles.section} aria-labelledby="h-discs">
          <h2 id="h-discs">Discs</h2>
          <div className={styles.row}>
            <Badge tone="neutral">TS port of the contract renderer</Badge>
          </div>
          <p className="dim">Drawn by the TypeScript port of the on-chain renderer. Tier is read by ring count: two, three plus rivets, four plus rivets and a centre mark. Same Disc (Slashes) at every Patina level.</p>
          {(
            [
              ['Ordinary', 3],
              ['Fine', 6],
              ['Crown', 7],
            ] as const
          ).map(([tier, numeral]) => (
            <div key={tier} className={styles.stack}>
              <span className="label">
                {tier} · Numeral {numeral}
              </span>
              <div className={styles.discGrid}>
                {LEVELS.map((l) => (
                  <figure key={l} className={styles.discCell} style={{ margin: 0 }}>
                    <Disc sign={6} numeral={numeral} level={l} />
                    <figcaption>
                      Level {l} · {LEVEL_NAMES[l]}
                    </figcaption>
                  </figure>
                ))}
              </div>
            </div>
          ))}
          <div className={styles.stack}>
            <span className="label">Greyscale check: tier must read without colour</span>
            <div className={styles.discGrid}>
              {([3, 6, 7, 3, 6] as const).map((n, i) => (
                <figure key={`g${i}`} className={styles.discCell} style={{ margin: 0 }}>
                  <Disc sign={i + 1} numeral={n} level={(i % 2 === 0 ? 0 : 2) as PatinaLevel} className={styles.grey} />
                  <figcaption>{n >= 7 ? 'Crown' : n >= 5 ? 'Fine' : 'Ordinary'}</figcaption>
                </figure>
              ))}
            </div>
          </div>
          <div className={styles.stack}>
            <span className="label">Fallback check: the same Discs with every filter removed (what a filter-stripping marketplace would show)</span>
            <div className={styles.discGrid}>
              {LEVELS.map((l) => (
                <figure key={`f${l}`} className={styles.discCell} style={{ margin: 0 }}>
                  <Disc sign={6} numeral={l === 4 ? 7 : l === 2 ? 6 : 3} level={l} noFilters />
                  <figcaption>No filters · Level {l}</figcaption>
                </figure>
              ))}
            </div>
          </div>
          <div className={styles.stack}>
            <span className="label">The 12 Signs: abstract geometry, plain names</span>
            <div className={styles.discGrid} style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(6rem, 1fr))' }}>
              {SIGNS.map((s, i) => (
                <figure key={s.name} className={styles.discCell} style={{ margin: 0 }}>
                  <svg viewBox="-48 -48 96 96" role="img" aria-label={`Sign ${i + 1}: ${s.name}`} fill="none" stroke="var(--text)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" style={{ background: 'var(--surface)', border: 'var(--stroke) solid var(--line)' }}>
                    <path d={s.d} />
                  </svg>
                  <figcaption>
                    {i + 1} · {s.name}
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        <section id="wheel" className={styles.section} aria-labelledby="h-wheel">
          <h2 id="h-wheel">Wheel</h2>
          <p className="dim">12 Signs outside, 7 Numerals inside. The lit pair is today&#39;s. Every state the wheel can be in.</p>
          <div className={styles.wheelGrid}>
            {WHEELS.map((w) => (
              <div key={w.state} className={styles.wheelCell}>
                <Wheel state={w.state} sign={w.sign} numeral={w.numeral} caption={w.caption} preview />
                <span className="label">{w.note}</span>
              </div>
            ))}
          </div>
        </section>
        <section id="motion" className={styles.section} aria-labelledby="h-motion">
          <h2 id="h-motion">Motion and artwork</h2>
          <p className="dim">The ambient field runs on the main site. Reduced motion keeps a static field, and the controls retain their focus and selection states.</p>
          <MotionDemos />
        </section>
      </main>
    </>
  );
}

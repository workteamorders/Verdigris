'use client';

import { useState } from 'react';
import { Button } from './Button';
import { Disc } from './Disc';
import { HeroArt } from './HeroArt';
import { MotionToggle } from './MotionToggle';
import { ChapterHead, Plate, Rule } from './Ornament';
import { PatinaScrubber } from './PatinaScrubber';
import { Strike } from './Strike';
import { Ticker } from './Ticker';
import { TiltCard } from './TiltCard';
import { useMotion } from '@/lib/motion';
import styles from '@/app/styleguide/Styleguide.module.css';

const WHEN = ['Minted or moved', '3 days unmoved', '14 days unmoved', '45 days unmoved', '120 days unmoved'] as const;

/** Every motion and artwork piece, live. */
export function MotionDemo() {
  const { tier, osReduced, preference } = useMotion();
  const [run, setRun] = useState(0);
  return (
    <div className={styles.stack}>
      <div className={styles.row}>
        <p className="label">Tier now: {tier}</p>
        <p className="dim">{osReduced ? 'The system asks for reduced motion.' : preference === 'reduced' ? 'Reduced by the visitor.' : 'Chosen from the device. It steps down by itself if frames run slow.'}</p>
        <MotionToggle />
      </div>

      <h3>Tilting Disc</h3>
      <p className="dim">Pointer tilt with a moving highlight. Off on touch and in the Minimal tier.</p>
      <div style={{ maxWidth: '14rem' }}>
        <TiltCard max={10}>
          <Disc sign={3} numeral={7} serial={2} level={1} />
        </TiltCard>
      </div>

      <h3>Strike</h3>
      <p className="dim">Plays once when a mint succeeds. Instant (not shown) in the Minimal tier.</p>
      <div style={{ position: 'relative', maxWidth: '14rem' }}>
        <Disc sign={8} numeral={5} serial={3} level={0} />
        {run > 0 ? <Strike key={run} /> : null}
      </div>
      <div>
        <Button variant="secondary" onClick={() => setRun((n) => n + 1)}>
          Play the strike
        </Button>
      </div>

      <h3>Patina scrubber</h3>
      <PatinaScrubber when={WHEN} />

      <h3>Ticker</h3>
      <Ticker />

      <h3>Chapter head, rule, plate</h3>
      <ChapterHead n={4} label="Preview" title="A chapter title in the engraved face" lead="The numeral and title are set in the engraved face, the label in mono, and a rule closes the head." />
      <Rule />
      <Plate n={2}>A caption set the way an engraved plate is captioned.</Plate>

      <h3>Hero engraving</h3>
      <p className="dim">Decorative. 84 ticks for the 84 Days, medal hatching, and verdigris that grows as the page scrolls (where scroll-driven animation is supported).</p>
      <div style={{ position: 'relative', height: '22rem', overflow: 'clip', border: 'var(--stroke) solid var(--line)' }}>
        <HeroArt />
      </div>
    </div>
  );
}

import { useId, type ReactElement } from 'react';
import { discInline } from '@/lib/disc';
import { SIGNS, tierOfNumeral } from '@/lib/signs';
import { Frame } from './Frame';
import styles from './Wheel.module.css';

export type WheelState = 'today' | 'before' | 'soldout' | 'done' | 'loading' | 'error' | 'undeployed';

interface WheelProps {
  state: WheelState;
  /** Sign 0..11 and Numeral 1..7 for the pair shown (today's, or Day 1's before the start). */
  sign: number;
  numeral: number;
  /** Text under the centre, e.g. a countdown. Provided by the caller so the wheel stays pure. */
  caption?: string;
  featured?: boolean;
}

const CENTRE: Record<Exclude<WheelState, 'today' | 'undeployed'>, { a: string; b?: string }> = {
  before: { a: 'Day 1 opens in' },
  soldout: { a: 'Sold out today' },
  done: { a: 'Count 1 complete' },
  loading: { a: 'Reading the chain' },
  error: { a: 'Cannot read the chain' },
};

/** The functional wheel: 12 Signs outside, 7 Numerals inside, the lit pair is today's. */
export function Wheel({ state, sign, numeral, caption, featured = false }: WheelProps) {
  const raw = useId().replace(/:/g, '');
  const showDisc = state === 'today' || state === 'undeployed' || state === 'soldout' || state === 'done';
  const dim = state === 'before' || state === 'soldout' || state === 'done' || state === 'loading' || state === 'error';
  const lit = state === 'today' || state === 'undeployed' || state === 'soldout';
  const centre = state === 'today' || state === 'undeployed' ? null : CENTRE[state];
  const tier = tierOfNumeral(numeral);
  const sName = SIGNS[sign]?.name ?? '';

  const rings: ReactElement[] = [];
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
    const x = 300 + Math.cos(a) * 266;
    const y = 300 + Math.sin(a) * 266;
    const on = lit && i === sign;
    const g = SIGNS[i];
    if (!g) continue;
    rings.push(
      <g key={`s${i}`} transform={`translate(${x.toFixed(1)} ${y.toFixed(1)})`}>
        {on ? <circle r="24" className={styles.litBg} /> : null}
        <g transform="scale(.36)" className={on ? styles.glyphLit : styles.glyph} strokeLinecap="round" strokeLinejoin="round">
          <path d={g.d} />
        </g>
      </g>,
    );
  }
  const dots: ReactElement[] = [];
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2 - Math.PI / 2;
    const x = 300 + Math.cos(a) * 217;
    const y = 300 + Math.sin(a) * 217;
    const on = lit && i === numeral - 1;
    dots.push(
      <g key={`n${i}`} transform={`translate(${x.toFixed(1)} ${y.toFixed(1)})`}>
        <circle r={on ? 13 : 7} className={on ? styles.dotLit : styles.dot} />
        {on ? (
          <text y="5" textAnchor="middle" className={styles.dotText}>
            {numeral}
          </text>
        ) : null}
      </g>,
    );
  }

  const label =
    state === 'today' || state === 'undeployed' || state === 'soldout'
      ? `Wheel. Sign ${sName} and Numeral ${numeral} are lit for today. Tier ${tier}.`
      : `Wheel. ${centre?.a ?? ''}.`;

  return (
    <Frame frame="moulding" featured={featured} className={styles.plate} faceClassName={styles.plateFace} data-state={state}>
      <svg viewBox="0 0 600 600" className={styles.svg} role="img" aria-label={label}>
        <circle cx="300" cy="300" r="294" className={styles.disk} />
        <circle cx="300" cy="300" r="238" className={state === 'error' ? styles.ringErr : styles.ring} />
        <circle cx="300" cy="300" r="196" className={styles.ring} />
        <g className={dim && state !== 'soldout' ? styles.dimmed : undefined}>
          {rings}
          {dots}
        </g>
        {showDisc ? (
          <g transform="translate(120 120) scale(.9)" className={state === 'soldout' || state === 'done' ? styles.discDim : undefined} dangerouslySetInnerHTML={{ __html: discInline({ sign, numeral, level: 0, serial: 5 }, { idPrefix: `w${raw}` }) }} />
        ) : null}
        {state === 'loading' ? <circle cx="300" cy="300" r="150" className={styles.skel} /> : null}
        {centre ? (
          <g>
            <rect x="150" y="252" width="300" height={caption ? 92 : 56} className={styles.label} />
            <text x="300" y="288" textAnchor="middle" className={styles.centreText}>
              {centre.a}
            </text>
            {caption ? (
              <text x="300" y="326" textAnchor="middle" className={styles.centreNum}>
                {caption}
              </text>
            ) : null}
          </g>
        ) : null}
        {state === 'undeployed' ? (
          <g>
            <rect x="215" y="446" width="170" height="34" className={styles.label} />
            <text x="300" y="469" textAnchor="middle" className={styles.centreText}>
              PREVIEW
            </text>
          </g>
        ) : null}
      </svg>
    </Frame>
  );
}

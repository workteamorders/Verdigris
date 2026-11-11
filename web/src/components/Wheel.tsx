'use client';

import { memo, useId, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactElement } from 'react';
import { discInline } from '@/lib/disc';
import { SIGNS, tierOfNumeral } from '@/lib/signs';
import { ExposureRim } from './Artwork';
import styles from './Wheel.module.css';

export type WheelState = 'today' | 'before' | 'soldout' | 'done' | 'loading' | 'error' | 'undeployed' | 'disabled';

interface WheelProps {
  state: WheelState;
  /** Sign 0..11 and Numeral 1..7 for the pair shown (today's, or Day 1's before the start). */
  sign: number;
  numeral: number;
  /** Text under the centre, e.g. a countdown. Provided by the caller so the wheel stays pure. */
  caption?: string;
  preview?: boolean;
  serial?: number;
}

const CENTRE: Record<Exclude<WheelState, 'today' | 'undeployed'>, { a: string; b?: string }> = {
  before: { a: 'Day 1 opens in' },
  soldout: { a: 'Sold out today' },
  done: { a: 'Count 1 complete' },
  loading: { a: 'Reading the chain' },
  error: { a: 'Cannot read the chain' },
  disabled: { a: 'Wheel unavailable' },
};

/** The functional wheel: 12 Signs outside, 7 Numerals inside, the lit pair is today's. */
export const Wheel = memo(function Wheel({ state, sign, numeral, caption, preview = state === 'undeployed', serial = 5 }: WheelProps) {
  const [focused, setFocused] = useState<number | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  const [rotation, setRotation] = useState(0);
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{ id: number; x: number; time: number; velocity: number; rotation: number; moved: boolean } | null>(null);
  const nodes = useRef<Array<SVGGElement | null>>([]);
  const interactive = state === 'today' || state === 'undeployed' || state === 'soldout';
  const active = focused ?? sign;

  function step(event: KeyboardEvent<SVGGElement>, index: number) {
    const offsets: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
    const offset = offsets[event.key];
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? 11 : offset === undefined ? undefined : (index + offset + 12) % 12;
    if (next === undefined) return;
    event.preventDefault();
    nodes.current[next]?.focus();
  }

  function startDrag(event: PointerEvent<SVGSVGElement>) {
    if (!interactive || !event.isPrimary || event.button !== 0 || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    drag.current = { id: event.pointerId, x: event.clientX, time: event.timeStamp, velocity: 0, rotation, moved: false };
  }

  function moveDrag(event: PointerEvent<SVGSVGElement>) {
    const current = drag.current;
    if (!current || current.id !== event.pointerId) return;
    const dx = event.clientX - current.x;
    if (!current.moved && Math.abs(dx) < 5) return;
    if (!current.moved) {
      event.currentTarget.setPointerCapture(event.pointerId);
      current.moved = true;
      setDragging(true);
      setHover(null);
    }
    current.velocity = dx / Math.max(8, event.timeStamp - current.time);
    current.rotation += dx * 0.55;
    current.x = event.clientX;
    current.time = event.timeStamp;
    setRotation(current.rotation);
  }

  function endDrag(event: PointerEvent<SVGSVGElement>) {
    const current = drag.current;
    if (!current || current.id !== event.pointerId) return;
    drag.current = null;
    setDragging(false);
    if (current.moved && event.type === 'pointerup' && event.timeStamp - current.time < 90) {
      setRotation(current.rotation + Math.max(-66, Math.min(66, current.velocity * 45)));
    }
  }
  const raw = useId().replace(/:/g, '');
  const disc = useMemo(() => discInline({ sign, numeral, level: preview ? 2 : 0, serial }, {
    idPrefix: `w${raw}`, noFilters: true,
  }), [sign, numeral, preview, serial, raw]);
  const showDisc = state === 'today' || state === 'undeployed' || state === 'soldout';
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
      <g
        key={`s${i}`}
        transform={`translate(${x.toFixed(1)} ${y.toFixed(1)})`}
        ref={(node) => { nodes.current[i] = node; }}
        className={interactive ? styles.sign : undefined}
        role={interactive ? 'button' : undefined}
        tabIndex={interactive ? (active === i ? 0 : -1) : undefined}
        aria-label={interactive ? g.name : undefined}
        aria-current={on ? 'true' : undefined}
        onKeyDown={interactive ? (event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            setHover(i);
          } else step(event, i);
        } : undefined}
        onFocus={interactive ? () => { setFocused(i); setHover(i); } : undefined}
        onBlur={interactive ? () => setHover(null) : undefined}
        onPointerEnter={interactive ? () => setHover(i) : undefined}
        onPointerLeave={interactive ? (event) => { if (document.activeElement !== event.currentTarget) setHover(null); } : undefined}
        onClick={interactive ? (event) => event.currentTarget.focus() : undefined}
      >
        <circle r="48" className={styles.hit} />
        {on && <circle r="28" className={styles.litBg} />}
        <g transform="scale(.36)" className={on ? styles.glyphLit : styles.glyph} strokeLinecap="round" strokeLinejoin="round">
          <path d={g.d} fill={g.solid ? 'currentColor' : undefined} />
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
      ? `Wheel. Sign ${sName} and Numeral ${numeral} are highlighted. Tier ${tier}.`
      : `Wheel. ${centre?.a ?? ''}.`;

  return (
    <div className={`${styles.plate} bolted`} data-state={state}>
      <svg
        viewBox="-18 -18 636 636"
        className={styles.svg}
        data-interactive={interactive || undefined}
        role={interactive ? 'group' : 'img'}
        aria-label={label}
        onPointerDown={startDrag}
        onPointerMove={moveDrag}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onLostPointerCapture={endDrag}
        onPointerLeave={(event) => { if (!drag.current?.moved) endDrag(event); }}
      >
        <circle cx="300" cy="300" r="294" className={styles.disk} />
        <circle cx="300" cy="300" r="238" className={state === 'error' ? styles.ringErr : styles.ring} />
        <circle cx="300" cy="300" r="196" className={styles.ring} />
        <g className={dim && state !== 'soldout' ? styles.dimmed : undefined}>
          <g className={styles.dragRing} data-dragging={dragging || undefined} style={{ transform: `rotate(${rotation}deg)` }}>
            <ExposureRim />
            <g className={interactive ? styles.signRing : undefined}>{rings}</g>
          </g>
          {dots}
        </g>
        {showDisc ? (
          <g transform="translate(120 120) scale(.9)" className={state === 'soldout' ? styles.discDim : undefined} dangerouslySetInnerHTML={{ __html: disc }} />
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
        {preview && showDisc ? (
          <g>
            <rect x="215" y="446" width="170" height="34" className={styles.label} />
            <text x="300" y="469" textAnchor="middle" className={styles.centreText}>
              PREVIEW
            </text>
          </g>
        ) : null}
      </svg>
      <p className={`label ${styles.readout}`}>
        {hover === null ? (lit ? `Sign · ${sName}` : '12 Signs · 7 Numerals') : `Sign · ${SIGNS[hover]?.name}`}
        {preview && !showDisc ? ' · PREVIEW' : ''}
      </p>
    </div>
  );
});

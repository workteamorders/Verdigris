'use client';

import { useRef, type ReactNode } from 'react';
import { useMotion } from '@/lib/motion';
import styles from './TiltCard.module.css';

interface TiltProps {
  children: ReactNode;
  /** Largest tilt in degrees. */
  max?: number;
  /** Round sheen, for Discs. */
  round?: boolean;
  className?: string;
}

/** Pointer-driven tilt with a moving highlight. Transform and opacity only; off on touch and in the Minimal tier. */
export function TiltCard({ children, max = 8, round = true, className }: TiltProps) {
  const root = useRef<HTMLDivElement>(null);
  const frame = useRef(0);
  const { tier } = useMotion();
  const enabled = tier !== 'minimal';

  const set = (px: number, py: number) => {
    const el = root.current;
    if (!el) return;
    el.style.setProperty('--ry', `${((px - 0.5) * 2 * max).toFixed(2)}deg`);
    el.style.setProperty('--rx', `${((0.5 - py) * 2 * max).toFixed(2)}deg`);
    el.style.setProperty('--sx', `${(px * 100).toFixed(1)}%`);
    el.style.setProperty('--sy', `${(py * 100).toFixed(1)}%`);
  };

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!enabled || e.pointerType !== 'mouse' || !root.current) return;
    const r = root.current.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => set(px, py));
  };
  const onLeave = () => {
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => set(0.5, 0.5));
  };

  return (
    <div ref={root} className={`${styles.tilt} ${className ?? ''}`} onPointerMove={onMove} onPointerLeave={onLeave} data-enabled={enabled || undefined}>
      <div className={styles.inner}>
        {children}
        <span className={`${styles.sheen} ${round ? styles.round : ''}`} aria-hidden="true" />
      </div>
    </div>
  );
}

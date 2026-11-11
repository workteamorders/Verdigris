'use client';

import type { CSSProperties } from 'react';
import { useMotion } from '@/lib/motion';
import styles from './Strike.module.css';

const SPARKS = 9;

/** The Disc is struck like a coin: one flash, one ring, a few fine sparks, then stillness. Plays once on mount. */
export function Strike() {
  const { tier } = useMotion();
  if (tier === 'minimal') return null;
  return (
    <span className={styles.strike} aria-hidden="true">
      <span className={styles.flash} />
      <span className={styles.ring} />
      {Array.from({ length: SPARKS }, (_, i) => (
        <span key={i} className={styles.spark} style={{ '--a': `${i * (360 / SPARKS) + 14}deg`, '--d': `${6 + ((i * 7) % 5) * 1.1}rem`, '--k': `${(i % 3) * 60}ms` } as CSSProperties} />
      ))}
    </span>
  );
}

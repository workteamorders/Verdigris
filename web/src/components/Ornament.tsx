import type { ReactNode } from 'react';
import styles from './Ornament.module.css';

const ROMAN: ReadonlyArray<readonly [number, string]> = [
  [10, 'X'],
  [9, 'IX'],
  [5, 'V'],
  [4, 'IV'],
  [1, 'I'],
];

export function roman(n: number): string {
  let out = '';
  let left = n;
  for (const [v, s] of ROMAN) {
    while (left >= v) {
      out += s;
      left -= v;
    }
  }
  return out;
}

/** A divider: two engraved lines and a bolted diamond. Decorative. */
export function Rule() {
  return (
    <div className={styles.rule} role="presentation" aria-hidden="true">
      <span className={styles.line} />
      <svg viewBox="-12 -12 24 24" className={styles.mark}>
        <path d="M0 -10 L10 0 L0 10 L-10 0 Z" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <circle r="3" fill="currentColor" />
      </svg>
      <span className={styles.line} />
    </div>
  );
}

/** Chapter heading: numeral, label, title in the engraved face, then a rule. */
export function ChapterHead({ n, label, title, id, lead }: { n: number; label: string; title: string; id?: string; lead?: ReactNode }) {
  return (
    <header className={styles.chapter} data-reveal>
      <p className={styles.kicker}>
        <span className={styles.numeral}>{roman(n)}</span>
        <span className="label">Chapter {roman(n)} · {label}</span>
      </p>
      <h2 id={id}>{title}</h2>
      {lead ? <p className={styles.lead}>{lead}</p> : null}
      <Rule />
    </header>
  );
}

/** A caption under artwork, in the manner of an engraved plate. */
export function Plate({ n, children }: { n: number; children: ReactNode }) {
  return (
    <p className={styles.plate}>
      <span className="label">Plate {roman(n)}</span> {children}
    </p>
  );
}

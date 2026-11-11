'use client';

import { useId, useState } from 'react';
import { Disc } from './Disc';
import { Badge } from './Badge';
import { LEVEL_NAMES, type PatinaLevel } from '@/lib/patina';
import styles from './PatinaScrubber.module.css';

interface Props {
  /** One line per level, e.g. "14 days unmoved". */
  when: readonly string[];
  sign?: number;
  numeral?: number;
  serial?: number;
}

/** Drag the slider and the verdigris spreads on a Disc. Native range input, so keyboard and screen readers work. */
export function PatinaScrubber({ when, sign = 5, numeral = 3, serial = 7 }: Props) {
  const id = useId();
  const [level, setLevel] = useState<PatinaLevel>(2);
  const [prev, setPrev] = useState<PatinaLevel | null>(null);
  const name = LEVEL_NAMES[level];

  return (
    <div className={styles.wrap}>
      <div className={styles.stage}>
        {prev !== null ? (
          <div className={styles.under}>
            <Disc sign={sign} numeral={numeral} serial={serial} level={prev} />
          </div>
        ) : null}
        <div key={level} className={styles.over} onAnimationEnd={() => setPrev(null)}>
          <Disc sign={sign} numeral={numeral} serial={serial} level={level} />
        </div>
      </div>
      <div className={styles.controls}>
        <p className="label">EXAMPLE Disc</p>
        <label htmlFor={id} className={styles.heading}>
          <Badge tone="patina">{`Level ${level}`}</Badge> {name}
        </label>
        <input
          id={id}
          className={styles.range}
          type="range"
          min={0}
          max={4}
          step={1}
          value={level}
          aria-valuetext={`Level ${level}, ${name}, ${when[level] ?? ''}`}
          onChange={(e) => {
            const v = Number(e.target.value) as PatinaLevel;
            setPrev(level);
            setLevel(v);
          }}
        />
        <ol className={styles.marks} aria-hidden="true">
          {LEVEL_NAMES.map((n, i) => (
            <li key={n} data-on={i === level || undefined}>
              {i}
            </li>
          ))}
        </ol>
        <p className="dim">{when[level]}. Any move would send it back to level 0.</p>
      </div>
    </div>
  );
}

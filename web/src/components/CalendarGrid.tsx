'use client';

import { useState } from 'react';
import { SIGNS, numeralOfSlot, signOfSlot, tierOfNumeral } from '@/lib/signs';
import { TIER_CAP } from '@/lib/chain-data';
import styles from './CalendarGrid.module.css';

const days = Array.from({ length: 84 }, (_, day) => day).sort((a, b) =>
  signOfSlot(a) - signOfSlot(b) || numeralOfSlot(a) - numeralOfSlot(b));

export function CalendarGrid({ today = null, selected, minted, onSelect, disabled = false }: {
  today?: number | null;
  selected: number;
  minted?: readonly number[];
  onSelect: (day: number) => void;
  disabled?: boolean;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const [focus, setFocus] = useState<number | null>(null);
  const highlight = hover ?? focus;
  return (
    <>
      <div className={styles.head} aria-hidden="true">
        {Array.from({ length: 7 }, (_, i) => (
          <span key={i} className="label" data-highlight={highlight !== null && numeralOfSlot(highlight) === i + 1 || undefined}>
            N{i + 1}
          </span>
        ))}
      </div>
      <ol className={styles.grid} aria-label="Count Days grouped by Sign row and Numeral column">
        {days.map((day) => {
          const sign = signOfSlot(day);
          const numeral = numeralOfSlot(day);
          const glyph = SIGNS[sign];
          const tier = tierOfNumeral(numeral);
          const cap = TIER_CAP[tier];
          const count = minted?.[day];
          const state = today === null ? 'unknown' : day < today ? 'past' : day === today ? 'today' : 'future';
          return (
            <li key={day}>
              <button
                type="button"
                className={styles.cell}
                disabled={disabled}
                data-state={state}
                data-tier={tier}
                data-selected={day === selected || undefined}
                data-highlight={highlight !== null && (signOfSlot(highlight) === sign || numeralOfSlot(highlight) === numeral) || undefined}
                aria-current={day === today ? 'date' : undefined}
                aria-pressed={day === selected}
                aria-label={`Day ${day + 1}, Sign ${glyph?.name}, Numeral ${numeral}, ${tier}${day === today ? ', today' : ''}${count === undefined ? '' : `, ${count} of ${cap} minted`}`}
                onClick={() => onSelect(day)}
                onPointerEnter={(event) => { if (event.pointerType !== 'touch') setHover(day); }}
                onPointerLeave={() => setHover(null)}
                onFocus={() => setFocus(day)}
                onBlur={() => setFocus(null)}
              >
                <span className={styles.num}>{day + 1}</span>
                <svg viewBox="-44 -44 88 88" className={styles.glyph} aria-hidden="true">
                  <path d={glyph?.d ?? ''} fill={glyph?.solid ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {count !== undefined && (
                  <span className={styles.bar} aria-hidden="true">
                    <span style={{ transform: `scaleX(${Math.min(1, count / cap)})` }} data-full={count >= cap || undefined} />
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ol>
    </>
  );
}

import styles from './Ticker.module.css';

const FACTS = ['84 Days', '12 Signs', '7 Numerals', 'Drawn on-chain', 'No token', 'No admin keys', 'At most 1,632 Discs', 'Patina follows the clock'] as const;

/** A slow strip of plain facts. CSS only; pauses on hover and focus; still under reduced motion. */
export function Ticker() {
  return (
    <div className={styles.ticker} role="group" aria-label="Facts about the Count">
      <ul className={styles.track}>
        {FACTS.map((f) => (
          <li key={f}>{f}</li>
        ))}
        {FACTS.map((f) => (
          <li key={`${f}-copy`} aria-hidden="true">
            {f}
          </li>
        ))}
      </ul>
    </div>
  );
}

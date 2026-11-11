import { formatCountdown } from '@/lib/format';
import styles from './Motion.module.css';

const messages = {
  loading: 'Reading…',
  empty: 'No upcoming Day',
  error: 'Clock unavailable',
  disabled: 'Clock paused',
};

export function CountClock({ seconds, state }: { seconds?: number; state?: keyof typeof messages }) {
  if (state || seconds === undefined) return <span className={styles.clock}>{messages[state ?? 'empty']}</span>;
  return (
    <span className={styles.clock} data-live={seconds > 0 || undefined}>
      <span className={styles.dial} aria-hidden="true" />
      <time dateTime={`PT${Math.max(0, Math.floor(seconds))}S`}>{formatCountdown(seconds)}</time>
    </span>
  );
}

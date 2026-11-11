import type { ReactNode } from 'react';
import { Icon } from './Icon';
import styles from './States.module.css';

/** Skeleton: the same shape as the content it replaces. */
export function Skeleton({ width, height, round }: { width?: string; height?: string; round?: boolean }) {
  return <span className={`${styles.skeleton} ${round ? styles.round : ''}`} style={{ width, height }} aria-hidden="true" />;
}

export function DiscSkeleton() {
  return (
    <div role="status" aria-label="Loading Disc" className={styles.discSkel}>
      <Skeleton round />
      <span className="visually-hidden">Loading Disc</span>
    </div>
  );
}

interface EmptyProps {
  title: string;
  children: ReactNode;
  action?: ReactNode;
}

/** Empty: a small drawing, one sentence, one button. */
export function EmptyState({ title, children, action }: EmptyProps) {
  return (
    <div className={styles.state}>
      <svg className={styles.art} viewBox="0 0 96 96" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="48" cy="48" r="40" strokeDasharray="4 6" />
        <circle cx="48" cy="48" r="26" />
        <path d="M48 36V60M36 48H60" strokeLinecap="square" />
      </svg>
      <h2>{title}</h2>
      <p>{children}</p>
      {action}
    </div>
  );
}

interface ErrorProps {
  title: string;
  /** What happened. */
  what: string;
  /** Whether data, money or assets are safe. */
  safe: string;
  /** What can be done now. */
  next: ReactNode;
}

/** Error: what happened, whether money and assets are safe, what to do now. */
export function ErrorState({ title, what, safe, next }: ErrorProps) {
  return (
    <div className={`${styles.state} ${styles.error}`} role="alert">
      <Icon name="alert" size={32} />
      <h2>{title}</h2>
      <p>{what}</p>
      <p className={styles.safe}>
        <Icon name="check" size={16} /> {safe}
      </p>
      {next}
    </div>
  );
}

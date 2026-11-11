import type { ReactNode } from 'react';
import { Frame } from './Frame';
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
    <Frame frame="inlay" className={styles.frame} faceClassName={styles.state}>
      <svg className={styles.art} viewBox="0 0 96 96" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M48 5L68 13L83 28L91 48L83 68L68 83L48 91L28 83L13 68L5 48L13 28L28 13Z" />
        <circle cx="48" cy="48" r="36" />
        <circle cx="48" cy="48" r="29" strokeDasharray="2 5" />
        <path d="M48 24L61 35L72 48L61 61L48 72L35 61L24 48L35 35ZM35 48Q48 33 61 48Q48 63 35 48ZM48 40V56" />
        <circle cx="48" cy="48" r="4" />
      </svg>
      <h2>{title}</h2>
      <p>{children}</p>
      {action}
    </Frame>
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
    <Frame frame="lozenge" className={`${styles.frame} ${styles.error}`} faceClassName={styles.state} role="alert">
      <Icon name="alert" size={32} />
      <h2>{title}</h2>
      <p>{what}</p>
      <p className={styles.safe}>
        <Icon name="check" size={16} /> {safe}
      </p>
      {next}
    </Frame>
  );
}

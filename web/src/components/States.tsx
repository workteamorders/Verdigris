import type { ReactNode } from 'react';
import { RackArtwork } from './Artwork';
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
  heading?: 'h2' | 'h3';
  children: ReactNode;
  action?: ReactNode;
}

/** Empty: a small drawing, one sentence, one button. */
export function EmptyState({ title, heading: Heading = 'h2', children, action }: EmptyProps) {
  return (
    <div className={styles.state}>
      <RackArtwork kind="empty" compact />
      <Heading className={styles.title}>{title}</Heading>
      <p>{children}</p>
      {action}
    </div>
  );
}

interface ErrorProps {
  title: string;
  heading?: 'h2' | 'h3';
  /** What happened. */
  what: string;
  /** Whether data, money or assets are safe. */
  safe: string;
  /** What can be done now. */
  next: ReactNode;
}

/** Error: what happened, whether money and assets are safe, what to do now. */
export function ErrorState({ title, heading: Heading = 'h2', what, safe, next }: ErrorProps) {
  return (
    <div className={`${styles.state} ${styles.error}`} role="alert">
      <RackArtwork kind="error" compact />
      <Heading className={styles.title}>{title}</Heading>
      <p>{what}</p>
      <p className={styles.safe}>
        <Icon name="check" size={16} /> {safe}
      </p>
      {next}
    </div>
  );
}

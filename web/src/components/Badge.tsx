import type { ReactNode } from 'react';
import { Icon, type IconName } from './Icon';
import styles from './Badge.module.css';

export type BadgeTone = 'neutral' | 'success' | 'danger' | 'warning' | 'info' | 'patina';

const ICONS: Record<BadgeTone, IconName> = { neutral: 'info', success: 'check', danger: 'x', warning: 'alert', info: 'info', patina: 'clock' };

/** Meaning is carried by icon and label as well as colour. A badge never claims something the system has not verified. */
export function Badge({ tone = 'neutral', children }: { tone?: BadgeTone; children: ReactNode }) {
  return (
    <span className={`${styles.badge} ${styles[tone]}`}>
      <Icon name={ICONS[tone]} size={14} />
      {children}
    </span>
  );
}

import type { ReactNode } from 'react';
import { Icon, type IconName } from './Icon';
import styles from './Banner.module.css';

type Tone = 'info' | 'warning' | 'danger' | 'success';
const ICONS: Record<Tone, IconName> = { info: 'info', warning: 'alert', danger: 'alert', success: 'check' };

/** Site-wide notice: TEST CLOCK, not deployed, view-only region, wrong network. */
export function Banner({ tone, title, children, action }: { tone: Tone; title: string; children: ReactNode; action?: ReactNode }) {
  return (
    <div className={`${styles.banner} ${styles[tone]}`} role={tone === 'danger' || tone === 'warning' ? 'alert' : 'status'}>
      <Icon name={ICONS[tone]} />
      <p>
        <strong>{title}</strong> {children}
      </p>
      {action}
    </div>
  );
}

import { useId, type ReactNode } from 'react';
import styles from './Tooltip.module.css';

/** Hover and focus both reveal it. It never holds the only copy of important information. */
export function Tooltip({ text, children }: { text: string; children: ReactNode }) {
  const id = useId();
  return (
    <span className={styles.wrap}>
      <span className={styles.trigger} tabIndex={0} aria-describedby={id}>
        {children}
      </span>
      <span role="tooltip" id={id} className={styles.tip}>
        {text}
      </span>
    </span>
  );
}

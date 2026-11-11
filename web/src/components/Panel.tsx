import Link from 'next/link';
import type { ReactNode } from 'react';
import styles from './Panel.module.css';

interface PanelProps {
  children: ReactNode;
  as?: 'div' | 'section' | 'article';
  className?: string;
  /** Styleguide only: pin a pseudo-state. */
  forceState?: 'hover' | 'focus';
}

/** Static panel: a bolted slab. */
export function Panel({ children, as: Tag = 'div', className }: PanelProps) {
  return <Tag className={[styles.panel, 'bolted', className].filter(Boolean).join(' ')}>{children}</Tag>;
}

interface LinkPanelProps extends PanelProps {
  href: string;
  title: string;
}

/** Interactive panel: ONE target with ONE primary link (the title). The rest of the card is covered by that link. */
export function LinkPanel({ children, href, title, forceState, className }: LinkPanelProps) {
  return (
    <article className={[styles.panel, styles.interactive, 'bolted', className].filter(Boolean).join(' ')} data-state={forceState}>
      <h3 className={styles.title}>
        <Link href={href} className={styles.cover}>
          {title}
        </Link>
      </h3>
      {children}
    </article>
  );
}

import Link from 'next/link';
import type { ReactNode } from 'react';
import { Frame, type FrameName } from './Frame';
import styles from './Panel.module.css';

interface PanelProps {
  children: ReactNode;
  as?: 'div' | 'section' | 'article';
  className?: string;
  /** Styleguide only: pin a pseudo-state. */
  forceState?: 'hover' | 'focus';
  /** Which engraved frame to use. Neighbouring panels should differ. */
  frame?: FrameName;
}

/** Static panel: a slab in a cast-bronze frame. */
export function Panel({ children, as = 'div', className, frame }: PanelProps) {
  return (
    <Frame as={as} frame={frame} className={[styles.panel, className].filter(Boolean).join(' ')} data-reveal>
      {children}
    </Frame>
  );
}

interface LinkPanelProps extends PanelProps {
  href: string;
  title: string;
}

/** Interactive panel: ONE target with ONE primary link (the title). The rest of the card is covered by that link. */
export function LinkPanel({ children, href, title, forceState, className, frame }: LinkPanelProps) {
  return (
    <Frame as="article" frame={frame} linked className={[styles.panel, styles.interactive, className].filter(Boolean).join(' ')} data-state={forceState}>
      <h3 className={styles.title}>
        <Link href={href} className={styles.cover}>
          {title}
        </Link>
      </h3>
      {children}
    </Frame>
  );
}

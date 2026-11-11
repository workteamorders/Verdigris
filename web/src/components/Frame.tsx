import type { HTMLAttributes, ReactNode } from 'react';
import { FrameEngraving } from './FrameEngraving';
import styles from './Frame.module.css';

/** Eight cast-bronze frames. Each pairs an engraved rail with its own stamp. */
export const FRAMES = ['reed', 'bead', 'dentil', 'rope', 'lozenge', 'moulding', 'scale', 'inlay'] as const;
export type FrameName = (typeof FRAMES)[number];

/** Picks frames in turn, so neighbouring boxes never share one. */
export function frameAt(i: number): FrameName {
  return FRAMES[((i % FRAMES.length) + FRAMES.length) % FRAMES.length] ?? 'reed';
}

interface FrameProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
  as?: 'div' | 'section' | 'article';
  frame?: FrameName;
  faceClassName?: string;
  compact?: boolean;
  /** Lets a link card lift its face on hover. */
  linked?: boolean;
  'data-state'?: string;
  'data-reveal'?: boolean;
}

/** A framed box. The border is decorative (aria-hidden); the face holds the content. */
export function Frame({ children, as: Tag = 'div', frame = 'reed', className, faceClassName, linked, compact = false, ...rest }: FrameProps) {
  return (
    <Tag className={[styles.frame, linked ? styles.linked : '', className].filter(Boolean).join(' ')} data-frame={frame} data-compact={compact || undefined} {...rest}>
      <span className={styles.grain} aria-hidden="true" />
      <div className={[styles.face, faceClassName].filter(Boolean).join(' ')}>{children}</div>
      <FrameEngraving frame={frame} compact={compact} />
    </Tag>
  );
}

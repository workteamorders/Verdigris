'use client';

import { useEffect, useId, useRef, type ReactNode } from 'react';
import { Button } from './Button';
import { FrameEngraving } from './FrameEngraving';
import styles from './Dialog.module.css';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  /** Buttons. The primary action sits on the right, always. */
  actions?: ReactNode;
  /** 'drawer' slides in from the edge (mobile navigation). Default is a modal that becomes a bottom sheet on phones. */
  variant?: 'modal' | 'drawer';
}

/**
 * Built on the native <dialog>: the browser gives the modal focus trap, Esc to close, an inert background,
 * and returns focus to the trigger. We add the scroll lock, a visible close button and light-dismiss on the backdrop.
 */
export function Dialog({ open, onClose, title, children, actions, variant = 'modal' }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
    document.documentElement.style.overflow = open ? 'hidden' : '';
    return () => {
      document.documentElement.style.overflow = '';
    };
  }, [open]);

  return (
    <dialog
      ref={ref}
      className={`${styles.dialog} ${variant === 'drawer' ? styles.drawer : styles.modal} bolted`}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      <FrameEngraving frame={variant === 'drawer' ? 'inlay' : 'lozenge'} />
      <div className={styles.inner}>
        <header className={styles.head}>
          <h2 id={titleId} className={styles.title}>
            {title}
          </h2>
          <Button variant="icon" icon="x" aria-label="Close" onClick={onClose} />
        </header>
        <div className={styles.body}>{children}</div>
        {actions ? <footer className={styles.actions}>{actions}</footer> : null}
      </div>
    </dialog>
  );
}

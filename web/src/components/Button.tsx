'use client';

import Link from 'next/link';
import type { ButtonHTMLAttributes, PointerEvent, ReactNode } from 'react';
import { Icon, type IconName } from './Icon';
import styles from './Button.module.css';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'icon';
type Size = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: IconName;
  /** Styleguide only: pin a pseudo-state so it can be shown statically. */
  forceState?: 'hover' | 'active' | 'focus';
  children?: ReactNode;
}

export function Button({ variant = 'secondary', size = 'md', loading = false, icon, forceState, disabled, children, className, type = 'button', onClick, onPointerMove, onPointerLeave, ...rest }: ButtonProps) {
  function move(event: PointerEvent<HTMLButtonElement>) {
    onPointerMove?.(event);
    if (loading || disabled || event.pointerType !== 'mouse' || !matchMedia('(hover: hover) and (prefers-reduced-motion: no-preference)').matches) return;
    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();
    button.style.setProperty('--magnet-x', String((event.clientX - rect.left) / rect.width - 0.5));
    button.style.setProperty('--magnet-y', String((event.clientY - rect.top) / rect.height - 0.5));
  }
  const cls = [styles.btn, styles[variant], styles[size], className].filter(Boolean).join(' ');
  return (
    <button
      type={type}
      className={cls}
      data-state={forceState}
      data-loading={loading || undefined}
      disabled={disabled}
      aria-busy={loading || undefined}
      aria-disabled={loading || undefined}
      onClick={loading ? (e) => e.preventDefault() : onClick}
      onPointerMove={move}
      onPointerLeave={(event) => {
        event.currentTarget.style.removeProperty('--magnet-x');
        event.currentTarget.style.removeProperty('--magnet-y');
        onPointerLeave?.(event);
      }}
      {...rest}
    >
      {/* Keeps the width fixed while loading: the label stays, the spinner overlays. */}
      <span className={styles.content}>
        {icon ? <Icon name={icon} /> : null}
        {children}
      </span>
      {loading ? (
        <span className={styles.spin} aria-hidden="true">
          <Icon name="spinner" />
        </span>
      ) : null}
    </button>
  );
}

export function ButtonLink({ href, children, variant = 'secondary', size = 'md' }: {
  href: string; children: ReactNode; variant?: 'primary' | 'secondary'; size?: Size;
}) {
  return <Link href={href} className={`${styles.btn} ${styles[variant]} ${styles[size]} ${styles.link}`}>{children}</Link>;
}

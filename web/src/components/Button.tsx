'use client';

import type { ButtonHTMLAttributes, ReactNode } from 'react';
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

export function Button({ variant = 'secondary', size = 'md', loading = false, icon, forceState, disabled, children, className, type = 'button', onClick, ...rest }: ButtonProps) {
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

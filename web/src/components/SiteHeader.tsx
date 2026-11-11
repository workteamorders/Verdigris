'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import { Button } from './Button';
import { Dialog } from './Dialog';
import { Badge } from './Badge';
import styles from './SiteHeader.module.css';

export const NAV = [
  { href: '/', label: 'Home' },
  { href: '/mint/', label: 'Mint' },
  { href: '/calendar/', label: 'Calendar' },
  { href: '/gallery/', label: 'Gallery' },
  { href: '/vault/', label: 'Vault' },
  { href: '/rules/', label: 'Rules' },
] as const;

interface SiteHeaderProps {
  /** Shown as a badge. Never "verified": only what the system actually knows. */
  status?: { tone: 'warning' | 'info' | 'success'; label: string };
  /** Replaces the static Connect button (the app passes the live wallet control). */
  wallet?: ReactNode;
}

export function SiteHeader({ status, wallet }: SiteHeaderProps) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const isActive = (href: string): boolean => (href === '/' ? path === '/' : path.startsWith(href));
  return (
    <header className={styles.header}>
      <div className={`container ${styles.bar}`}>
        <Link href="/" className={styles.mark}>
          Verdigris
        </Link>
        <nav aria-label="Main" className={styles.nav}>
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className={styles.link} aria-current={isActive(n.href) ? 'page' : undefined}>
              {n.label}
            </Link>
          ))}
        </nav>
        <div className={styles.right}>
          {status ? (
            <span className={styles.statusWide}>
              <Badge tone={status.tone}>{status.label}</Badge>
            </span>
          ) : null}
          <span className={styles.wallet}>
            {wallet ?? (
              <Button variant="secondary" icon="wallet">
                Connect wallet
              </Button>
            )}
          </span>
          <span className={styles.menu}>
            <Button variant="icon" icon="menu" aria-label="Open menu" aria-haspopup="dialog" onClick={() => setOpen(true)} />
          </span>
        </div>
      </div>
      {status ? (
        <div className={`container ${styles.statusStrip}`}>
          <Badge tone={status.tone}>{status.label}</Badge>
        </div>
      ) : null}
      <Dialog open={open} onClose={() => setOpen(false)} title="Menu" variant="drawer">
        <nav aria-label="Main, mobile" className={styles.drawerNav}>
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className={styles.drawerLink} aria-current={isActive(n.href) ? 'page' : undefined} onClick={() => setOpen(false)}>
              {n.label}
            </Link>
          ))}
        </nav>
        {wallet ?? (
          <Button variant="secondary" icon="wallet">
            Connect wallet
          </Button>
        )}
      </Dialog>
    </header>
  );
}

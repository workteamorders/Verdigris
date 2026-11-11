import type { Metadata } from 'next';
import styles from '@/components/Button.module.css';
import { RackArtwork } from '@/components/Artwork';
import { SiteFooter } from '@/components/SiteFooter';

export const metadata: Metadata = { title: 'Offline', robots: { index: false } };

export default function Page() {
  return (
    <>
      <main id="main" tabIndex={-1} className="container" style={{ padding: 'var(--space-8) var(--gutter)', display: 'grid', gap: 'var(--space-5)', justifyItems: 'start', minHeight: '70dvh', outline: 'none' }}>
        <RackArtwork kind="offline" />
        <p className="label">Offline</p>
        <h1>You are not connected.</h1>
        <p className="dim">The page you asked for needs the network. Nothing was sent or charged. When your connection returns, try again.</p>
        <a className={`${styles.btn} ${styles.primary} ${styles.md} ${styles.link}`} href="/">Try again</a>
      </main>
      <SiteFooter />
    </>
  );
}

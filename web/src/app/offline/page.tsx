import type { Metadata } from 'next';
import { Button } from '@/components/Button';
import { Disc } from '@/components/Disc';
import { SiteFooter } from '@/components/SiteFooter';

export const metadata: Metadata = { title: 'Offline', robots: { index: false } };

export default function Page() {
  return (
    <>
      <main id="main" tabIndex={-1} className="container" style={{ padding: 'var(--space-8) var(--gutter)', display: 'grid', gap: 'var(--space-5)', justifyItems: 'start', minHeight: '70dvh', outline: 'none' }}>
        <div style={{ width: '10rem' }}>
          <Disc sign={0} numeral={1} serial={1} level={0} />
        </div>
        <p className="label">Offline</p>
        <h1>You are not connected.</h1>
        <p className="dim">The page you asked for needs the network. Nothing was sent or charged. When your connection returns, try again.</p>
        <a href="/">
          <Button variant="primary">Try again</Button>
        </a>
      </main>
      <SiteFooter />
    </>
  );
}

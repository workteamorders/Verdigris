import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { Button } from '@/components/Button';
import { Disc } from '@/components/Disc';

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main id="main" tabIndex={-1} className="container" style={{ padding: 'var(--space-8) var(--gutter)', display: 'grid', gap: 'var(--space-5)', justifyItems: 'start', minHeight: '60dvh', outline: 'none' }}>
        <div style={{ width: '10rem' }}>
          <Disc sign={5} numeral={3} serial={7} level={4} />
        </div>
        <p className="label">Error 404</p>
        <h1>This page has weathered away.</h1>
        <p className="dim">There is nothing at this address. Nothing was lost: no payment or transaction is involved in looking for a page.</p>
        <Link href="/">
          <Button variant="primary">Back to the wheel</Button>
        </Link>
      </main>
      <SiteFooter />
    </>
  );
}

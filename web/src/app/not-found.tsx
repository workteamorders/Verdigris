import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { ButtonLink } from '@/components/Button';
import { RackArtwork } from '@/components/Artwork';

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main id="main" tabIndex={-1} className="container" style={{ padding: 'var(--space-8) var(--gutter)', display: 'grid', gap: 'var(--space-5)', justifyItems: 'start', minHeight: '60dvh', outline: 'none' }}>
        <RackArtwork kind="missing" />
        <p className="label">Error 404</p>
        <h1>This page has weathered away.</h1>
        <p className="dim">There is nothing at this address. Nothing was lost: no payment or transaction is involved in looking for a page.</p>
        <ButtonLink href="/" variant="primary">Back to the wheel</ButtonLink>
      </main>
      <SiteFooter />
    </>
  );
}

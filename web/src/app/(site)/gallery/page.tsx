import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PageHead } from '@/components/Layout';
import { activeDeployment } from '@/lib/deployments';
import { GalleryPlaceholder } from './GalleryPlaceholder';
import { GalleryView } from './GalleryView';

export const metadata: Metadata = {
  title: 'Gallery',
  description: 'Every Disc minted so far, drawn by the contract, with its current Patina.',
};

export default function Page() {
  return (
    <>
      <PageHead eyebrow="Gallery" title="Every Disc" lead="Each image below is drawn from what the contract reports right now, so the Patina you see is the Patina it has." />
      <Suspense fallback={<GalleryPlaceholder deployed={Boolean(activeDeployment())} />}>
        <GalleryView />
      </Suspense>
    </>
  );
}

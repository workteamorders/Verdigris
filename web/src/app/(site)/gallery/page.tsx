import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PageHead } from '@/components/Layout';
import { Skeleton } from '@/components/States';
import { GalleryView } from './GalleryView';

export const metadata: Metadata = {
  title: 'Gallery',
  description: 'Every Disc minted so far, drawn by the contract, with its current Patina.',
};

export default function Page() {
  return (
    <>
      <PageHead eyebrow="Gallery" title="Every Disc" lead="Each image below is drawn from what the contract reports right now, so the Patina you see is the Patina it has." />
      <Suspense
        fallback={
          <div className="container">
            <Skeleton height="24rem" />
          </div>
        }
      >
        <GalleryView />
      </Suspense>
    </>
  );
}

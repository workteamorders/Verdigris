import { Frame } from '@/components/Frame';
import { Section } from '@/components/Layout';
import { DiscSkeleton, EmptyState } from '@/components/States';
import styles from './GalleryView.module.css';

export const GALLERY_PAGE_SIZE = 12;

export function GalleryGridSkeleton({ count = GALLERY_PAGE_SIZE }: { count?: number }) {
  return Array.from({ length: count }, (_, index) => (
    <li key={index} aria-hidden="true">
      <div className={styles.card}>
        <Frame compact><DiscSkeleton /></Frame>
        <span className={styles.meta}><span className="mono">&nbsp;</span></span>
      </div>
    </li>
  ));
}

export function GalleryPlaceholder({ deployed }: { deployed: boolean }) {
  return (
    <Section>
      {deployed ? (
        <>
          <p className="dim" role="status">Reading the chain…</p>
          <ul className={styles.grid} aria-hidden="true"><GalleryGridSkeleton /></ul>
        </>
      ) : (
        <EmptyState title="No Discs to show yet">No deployment is connected to this build. Once the Count opens, every Disc appears here.</EmptyState>
      )}
    </Section>
  );
}

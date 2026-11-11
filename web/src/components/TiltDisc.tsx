'use client';

import { memo, useEffect, useRef, useState, type ComponentProps, type PointerEvent } from 'react';
import { Disc } from './Disc';
import { DiscSkeleton } from './States';
import { RackArtwork } from './Artwork';
import styles from './Motion.module.css';

type TiltDiscProps = ComponentProps<typeof Disc> & {
  state?: 'ready' | 'disabled' | 'loading' | 'empty' | 'error';
};

export const TiltDisc = memo(function TiltDisc({ state = 'ready', level = 0, ...disc }: TiltDiscProps) {
  const surface = useRef<HTMLDivElement>(null);
  const frame = useRef(0);
  const [shown, setShown] = useState(level);
  const [previous, setPrevious] = useState<typeof level | null>(null);

  if (shown !== level) {
    setPrevious(shown);
    setShown(level);
  }

  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  function reset() {
    cancelAnimationFrame(frame.current);
    surface.current?.removeAttribute('style');
    surface.current?.removeAttribute('data-tilting');
  }

  function tilt(event: PointerEvent<HTMLDivElement>) {
    if (state !== 'ready' || event.pointerType !== 'mouse' || !matchMedia('(hover: hover) and (prefers-reduced-motion: no-preference)').matches) return;
    const { clientX, clientY } = event;
    const target = event.currentTarget;
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => {
      const rect = target.getBoundingClientRect();
      const x = (clientX - rect.left) / rect.width - 0.5;
      const y = (clientY - rect.top) / rect.height - 0.5;
      surface.current?.style.setProperty('--tilt-x', `${-y * 2}`);
      surface.current?.style.setProperty('--tilt-y', `${x * 2}`);
      surface.current?.style.setProperty('--shine-x', `${x * 70}%`);
      surface.current?.style.setProperty('--shine-y', `${y * 70}%`);
      surface.current?.setAttribute('data-tilting', '');
    });
  }

  if (state === 'loading') return <DiscSkeleton />;
  if (state === 'empty' || state === 'error') {
    return <div className={styles.discUnavailable}><RackArtwork kind={state} /><p>{state === 'empty' ? 'No Disc to display' : 'Disc unavailable'}</p></div>;
  }

  return (
    <div className={styles.discStage} onPointerMove={tilt} onPointerLeave={reset} onPointerCancel={reset} data-disabled={state === 'disabled' || undefined}>
      <div ref={surface} className={styles.discSurface}>
        <Disc {...disc} level={level} />
        {previous !== null && (
          <div key={level} className={styles.previous} aria-hidden="true" onAnimationEnd={() => setPrevious(null)}>
            <Disc {...disc} level={previous} noFilters />
          </div>
        )}
        <div className={styles.shineClip} aria-hidden="true"><div className={styles.shine} /></div>
      </div>
    </div>
  );
});

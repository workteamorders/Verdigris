'use client';

import { useEffect, useRef, type CSSProperties } from 'react';
import styles from './AmbientFireflies.module.css';

const DWELL_MS = 1500;
const FLIES = [
  [17, 34], [58, 54], [103, 67], [149, 42], [194, 64],
  [235, 38], [276, 59], [316, 47], [348, 73],
] as const;

export function AmbientFireflies({ economy }: { economy: boolean }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const swarm = ref.current;
    if (!swarm) return;
    let timer = 0;
    let point: { x: number; y: number } | undefined;

    function hide() {
      window.clearTimeout(timer);
      swarm?.removeAttribute('data-visible');
      point = undefined;
    }

    function move(event: PointerEvent) {
      if (!swarm || event.pointerType !== 'mouse' || !event.isPrimary) return;
      const { clientX: x, clientY: y } = event;
      if (point?.x === x && point.y === y) return;
      hide();
      point = { x, y };
      timer = window.setTimeout(() => {
        if (document.hidden) return;
        swarm.style.setProperty('--swarm-x', `${x}px`);
        swarm.style.setProperty('--swarm-y', `${y}px`);
        swarm.setAttribute('data-visible', '');
      }, DWELL_MS);
    }

    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('pointerdown', hide, { passive: true });
    window.addEventListener('scroll', hide, { passive: true });
    window.addEventListener('blur', hide);
    document.documentElement.addEventListener('pointerleave', hide);
    document.addEventListener('visibilitychange', hide);
    return () => {
      hide();
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerdown', hide);
      window.removeEventListener('scroll', hide);
      window.removeEventListener('blur', hide);
      document.documentElement.removeEventListener('pointerleave', hide);
      document.removeEventListener('visibilitychange', hide);
    };
  }, []);

  return (
    <div className={styles.swarm} ref={ref} aria-hidden="true">
      <div className={styles.orbit}>
        {FLIES.slice(0, economy ? 5 : FLIES.length).map(([angle, radius], index) => (
          <span
            className={styles.fly}
            key={angle}
            style={{ '--angle': `${angle}deg`, '--radius': `${radius}px`, '--index': index } as CSSProperties}
          >
            <span className={`${styles.wing} ${styles.upperWing}`} />
            <span className={`${styles.wing} ${styles.lowerWing}`} />
            <span className={styles.body} />
            <span className={styles.lantern} />
            <span className={styles.head} />
          </span>
        ))}
      </div>
    </div>
  );
}

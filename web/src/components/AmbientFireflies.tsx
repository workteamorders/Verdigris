'use client';

import { useEffect, useRef, type CSSProperties } from 'react';
import styles from './AmbientFireflies.module.css';

const DWELL_MS = 1500;
// Independent closed curves with different shapes and headings at their joins.
const FLIGHTS = [
  ['M -49 -25 C -22 -45 18 -26 9 -4 S -73 -8 -49 -25 Z', -59, -35],
  ['M 35 -59 C 71 -63 76 -24 41 -29 S -3 -54 35 -59 Z', 26, -53],
  ['M -65 41 C -57 14 -13 14 -21 47 S -73 69 -65 41 Z', -58, 35],
  ['M 40 34 C 82 4 93 65 60 61 S 2 61 40 34 Z', 63, 33],
  ['M -12 24 C 2 -13 54 -3 34 18 S -23 55 -12 24 Z', -28, 56],
  ['M 17 -12 C 25 -38 81 -27 71 -4 S 7 20 17 -12 Z', 60, -24],
  ['M -67 -59 C -34 -81 -27 -43 -47 -31 S -99 -38 -67 -59 Z', -46, -58],
  ['M 14 68 C -4 47 27 29 41 54 S 32 90 14 68 Z', 17, 64],
  ['M -30 -1 C -38 -22 -2 -39 1 -17 S -22 22 -30 -1 Z', -49, 14],
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
        const arrivals = Array.from(swarm.children) as HTMLElement[];
        for (let index = arrivals.length - 1; index > 0; index--) {
          const next = Math.floor(Math.random() * (index + 1));
          [arrivals[index], arrivals[next]] = [arrivals[next]!, arrivals[index]!];
        }
        arrivals.forEach((fly, index) => {
          fly.style.setProperty('--arrival-order', String(index));
          fly.style.setProperty('--flight-phase', String(Math.random()));
        });
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
      {FLIGHTS.slice(0, economy ? 5 : FLIGHTS.length).map(([path, entryX, entryY], index) => (
        <span
          className={styles.arrival}
          key={path}
          style={{
            '--flight-path': `path("${path}")`,
            '--entry-x': `${entryX}px`,
            '--entry-y': `${entryY}px`,
            '--flight-pace': 1 + ((index * 7) % 9) / 13,
            '--index': index,
          } as CSSProperties}
        >
          <span className={styles.fly}>
            <span className={`${styles.wing} ${styles.upperWing}`} />
            <span className={`${styles.wing} ${styles.lowerWing}`} />
            <span className={styles.body} />
            <span className={styles.lantern} />
            <span className={styles.head} />
          </span>
        </span>
      ))}
    </div>
  );
}

import type { CSSProperties } from 'react';
import styles from './HeroArt.module.css';

/** Seeded so the engraving is identical on server and client. */
function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const f = (n: number): string => n.toFixed(1);

function build() {
  // 84 ticks, one per Day of the Count. Every 7th is longer (one Numeral cycle), every 12th longest (one Sign cycle).
  let ticks = '';
  for (let i = 0; i < 84; i++) {
    const a = (i / 84) * Math.PI * 2 - Math.PI / 2;
    const len = i % 12 === 0 ? 46 : i % 7 === 0 ? 34 : 20;
    const r0 = 452;
    ticks += `M${f(Math.cos(a) * r0)} ${f(Math.sin(a) * r0)}L${f(Math.cos(a) * (r0 - len))} ${f(Math.sin(a) * (r0 - len))}`;
  }
  // Fine radial hatching between two rings, the way a medal edge is engraved.
  let hatch = '';
  for (let i = 0; i < 252; i++) {
    const a = (i / 252) * Math.PI * 2;
    const r0 = 350;
    const r1 = i % 3 === 0 ? 392 : 380;
    hatch += `M${f(Math.cos(a) * r0)} ${f(Math.sin(a) * r0)}L${f(Math.cos(a) * r1)} ${f(Math.sin(a) * r1)}`;
  }
  // Patina patches grown around the rim.
  const rand = rng(1632);
  const patches = Array.from({ length: 22 }, (_, i) => {
    const a = rand() * Math.PI * 2;
    const r = 330 + rand() * 120;
    return { i, x: Math.cos(a) * r, y: Math.sin(a) * r, r: 30 + rand() * 54, tone: rand() < 0.35 ? 'deep' : 'mid' };
  });
  return { ticks, hatch, patches };
}

const ART = build();

/** Decorative engraving behind the hero: an 84-tick ring, medal hatching, and verdigris that grows as the page scrolls. */
export function HeroArt() {
  return (
    <svg className={styles.art} viewBox="-500 -500 1000 1000" aria-hidden="true" focusable="false">
      <defs>
        <radialGradient id="hero-patina-mid">
          <stop offset="0" stopColor="var(--patina)" stopOpacity="0.9" />
          <stop offset="0.6" stopColor="var(--patina)" stopOpacity="0.35" />
          <stop offset="1" stopColor="var(--patina)" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="hero-patina-deep">
          <stop offset="0" stopColor="var(--patina-deep)" stopOpacity="1" />
          <stop offset="0.6" stopColor="var(--patina-deep)" stopOpacity="0.5" />
          <stop offset="1" stopColor="var(--patina-deep)" stopOpacity="0" />
        </radialGradient>
      </defs>
      <g className={styles.spin}>
        <circle r="484" className={styles.hair} />
        <circle r="462" className={styles.hair} />
        <path d={ART.ticks} className={styles.ticks} />
        <circle r="400" className={styles.hair} />
        <path d={ART.hatch} className={styles.hatch} />
        <circle r="344" className={styles.hair} />
        <circle r="300" className={styles.hairDim} />
      </g>
      <g className={styles.bloom}>
        {ART.patches.map((p) => (
          <circle key={p.i} cx={f(p.x)} cy={f(p.y)} r={f(p.r)} fill={`url(#hero-patina-${p.tone})`} className={styles.patch} style={{ '--i': p.i, transformOrigin: `${f(p.x)}px ${f(p.y)}px` } as CSSProperties} />
        ))}
      </g>
    </svg>
  );
}

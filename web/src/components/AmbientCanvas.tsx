'use client';

import { useEffect, useRef } from 'react';
import { attachInput, createFrameWatch } from '@/lib/ambient-input';
import { tokenRgb, useMotion } from '@/lib/motion';
import styles from './Ambient.module.css';

/** Out of the page flow from the very first frame, whether or not the stylesheet has arrived yet. */
const FIXED = { position: 'fixed', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' } as const;

interface Blob {
  hx: number;
  hy: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  phase: number;
  speed: number;
  depth: number;
  tone: 0 | 1 | 2 | 3;
  alpha: number;
}

/** A small seeded generator, so every visit starts from the same arrangement. */
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

const SCALE = 0.5;

function sprite(rgb: [number, number, number], size = 128): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const g = c.getContext('2d');
  if (g) {
    const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    grad.addColorStop(0, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},1)`);
    grad.addColorStop(0.45, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0.42)`);
    grad.addColorStop(1, `rgba(${rgb[0]},${rgb[1]},${rgb[2]},0)`);
    g.fillStyle = grad;
    g.fillRect(0, 0, size, size);
  }
  return c;
}

/** Slow verdigris bloom that drifts at idle, is drawn to the cursor, ripples on a click and shifts with scroll. */
export function AmbientCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  const { tier, degrade } = useMotion();
  const animate = true;
  const full = tier === 'full';

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const deep = tokenRgb('--patina-deep', [31, 90, 88]);
    const mid = tokenRgb('--patina', [63, 143, 126]);
    const bright = tokenRgb('--patina-text', [127, 203, 182]);
    const bronze = tokenRgb('--patina-0', [201, 138, 75]);
    const sprites = [sprite(deep), sprite(mid), sprite(bright), sprite(bronze)];

    let W = 0;
    let H = 0;
    const resize = () => {
      W = Math.max(2, Math.round(window.innerWidth * SCALE));
      H = Math.max(2, Math.round(window.innerHeight * SCALE));
      canvas.width = W;
      canvas.height = H;
    };
    resize();

    const rand = rng(84);
    const blobs: Blob[] = [];
    // Fewer and smaller blooms on small screens, so text never sits on a bright patch.
    const fit = Math.min(1, Math.max(0.45, W / 700));
    const big = Math.round((full ? 34 : 22) * Math.max(0.55, fit));
    const specks = Math.round((full ? 60 : 28) * Math.max(0.55, fit));
    for (let i = 0; i < big + specks; i++) {
      const isSpeck = i >= big;
      const tone: Blob['tone'] = isSpeck ? 2 : rand() < 0.16 ? 3 : rand() < 0.5 ? 0 : 1;
      blobs.push({
        hx: rand(),
        hy: rand(),
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        r: (isSpeck ? 6 + rand() * 12 : 70 + rand() * 150) * fit,
        phase: rand() * Math.PI * 2,
        speed: 0.12 + rand() * 0.22,
        depth: isSpeck ? 0.5 + rand() * 0.6 : 0.15 + rand() * 0.4,
        tone,
        alpha: isSpeck ? 0.18 + rand() * 0.24 : tone === 3 ? 0.1 : 0.12 + rand() * 0.16,
      });
    }
    for (const b of blobs) {
      b.x = b.hx * W;
      b.y = b.hy * H;
    }

    const { input, detach } = animate ? attachInput() : { input: null, detach: () => undefined };
    let t = animate ? 0 : 6;
    let lens = 0;
    let raf = 0;
    let last = 0;
    const watch = createFrameWatch(full ? 24 : 30);

    const frame = (now: number, dt: number) => {
      t += dt;
      const scrollY = window.scrollY * SCALE;
      const px = input ? input.x * SCALE : -9999;
      const py = input ? input.y * SCALE : -9999;
      lens += ((input?.active ? 1 : 0) - lens) * Math.min(1, dt * 4);
      const lensR = 150 * (W / 700 > 1.3 ? 1.3 : 1);

      // Live ripples.
      const rings: { x: number; y: number; r: number; k: number }[] = [];
      if (input) {
        input.ripples = input.ripples.filter((r) => now - r.t0 < 1400);
        for (const r of input.ripples) {
          const age = Math.min(1, Math.max(0, (now - r.t0) / 1400));
          rings.push({ x: r.x * SCALE, y: r.y * SCALE, r: age * 260, k: 1 - age });
        }
      }

      ctx.globalCompositeOperation = 'source-over';
      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'lighter';

      for (const b of blobs) {
        const tx = (b.hx + Math.sin(t * b.speed + b.phase) * 0.05) * W;
        const span = H * 1.5;
        const rawY = (b.hy + Math.cos(t * b.speed * 0.8 + b.phase) * 0.05) * H - scrollY * b.depth * 0.35;
        const ty = ((((rawY + H * 0.25) % span) + span) % span) - H * 0.25;

        b.vx += (tx - b.x) * 6 * dt;
        b.vy += (ty - b.y) * 6 * dt;

        let boost = 0;
        if (lens > 0.01) {
          const dx = px - b.x;
          const dy = py - b.y;
          const d = Math.hypot(dx, dy) || 1;
          if (d < lensR * 2) {
            const f = Math.max(0, 1 - d / (lensR * 2));
            // Pulled in, with a slight swirl so it reads as a lens and not a magnet.
            b.vx += ((dx / d) * 70 + (-dy / d) * 40) * f * lens * dt * 6;
            b.vy += ((dy / d) * 70 + (dx / d) * 40) * f * lens * dt * 6;
            boost = f * lens;
          }
        }
        for (const ring of rings) {
          const dx = b.x - ring.x;
          const dy = b.y - ring.y;
          const d = Math.hypot(dx, dy) || 1;
          const w = Math.exp(-(((d - ring.r) / 46) ** 2)) * ring.k;
          if (w > 0.02) {
            b.vx += (dx / d) * 420 * w * dt;
            b.vy += (dy / d) * 420 * w * dt;
            boost += w * 0.8;
          }
        }
        const damp = Math.exp(-3.2 * dt);
        b.vx *= damp;
        b.vy *= damp;
        b.x += b.vx * dt;
        b.y += b.vy * dt;

        const breathe = 1 + Math.sin(t * 0.55 + b.phase) * 0.14;
        const r = b.r * breathe * (1 + boost * 0.25);
        ctx.globalAlpha = Math.min(0.5, b.alpha * (1 + boost * 1.2));
        const s = sprites[b.tone];
        if (s) ctx.drawImage(s, b.x - r, b.y - r, r * 2, r * 2);
      }

      // The warm lens itself.
      if (lens > 0.02) {
        ctx.globalAlpha = 0.16 * lens;
        const s = sprites[3];
        if (s) ctx.drawImage(s, px - lensR, py - lensR, lensR * 2, lensR * 2);
      }
      for (const ring of rings) {
        ctx.globalAlpha = 0.5 * ring.k;
        ctx.strokeStyle = `rgb(${bright[0]},${bright[1]},${bright[2]})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(ring.x, ring.y, ring.r, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    };

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const rawDt = last === 0 ? 16 : now - last;
      last = now;
      if (watch(rawDt, now)) degrade();
      frame(now, Math.min(0.05, rawDt / 1000));
    };

    const start = () => {
      if (!animate || raf) return;
      last = 0;
      raf = requestAnimationFrame(loop);
    };
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };
    const onVis = () => (document.hidden ? stop() : start());
    const onResize = () => {
      resize();
      if (!animate) frame(performance.now(), 0);
    };

    window.addEventListener('resize', onResize);
    if (animate) {
      document.addEventListener('visibilitychange', onVis);
      start();
    } else {
      frame(performance.now(), 0);
    }
    return () => {
      stop();
      detach();
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [animate, full, degrade]);

  return <canvas ref={ref} className={styles.canvas} style={FIXED} aria-hidden="true" />;
}

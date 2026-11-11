'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import styles from './AmbientField.module.css';

type Mark = { x: number; y: number; age: number; angle: number };

const clamp = (value: number) => Math.max(0, Math.min(1, value));

function makeTexture(core: string, edge: string, phase: number, rimOnly = false) {
  const texture = document.createElement('canvas');
  const size = 144;
  texture.width = texture.height = size;
  const brush = texture.getContext('2d');
  if (!brush) return texture;

  const mask = brush.createImageData(size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = (x + 0.5) / size * 2 - 1;
      const v = (y + 0.5) / size * 2 - 1;
      const angle = Math.atan2(v, u);
      const radius = Math.hypot(u, v);
      const edgeRadius = 0.71 + 0.10 * Math.sin(angle * 3 + phase)
        + 0.065 * Math.sin(angle * 8 - phase) + 0.035 * Math.sin(angle * 17 + phase);
      const grain = Math.sin(x * 1.72 + y * 0.91) * Math.sin(y * 2.3 - x * 0.3);
      const veins = Math.sin(u * 17 + Math.sin(v * 13) * 2.2)
        * Math.cos(v * 23 + Math.sin(u * 16) * 2.8);
      const distance = (edgeRadius - radius) + veins * 0.07 + grain * 0.033;
      const fringe = clamp(1 - Math.abs(distance) * 17) * (0.48 + 0.32 * grain);
      const body = rimOnly ? 0 : clamp(distance * 12) * (0.45 + 0.19 * veins + 0.15 * grain);
      mask.data[(y * size + x) * 4 + 3] = 255 * clamp(body + fringe);
    }
  }
  brush.putImageData(mask, 0, 0);
  const gradient = brush.createRadialGradient(63, 63, 0, 72, 72, 72);
  gradient.addColorStop(0, edge);
  gradient.addColorStop(0.62, core);
  gradient.addColorStop(1, core);
  brush.globalCompositeOperation = 'source-in';
  brush.fillStyle = gradient;
  brush.fillRect(0, 0, size, size);
  return texture;
}

function makeLens(bronze: string) {
  const texture = document.createElement('canvas');
  texture.width = texture.height = 64;
  const brush = texture.getContext('2d');
  if (!brush) return texture;
  const light = brush.createRadialGradient(32, 32, 0, 32, 32, 32);
  light.addColorStop(0, bronze);
  light.addColorStop(1, 'transparent');
  brush.fillStyle = light;
  brush.fillRect(0, 0, 64, 64);
  return texture;
}

function startField(canvas: HTMLCanvasElement, context: CanvasRenderingContext2D) {
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  const economy = connection?.saveData || navigator.hardwareConcurrency <= 4;
  const palette = getComputedStyle(canvas);
  const color = (token: string) => palette.getPropertyValue(token).trim();
  const oxide = color('--field-oxide-core');
  const shade = color('--field-oxide');
  const bronze = color('--field-bronze');
  const textures = [makeTexture(oxide, shade, 0.8), makeTexture(oxide, shade, 3.6)];
  const rim = makeTexture(oxide, shade, 2.4, true);
  const lens = makeLens(bronze);
  const hero = document.querySelector('[data-ambient-anchor]');
  const patches = [
    { x: 0.01, y: 0.13, size: 0.41, angle: 0.6, depth: 0.14 },
    { x: 0.98, y: 0.57, size: 0.54, angle: -0.32, depth: 0.12 },
    { x: 0.22, y: 1.02, size: 0.37, angle: 0.25, depth: 0.09 },
    { x: 0.62, y: 1.18, size: 0.44, angle: -0.72, depth: 0.2 },
  ].slice(0, economy ? 2 : 4);
  const marks: Mark[] = [];
  const grains = Array.from({ length: economy ? 28 : 68 }, (_, index) => ({
    x: ((index * 37 + 11) % 101) / 100,
    y: ((index * 61 + 23) % 103) / 102,
    phase: index * 2.39,
    speed: 0.85 + (index % 7) * 0.24,
    size: 0.8 + (index % 5) * 0.46,
  }));
  const pointer = { x: 0, y: 0, targetX: 0, targetY: 0, warmth: 0, targetWarmth: 0 };
  let width = 0;
  let height = 0;
  // The source textures are already soft. On touch screens, extra backing pixels
  // add fill cost without changing the texture.
  const pixelRatio = Math.min(devicePixelRatio || 1, matchMedia('(pointer: coarse)').matches ? 1 : 2);
  let resolution = 1;
  let visible = true;
  let frame = 0;
  let time = 0;
  let last = 0;
  let slow = 0;
  let scroll = window.scrollY;
  let anchor: DOMRect | undefined;
  let anchorScroll = scroll;

  function measureAnchor() {
    anchor = hero?.getBoundingClientRect();
    anchorScroll = window.scrollY;
  }

  function stamp(texture: HTMLCanvasElement, x: number, y: number, w: number, h: number, angle: number, opacity: number) {
    context.save();
    context.globalAlpha = opacity;
    context.translate(x, y);
    context.rotate(angle);
    context.drawImage(texture, -w / 2, -h / 2, w, h);
    context.restore();
  }

  function draw(dt: number) {
    time += dt;
    const spring = 1 - Math.exp(-dt * 28);
    pointer.x += (pointer.targetX - pointer.x) * spring;
    pointer.y += (pointer.targetY - pointer.y) * spring;
    pointer.warmth += (pointer.targetWarmth - pointer.warmth) * (1 - Math.exp(-dt * 14));
    const scale = Math.min(width, height);
    context.clearRect(0, 0, width, height);

    patches.forEach((patch, index) => {
      const growth = 1 + Math.sin(time * (0.74 + index * 0.12) + index) * 0.21;
      const size = scale * patch.size * growth;
      const offset = Math.min(scroll * patch.depth, height * 0.52);
      stamp(textures[index % 2]!, width * patch.x + scale * Math.sin(time * 0.63 + index) * 0.035, height * patch.y - offset, size * 1.48, size, patch.angle, hero ? 0.83 : 0.62);
    });

    if (anchor) {
      const y = anchor.top + anchorScroll - scroll;
      const size = Math.min(anchor.width, height);
      if (y + anchor.height + size > 0 && y - size < height) {
        const growth = 1 + Math.sin(time * 0.94) * 0.22;
        const spread = size * (0.68 + 0.15 * growth);
        stamp(textures[0]!, anchor.left + anchor.width * 0.96, y + anchor.height * 0.12, spread * growth, spread * 0.78, -0.57, 0.98);
        stamp(textures[1]!, anchor.left + anchor.width * 0.17, y + anchor.height * 0.90, spread * 0.94, spread * (0.78 + Math.sin(time * 0.79) * 0.14), 0.52, 0.94);
        stamp(rim, anchor.left + anchor.width * 0.96, y + anchor.height * 0.12, spread * 1.18 * growth, spread * 0.91, -0.57, 0.48);
      }
    }

    const reach = scale * 0.19;
    const faint = new Path2D();
    const visible = new Path2D();
    const warm = new Path2D();
    for (const grain of grains) {
      const phase = grain.phase + time * grain.speed;
      const x = width * grain.x + Math.sin(phase) * scale * 0.045;
      const y = height * grain.y + Math.cos(phase * 0.72) * scale * 0.055 - Math.min(scroll * 0.06, height * 0.16);
      const dx = x - pointer.x;
      const dy = y - pointer.y;
      const warmth = pointer.warmth * clamp(1 - Math.hypot(dx, dy) / reach);
      const size = grain.size * (1 + warmth * 0.8);
      const path = warmth > 0.24 ? warm : Math.sin(phase * 1.6) > 0 ? visible : faint;
      path.rect(x + dx * warmth * 0.17, y + dy * warmth * 0.17, size, size);
    }
    context.fillStyle = oxide;
    context.globalAlpha = 0.32;
    context.fill(faint);
    context.globalAlpha = 0.72;
    context.fill(visible);
    context.fillStyle = bronze;
    context.fill(warm);
    context.globalAlpha = 1;

    for (const mark of marks) {
      mark.age += dt;
      const progress = clamp(mark.age / 1.1);
      const spread = scale * (0.13 + 0.50 * (1 - (1 - progress) ** 2));
      const remaining = clamp(1 - mark.age / 4.5);
      const y = mark.y - scroll;
      stamp(textures[1]!, mark.x, y, spread, spread * 0.84, mark.angle, 0.64 * remaining * Math.min(1, mark.age * 9));
      if (progress < 1) stamp(rim, mark.x, y, spread * 1.12, spread, mark.angle, (1 - progress) * 0.9);
    }
    while (marks[0] && marks[0].age >= 4.5) marks.shift();

    if (pointer.warmth > 0.01) {
      const diameter = Math.min(176, scale * 0.23);
      stamp(lens, pointer.x, pointer.y, diameter, diameter, 0, pointer.warmth * 0.36);
    }
  }

  function resize() {
    measureAnchor();
    width = Math.max(1, canvas.clientWidth);
    height = Math.max(1, canvas.clientHeight);
    const ratio = pixelRatio * resolution;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    draw(0);
  }

  function tick(now: number) {
    const start = performance.now();
    const elapsed = last ? now - last : 16;
    last = now;
    draw(Math.min(elapsed, 40) / 1000);
    slow = elapsed > 22 || performance.now() - start > 8 ? slow + 1 : Math.max(0, slow - 0.5);
    if (slow >= 12 && resolution === 1) {
      resolution = 0.5;
      resize();
    }
    frame = requestAnimationFrame(tick);
  }

  function update() {
    cancelAnimationFrame(frame);
    last = 0;
    if (motion.matches) {
      time = 0;
      marks.length = 0;
      pointer.warmth = 0;
      draw(0);
    } else if (!document.hidden && visible) {
      frame = requestAnimationFrame(tick);
    }
  }

  function move(event: PointerEvent) {
    if (motion.matches || !event.isPrimary) return;
    if (pointer.warmth < 0.01) {
      pointer.x = event.clientX;
      pointer.y = event.clientY;
    }
    pointer.targetX = event.clientX;
    pointer.targetY = event.clientY;
    pointer.targetWarmth = 1;
  }
  function leave() { pointer.targetWarmth = 0; }
  function release(event: PointerEvent) { if (event.pointerType !== 'mouse') leave(); }
  function press(event: PointerEvent) {
    if (motion.matches || !event.isPrimary || event.button !== 0) return;
    move(event);
    marks.push({ x: event.clientX, y: event.clientY + scroll, age: 0, angle: event.clientX * 0.024 });
    if (marks.length > (economy ? 2 : 4)) marks.shift();
  }
  function onScroll() { if (!motion.matches) scroll = window.scrollY; }

  resize();
  const observer = new IntersectionObserver(([entry]) => {
    visible = entry?.isIntersecting ?? false;
    update();
  });
  observer.observe(canvas);
  const anchorObserver = hero ? new ResizeObserver(() => {
    measureAnchor();
    if (motion.matches) draw(0);
  }) : undefined;
  if (hero) anchorObserver?.observe(hero);
  motion.addEventListener('change', update);
  document.addEventListener('visibilitychange', update);
  document.documentElement.addEventListener('pointerleave', leave);
  window.addEventListener('blur', leave);
  window.addEventListener('resize', resize);
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('pointermove', move, { passive: true });
  window.addEventListener('pointerdown', press, { passive: true });
  window.addEventListener('pointerup', release, { passive: true });
  window.addEventListener('pointercancel', release, { passive: true });

  return () => {
    cancelAnimationFrame(frame);
    observer.disconnect();
    anchorObserver?.disconnect();
    motion.removeEventListener('change', update);
    document.removeEventListener('visibilitychange', update);
    document.documentElement.removeEventListener('pointerleave', leave);
    window.removeEventListener('blur', leave);
    window.removeEventListener('resize', resize);
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerdown', press);
    window.removeEventListener('pointerup', release);
    window.removeEventListener('pointercancel', release);
  };
}

export function AmbientField() {
  const ref = useRef<HTMLCanvasElement>(null);
  const pathname = usePathname();
  useEffect(() => {
    let stop: (() => void) | undefined;
    const init = () => {
      const canvas = ref.current;
      const context = canvas?.getContext('2d');
      if (canvas && context) stop = startField(canvas, context);
    };
    if (typeof window.requestIdleCallback === 'function') {
      const id = window.requestIdleCallback(init, { timeout: 1800 });
      return () => { window.cancelIdleCallback(id); stop?.(); };
    }
    const id = window.setTimeout(init, 400);
    return () => { window.clearTimeout(id); stop?.(); };
  }, [pathname]);
  return <canvas ref={ref} className={styles.canvas} aria-hidden="true" />;
}

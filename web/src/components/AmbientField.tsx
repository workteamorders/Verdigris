'use client';

import { useEffect, useRef } from 'react';
import styles from './AmbientField.module.css';

type Bloom = { x: number; y: number; radius: number; phase: number };
type Ripple = { x: number; y: number; age: number };

function startField(canvas: HTMLCanvasElement, context: CanvasRenderingContext2D) {
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  const economy = connection?.saveData || navigator.hardwareConcurrency <= 4;
  const palette = getComputedStyle(canvas);
  const sprite = document.createElement('canvas');
  sprite.width = sprite.height = 128;
  const brush = sprite.getContext('2d');
  if (!brush) return;
  const gradient = brush.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, palette.getPropertyValue('--patina-deep').trim());
  gradient.addColorStop(0.32, palette.getPropertyValue('--field-oxide').trim());
  gradient.addColorStop(1, 'transparent');
  brush.fillStyle = gradient;
  brush.fillRect(0, 0, 128, 128);

  const blooms: Bloom[] = Array.from({ length: economy ? 26 : 64 }, (_, index) => ({
    x: Math.random(), y: Math.random(), radius: index < 8 ? 0.16 + Math.random() * 0.18 : 0.004 + Math.random() * 0.025,
    phase: Math.random() * Math.PI * 2,
  }));
  let ripple: Ripple | undefined;
  const pointer = { x: 0, y: 0, targetX: 0, targetY: 0, warmth: 0, targetWarmth: 0 };
  let width = 0;
  let height = 0;
  let resolution = 1;
  let visible = true;
  let frame = 0;
  let time = 0;
  let last = 0;
  let slow = 0;
  let scroll = window.scrollY;

  function draw(dt: number) {
    time += dt;
    const spring = 1 - Math.exp(-dt * 5);
    pointer.x += (pointer.targetX - pointer.x) * spring;
    pointer.y += (pointer.targetY - pointer.y) * spring;
    pointer.warmth += (pointer.targetWarmth - pointer.warmth) * spring;
    const scale = Math.min(width, height);
    context.clearRect(0, 0, width, height);
    for (const bloom of blooms) {
      const phase = time * (0.07 + bloom.radius * 0.17) + bloom.phase;
      const x = width * bloom.x + scale * Math.sin(phase) * 0.08;
      const y = height * bloom.y + scale * Math.cos(phase * 0.8) * 0.09 - Math.min(scroll * 0.035, scale * 0.12);
      const distance = Math.hypot(pointer.x - x, pointer.y - y) / scale;
      const warmth = pointer.warmth * Math.max(0, 1 - distance * 3);
      const radius = scale * bloom.radius * (1 + 0.22 * Math.sin(phase) + warmth * 0.15);
      const shift = warmth * 0.12;
      context.globalAlpha = 0.17 + 0.1 * Math.cos(phase) + warmth * 0.23;
      context.drawImage(sprite, x + (pointer.x - x) * shift - radius, y + (pointer.y - y) * shift - radius, radius * 2, radius * 2);
    }
    if (ripple) {
      ripple.age += dt;
      const progress = ripple.age / 2.2;
      const radius = scale * (0.04 + 0.38 * progress);
      context.globalAlpha = 0.36 * Math.max(0, 1 - progress);
      for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        const size = radius * 0.32;
        context.drawImage(sprite, ripple.x + Math.cos(angle) * radius - size, ripple.y + Math.sin(angle) * radius - size, size * 2, size * 2);
      }
      if (progress >= 1) ripple = undefined;
    }
  }

  function resize() {
    width = Math.max(1, canvas.clientWidth);
    height = Math.max(1, canvas.clientHeight);
    const ratio = Math.min(devicePixelRatio || 1, 2) * resolution;
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
    slow = elapsed > 22 || performance.now() - start > 8 ? slow + 1 : Math.max(0, slow - 1);
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
      ripple = undefined;
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
    ripple = { x: event.clientX, y: event.clientY, age: 0 };
  }
  function onScroll() { if (!motion.matches) scroll = window.scrollY; }

  resize();
  const observer = new IntersectionObserver(([entry]) => {
    visible = entry?.isIntersecting ?? false;
    update();
  });
  observer.observe(canvas);
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
  }, []);
  return <canvas ref={ref} className={styles.canvas} aria-hidden="true" />;
}

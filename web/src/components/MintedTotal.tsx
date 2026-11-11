'use client';

import { useEffect, useRef } from 'react';
import styles from './Motion.module.css';

export function MintedTotal({ value }: { value: number }) {
  const number = useRef<HTMLSpanElement>(null);
  const last = useRef(0);
  useEffect(() => {
    const node = number.current;
    const from = last.current;
    if (!node || from === value || matchMedia('(prefers-reduced-motion: reduce)').matches) {
      last.current = value;
      return;
    }
    const duration = Number.parseFloat(getComputedStyle(node).getPropertyValue('--dur-bloom'));
    const start = performance.now();
    let frame = 0;
    function tick(now: number) {
      const progress = Math.min(1, (now - start) / duration);
      last.current = Math.round(from + (value - from) * (1 - (1 - progress) ** 3));
      if (node) node.textContent = String(last.current);
      if (progress < 1) frame = requestAnimationFrame(tick);
    }
    tick(start);
    return () => cancelAnimationFrame(frame);
  }, [value]);
  return (
    <span className={`mono ${styles.counter}`}>
      <span className={styles.counterWidth}><span className="visually-hidden">{value}</span><span aria-hidden="true">{value}</span></span>
      <span aria-hidden="true" ref={number}>{value}</span>
    </span>
  );
}

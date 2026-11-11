'use client';

import { Children, useEffect, useRef, type CSSProperties, type ReactNode } from 'react';
import styles from './Motion.module.css';

export function Reveal({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = root.current;
    if (!element || !('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting) return;
      element.dataset.revealGroup = '';
      observer.disconnect();
    }, { threshold: 0.15 });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={root} className={styles.revealGroup}>
      {Children.map(children, (child, index) => (
        <div className={styles.reveal} style={{ '--reveal-order': index } as CSSProperties}>{child}</div>
      ))}
    </div>
  );
}

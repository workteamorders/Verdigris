'use client';

import dynamic from 'next/dynamic';
import { useCallback, useEffect, useState } from 'react';
import { AmbientCanvas } from './AmbientCanvas';
import { useMotion, whenIdle } from '@/lib/motion';
import styles from './Ambient.module.css';

// The shader layer is its own chunk and only loads on the Full tier.
const AmbientGL = dynamic(() => import('./AmbientGL'), { ssr: false });

/** How long after the page has loaded the live layer waits. The still backdrop covers that time, and the page stays quiet while it loads. */
const SETTLE_MS = 1500;

/**
 * The living background.
 * - Until the page has settled, and always in the Minimal tier, a still CSS backdrop is shown (no script work at all).
 * - After that, Medium draws the canvas-2D bloom and Full draws the shader, each reacting to cursor, touch and scroll.
 */
export function Ambient() {
  const { tier } = useMotion();
  const [ready, setReady] = useState(false);
  const [glFailed, setGlFailed] = useState(false);
  const onFail = useCallback(() => setGlFailed(true), []);

  useEffect(() => {
    let cancelIdle = () => undefined as void;
    let timer = 0;
    const begin = () => {
      timer = window.setTimeout(() => {
        cancelIdle = whenIdle(() => setReady(true));
      }, SETTLE_MS);
    };
    if (document.readyState === 'complete') begin();
    else window.addEventListener('load', begin, { once: true });
    return () => {
      window.removeEventListener('load', begin);
      window.clearTimeout(timer);
      cancelIdle();
    };
  }, []);

  const live = ready && tier !== 'minimal';
  if (!live) return <div className={styles.still} aria-hidden="true" />;
  return tier === 'full' && !glFailed ? <AmbientGL onFail={onFail} /> : <AmbientCanvas />;
}

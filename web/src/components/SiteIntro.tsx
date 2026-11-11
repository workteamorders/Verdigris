'use client';

import { useEffect, useRef } from 'react';
import { useMotion } from '@/lib/motion';
import styles from './SiteIntro.module.css';

const VISITED_KEY = 'verdigris.site-intro.v1';
let playedOnPage = false;

export function SiteIntro() {
  const ref = useRef<HTMLDialogElement>(null);
  const { tier } = useMotion();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (tier === 'minimal') {
      if (dialog.open) dialog.close();
      return;
    }
    if (playedOnPage) return;

    try {
      if (window.localStorage.getItem(VISITED_KEY)) return;
    } catch {
      // Some browsers restrict storage; retain the in-memory flag for this visit.
    }

    dialog.showModal();
    playedOnPage = true;
    try {
      window.localStorage.setItem(VISITED_KEY, '1');
    } catch {
      // The intro still works without persistence.
    }

    // Close even if a browser cancels the CSS animation.
    const duration = getComputedStyle(dialog).animationDuration;
    const durationMs = Number.parseFloat(duration) * (duration.endsWith('ms') ? 1 : 1000);
    const fallback = window.setTimeout(() => {
      if (dialog.open) dialog.close();
    }, durationMs + 160);
    return () => window.clearTimeout(fallback);
  }, [tier]);

  return (
    <dialog
      ref={ref}
      className={styles.intro}
      aria-labelledby="verdigris-intro-title"
      onAnimationEnd={(event) => {
        if (event.target === event.currentTarget && event.currentTarget.open) event.currentTarget.close();
      }}
    >
      <div className={styles.display}>
        <svg className={styles.emblem} viewBox="0 0 160 160" aria-hidden="true" focusable="false">
          <defs>
            <linearGradient id="intro-bronze" x2="80%" y2="100%">
              <stop stopColor="var(--metal-spec)" />
              <stop offset=".31" stopColor="var(--metal-hi)" />
              <stop offset=".64" stopColor="var(--metal-lo)" />
              <stop offset="1" stopColor="var(--metal-mid)" />
            </linearGradient>
            <linearGradient id="intro-oxide" x2="100%" y2="85%">
              <stop stopColor="var(--patina-text)" />
              <stop offset="1" stopColor="var(--patina-deep)" />
            </linearGradient>
          </defs>
          <g className={styles.rim}>
            <circle cx="80" cy="80" r="72" className={styles.outline} />
            <circle cx="80" cy="80" r="65" className={styles.ticks} />
            <path d="M80 4v12M156 80h-12M80 156v-12M4 80h12" className={styles.outline} />
          </g>
          <circle cx="80" cy="80" r="54" fill="url(#intro-bronze)" className={styles.edge} />
          <circle cx="80" cy="80" r="45" className={styles.face} />
          <path d="M40 100a44 44 0 0 0 78 4Q107 109 100 105Q94 100 88 107Q80 116 66 110Q57 105 52 109Z" fill="url(#intro-oxide)" className={styles.patina} />
          <path d="M52 56h19m18 0h19M57 56l22 48 24-48M63 56l18 39" className={styles.glyph} />
          <path d="M34 68l7 2m79-2 7-2M77 128h6" className={styles.outline} />
        </svg>
        <p id="verdigris-intro-title" className={styles.wordmark}>Verdigris</p>
        <p className={`label ${styles.caption}`}>Time leaves a mark.</p>
      </div>
      <button
        className={styles.skip}
        type="button"
        autoFocus
        onClick={() => {
          ref.current?.close();
          document.getElementById('main')?.focus({ preventScroll: true });
        }}
      >
        Skip intro
      </button>
    </dialog>
  );
}

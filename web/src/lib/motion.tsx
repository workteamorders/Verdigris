'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

/** How much motion the page may use. Chosen once on the client, can step down at run time. */
export type MotionTier = 'full' | 'medium' | 'minimal';
export type MotionPreference = 'auto' | 'reduced';

interface MotionApi {
  tier: MotionTier;
  /** Why the tier is what it is, for the footer control. */
  osReduced: boolean;
  preference: MotionPreference;
  setPreference: (p: MotionPreference) => void;
  /** Called by heavy layers when frames are slow. Steps down one tier. */
  degrade: () => void;
}

const STORE_KEY = 'verdigris.motion';

const MotionContext = createContext<MotionApi>({ tier: 'minimal', osReduced: false, preference: 'auto', setPreference: () => undefined, degrade: () => undefined });

interface NavigatorHints {
  connection?: { saveData?: boolean };
  deviceMemory?: number;
}

/** Looks at the device once. The first paint always renders as `minimal`, so server and client agree. */
function detectTier(): MotionTier {
  const nav = navigator as Navigator & NavigatorHints;
  const finePointer = window.matchMedia('(pointer: fine)').matches;
  const cores = navigator.hardwareConcurrency || 4;
  if (nav.connection?.saveData) return 'minimal';
  if (cores <= 4) return 'minimal';
  if (finePointer && cores >= 8 && (nav.deviceMemory ?? 8) >= 8) return 'full';
  return 'medium';
}

function readPreference(): MotionPreference {
  try {
    return window.localStorage.getItem(STORE_KEY) === 'reduced' ? 'reduced' : 'auto';
  } catch {
    return 'auto';
  }
}

const ORDER: readonly MotionTier[] = ['full', 'medium', 'minimal'];

export function MotionProvider({ children }: { children: ReactNode }) {
  const [detected, setDetected] = useState<MotionTier>('minimal');
  const [stepped, setStepped] = useState(0);
  const [osReduced, setOsReduced] = useState(false);
  const [preference, setPref] = useState<MotionPreference>('auto');

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setOsReduced(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    setPref(readPreference());
    setDetected(detectTier());
    return () => mq.removeEventListener('change', sync);
  }, []);

  const setPreference = useCallback((p: MotionPreference) => {
    setPref(p);
    try {
      if (p === 'reduced') window.localStorage.setItem(STORE_KEY, 'reduced');
      else window.localStorage.removeItem(STORE_KEY);
    } catch {
      /* storage can be blocked; the choice then lasts for this visit only */
    }
  }, []);

  const degrade = useCallback(() => setStepped((s) => Math.min(s + 1, ORDER.length - 1)), []);

  const tier: MotionTier = useMemo(() => {
    // The system setting always wins over anything stored.
    if (osReduced || preference === 'reduced') return 'minimal';
    const i = Math.min(ORDER.indexOf(detected) + stepped, ORDER.length - 1);
    return ORDER[i] ?? 'minimal';
  }, [detected, stepped, osReduced, preference]);

  useEffect(() => {
    document.documentElement.dataset.motion = tier;
  }, [tier]);

  const value = useMemo(() => ({ tier, osReduced, preference, setPreference, degrade }), [tier, osReduced, preference, setPreference, degrade]);
  return <MotionContext.Provider value={value}>{children}</MotionContext.Provider>;
}

export function useMotion(): MotionApi {
  return useContext(MotionContext);
}

/** Runs `fn` after first paint, when the browser is idle. */
export function whenIdle(fn: () => void, timeout = 1200): () => void {
  const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number; cancelIdleCallback?: (id: number) => void };
  if (w.requestIdleCallback && w.cancelIdleCallback) {
    const id = w.requestIdleCallback(fn, { timeout });
    return () => w.cancelIdleCallback?.(id);
  }
  const id = window.setTimeout(fn, 200);
  return () => window.clearTimeout(id);
}

/** Reads a colour token from CSS and returns 0..255 channels. Tokens are hex, so this stays simple. */
export function tokenRgb(name: string, fallback: [number, number, number]): [number, number, number] {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  const m = /^#([0-9a-f]{6})$/i.exec(raw);
  if (!m || !m[1]) return fallback;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

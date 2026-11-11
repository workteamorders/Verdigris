/** Shared pointer, touch and scroll state for the ambient background layers. Plain data, read once per frame. */
export interface Ripple {
  x: number;
  y: number;
  t0: number;
}

export interface AmbientInput {
  /** Client pixels. */
  x: number;
  y: number;
  /** True while a mouse is over the page or a finger is down. */
  active: boolean;
  ripples: Ripple[];
}

export function attachInput(): { input: AmbientInput; detach: () => void } {
  const input: AmbientInput = { x: window.innerWidth * 0.5, y: window.innerHeight * 0.4, active: false, ripples: [] };
  let releaseTimer = 0;

  const move = (e: PointerEvent) => {
    input.x = e.clientX;
    input.y = e.clientY;
    if (e.pointerType === 'mouse') input.active = true;
    else if (e.buttons > 0 || e.pointerType === 'touch') {
      input.active = true;
      window.clearTimeout(releaseTimer);
    }
  };
  const down = (e: PointerEvent) => {
    input.x = e.clientX;
    input.y = e.clientY;
    input.active = true;
    window.clearTimeout(releaseTimer);
    input.ripples.push({ x: e.clientX, y: e.clientY, t0: performance.now() });
    if (input.ripples.length > 4) input.ripples.shift();
  };
  const up = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse') releaseTimer = window.setTimeout(() => (input.active = false), 700);
  };
  const leave = () => {
    input.active = false;
  };

  window.addEventListener('pointermove', move, { passive: true });
  window.addEventListener('pointerdown', down, { passive: true });
  window.addEventListener('pointerup', up, { passive: true });
  window.addEventListener('pointercancel', up, { passive: true });
  document.documentElement.addEventListener('mouseleave', leave);
  return {
    input,
    detach: () => {
      window.clearTimeout(releaseTimer);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerdown', down);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      document.documentElement.removeEventListener('mouseleave', leave);
    },
  };
}

/** Rolling frame-time watch. Returns true once when the average is over budget for a few seconds. */
export function createFrameWatch(budgetMs: number, windowMs = 2500, graceMs = 3000): (dtMs: number, now: number) => boolean {
  let sum = 0;
  let n = 0;
  let windowStart = 0;
  let graceUntil = 0;
  return (dtMs, now) => {
    if (now < graceUntil) return false;
    if (windowStart === 0) windowStart = now;
    sum += dtMs;
    n += 1;
    if (now - windowStart < windowMs) return false;
    const avg = sum / Math.max(1, n);
    sum = 0;
    n = 0;
    windowStart = 0;
    if (avg > budgetMs) {
      graceUntil = now + graceMs;
      return true;
    }
    return false;
  };
}

/** Pixels of backing store per CSS pixel: sharper on dense screens, capped so the canvas never gets expensive. */
export function renderScale(w: number, h: number): number {
  const wanted = Math.min(1.25, Math.max(0.8, (window.devicePixelRatio || 1) * 0.65));
  return Math.min(wanted, Math.sqrt(1_600_000 / (w * h)));
}

// Patina level from time since last move. Thresholds are deploy parameters (seconds); the mainnet defaults are in days.
export const DAY_SECONDS = 86_400;

export const MAINNET_PATINA_THRESHOLDS_DAYS = [3, 14, 45, 120] as const;

export type PatinaLevel = 0 | 1 | 2 | 3 | 4;

/** thresholds are the seconds at which level 1, 2, 3, 4 begin. Monotonic in elapsed. */
export function patinaLevel(elapsedSeconds: number, thresholds: readonly number[]): PatinaLevel {
  let level = 0;
  for (const t of thresholds) {
    if (elapsedSeconds >= t) level += 1;
  }
  return Math.min(level, 4) as PatinaLevel;
}

export const mainnetThresholdsSeconds: readonly number[] = MAINNET_PATINA_THRESHOLDS_DAYS.map((d) => d * DAY_SECONDS);

/** Unix seconds when the next level begins if the disc is not moved, or null at level 4. */
export function nextLevelAt(lastMovedAt: number, level: PatinaLevel, thresholds: readonly number[]): number | null {
  const t = thresholds[level];
  return t === undefined ? null : lastMovedAt + t;
}

export const LEVEL_NAMES = ['Fresh', 'First bloom', 'Spreading', 'Settled', 'Deep'] as const;

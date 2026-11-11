// The 12 Signs: abstract geometry only. Neutral English names (shapes), none derived from any culture's glyphs.
// Path data is drawn in a -40..40 box centred on 0,0.

export interface Sign {
  readonly name: string;
  readonly d: string;
  /** Fill the left half to make the shape readable as solid. */
  readonly fillHalf?: boolean;
  /** Closed shape drawn as a solid mass. Others are line work only. */
  readonly solid?: boolean;
}

export const SIGNS: readonly Sign[] = [
  { name: 'Arcs', d: 'M-36 16A36 36 0 0 1 36 16M-22 16A22 22 0 0 1 22 16M-8 16A8 8 0 0 1 8 16' },
  { name: 'Quadrant', d: 'M-30 30H30A60 60 0 0 0 -30 -30Z', solid: true },
  { name: 'Grid', d: 'M-30 -30H30V30H-30ZM-10 -30V30M10 -30V30M-30 -10H30M-30 10H30' },
  { name: 'Tangent', d: 'M-36 0a18 18 0 1 0 36 0a18 18 0 1 0 -36 0M0 0a18 18 0 1 0 36 0a18 18 0 1 0 -36 0' },
  { name: 'Crescent', d: 'M0 -34A34 34 0 1 0 0 34A24 24 0 1 1 0 -34Z', solid: true },
  { name: 'Chevrons', d: 'M-30 -18L0 8L30 -18M-30 4L0 30L30 4' },
  { name: 'Slashes', d: 'M-26 30L6 -30M-6 30L26 -30M-14 30L18 -30' },
  { name: 'Gap Ring', d: 'M24 -22A32 32 0 1 0 24 22M30 -6V6' },
  { name: 'Chord', d: 'M-32 0a32 32 0 1 0 64 0a32 32 0 1 0 -64 0M-32 8H32M0 8V32' },
  { name: 'Diamond', d: 'M0 -36L36 0L0 36L-36 0ZM0 -12a12 12 0 1 0 0.01 0' },
  { name: 'Half Disc', d: 'M0 -32A32 32 0 0 0 0 32ZM0 -32A32 32 0 0 1 0 32', fillHalf: true },
  { name: 'Squares', d: 'M-26 -26H26V26H-26ZM0 -38L38 0L0 38L-38 0Z' },
];

export const HALF_DISC_FILL = 'M0 -32A32 32 0 0 0 0 32Z';

export type Tier = 'Ordinary' | 'Fine' | 'Crown';

/** Spec: slot mod 12 is the Sign, (slot mod 7) + 1 is the Numeral. */
export function signOfSlot(slot: number): number {
  return ((slot % 12) + 12) % 12;
}
export function numeralOfSlot(slot: number): number {
  return (((slot % 7) + 7) % 7) + 1;
}
/** Numerals 1-4 Ordinary, 5-6 Fine, 7 Crown. */
export function tierOfNumeral(numeral: number): Tier {
  if (numeral >= 7) return 'Crown';
  if (numeral >= 5) return 'Fine';
  return 'Ordinary';
}

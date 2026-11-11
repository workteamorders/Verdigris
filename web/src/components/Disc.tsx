import { memo, useId, useMemo } from 'react';
import { discInline } from '@/lib/disc';
import { SIGNS, tierOfNumeral } from '@/lib/signs';
import { LEVEL_NAMES, type PatinaLevel } from '@/lib/patina';

interface DiscProps {
  sign: number;
  numeral: number;
  serial?: number;
  level?: PatinaLevel;
  /** Show the filter-stripped fallback look. */
  noFilters?: boolean;
  size?: number | string;
  className?: string;
}

/** Draws a Disc with the TypeScript port of the on-chain renderer (byte-identical to the contract output). */
function DiscBase({ sign, numeral, serial = 5, level = 0, noFilters, size = '100%', className }: DiscProps) {
  const raw = useId().replace(/:/g, '');
  const tier = tierOfNumeral(numeral);
  const name = SIGNS[sign]?.name ?? 'Sign';
  const markup = useMemo(() => discInline({ sign, numeral, level, serial }, { idPrefix: `d${raw}`, noFilters }), [sign, numeral, level, serial, raw, noFilters]);
  return (
    <svg
      className={className}
      viewBox="0 0 400 400"
      width={size}
      height={size}
      role="img"
      aria-label={`${tier} Disc, Sign ${name}, Numeral ${numeral}, Patina level ${level} (${LEVEL_NAMES[level]})`}
      dangerouslySetInnerHTML={{ __html: markup }}
    />
  );
}

export const Disc = memo(DiscBase);

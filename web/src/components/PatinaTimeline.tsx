'use client';

import { useState } from 'react';
import { Slider } from './Field';
import { TiltDisc } from './TiltDisc';
import { DAY_SECONDS, LEVEL_NAMES, mainnetThresholdsSeconds, type PatinaLevel } from '@/lib/patina';
import styles from './Motion.module.css';

export function PatinaTimeline({ thresholds = mainnetThresholdsSeconds, disabled = false }: { thresholds?: readonly number[]; disabled?: boolean }) {
  const [level, setLevel] = useState<PatinaLevel>(0);
  const seconds = thresholds[level - 1] ?? 0;
  const days = seconds / DAY_SECONDS;
  const elapsed = seconds % DAY_SECONDS === 0
    ? `${days} ${days === 1 ? 'day' : 'days'}`
    : seconds % 60 === 0 ? `${seconds / 60} minutes` : `${seconds} seconds`;
  const description = `Level ${level} · ${LEVEL_NAMES[level]} · ${level ? `${elapsed} unmoved` : 'Minted or moved'}`;
  return (
    <div className={styles.timeline}>
      <div className={styles.specimen}>
        <TiltDisc sign={5} numeral={3} serial={7} level={level} noFilters state={disabled ? 'disabled' : 'ready'} />
      </div>
      <div>
        <p className="label">EXAMPLE</p>
        <Slider label="Patina level" value={level} valueText={description} min={0} max={4} step={1} disabled={disabled} onChange={(event) => setLevel(Number(event.currentTarget.value) as PatinaLevel)} />
      </div>
    </div>
  );
}

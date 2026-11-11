import { useId } from 'react';
import type { FrameName } from './Frame';
import styles from './FrameEngraving.module.css';

const cuts: Record<FrameName, string> = {
  reed: 'M2 9Q9 0 16 9Q9 18 2 9ZM5 9Q9 3 13 9Q9 15 5 9ZM9 5V13',
  bead: 'M9 1C10 6 12 8 17 9C12 10 10 12 9 17C8 12 6 10 1 9C6 8 8 6 9 1ZM9 6L12 9L9 12L6 9Z',
  dentil: 'M2 14L9 3L16 14ZM5 12L9 6L13 12ZM7 14V16M11 14V16',
  rope: 'M1 9C5 0 10 1 13 7S11 18 7 14S6 4 10 3S15 6 17 9M1 9C4 15 8 16 12 11',
  lozenge: 'M9 1L17 9L9 17L1 9ZM9 4L14 9L9 14L4 9ZM7 9H11M9 7V11',
  moulding: 'M2 12Q9 1 16 12M4 13Q9 5 14 13M7 14Q9 10 11 14M9 3V1',
  scale: 'M2 5Q9 5 9 15Q9 5 16 5Q15 13 9 15Q3 13 2 5ZM9 2V10',
  inlay: 'M9 1L16 5V13L9 17L2 13V5ZM9 4L13 6.5V11.5L9 14L5 11.5V6.5ZM7 9H11',
};

const corners = ['topLeft', 'topRight', 'bottomLeft', 'bottomRight'] as const;
const compactCorners = ['topLeft', 'bottomRight'] as const;
const shell = 'M1 1H80L74 6Q65 11 54 9Q47 17 35 15Q29 29 16 34Q18 47 9 54Q11 66 6 74L1 80Z';
const foliage = 'M7 68C15 55 2 45 15 36C25 29 32 32 34 22C36 11 51 17 55 8M9 59C9 49 15 46 20 46C25 46 25 52 21 52M12 38C11 28 21 23 28 25M31 28C42 30 48 24 47 18M49 13C57 15 63 11 68 6';
const cornerLeaves = 'M13 44Q18 36 25 36Q24 44 13 44ZM15 33Q16 23 24 22Q25 30 15 33ZM30 27Q39 21 44 22Q43 30 30 27ZM38 17Q44 8 51 10Q48 17 38 17ZM8 54Q3 46 8 40Q13 47 8 54Z';
const frond = 'M104 38C86 43 78 15 52 24C41 27 44 39 54 37C62 35 57 28 52 30M89 34C73 16 49 14 33 28C25 34 16 35 7 32M75 26C67 13 50 7 35 14M86 38C71 39 68 53 54 49M44 23C34 20 27 23 21 28';
const crestLeaves = 'M88 35Q80 22 68 24Q72 34 88 35ZM73 25Q68 11 54 12Q58 22 73 25ZM53 20Q44 13 36 16Q42 23 53 20ZM42 24Q25 20 19 30Q30 34 42 24ZM69 42Q55 40 48 49Q60 53 69 42ZM88 39Q78 40 76 49Q84 49 88 39Z';
const beads = [[19, 33], [25, 31], [31, 31], [37, 32], [43, 34], [48, 38], [54, 41], [60, 38], [67, 34], [73, 39], [77, 43]] as const;

function Bronze({ id }: { id: string }) {
  return (
    <defs>
      <linearGradient id={id} x2="83%" y2="100%">
        <stop offset="0" stopColor="var(--metal-spec)" />
        <stop offset=".24" stopColor="var(--metal-hi)" />
        <stop offset=".55" stopColor="var(--metal-mid)" />
        <stop offset=".76" stopColor="var(--metal-hi)" />
        <stop offset="1" stopColor="var(--metal-lo)" />
      </linearGradient>
    </defs>
  );
}

function Corner({ frame, position }: { frame: FrameName; position: (typeof corners)[number] }) {
  const metal = useId();
  return (
    <svg className={`${styles.corner} ${styles[position]}`} viewBox="0 0 80 80" focusable="false">
      <Bronze id={metal} />
      <path d={shell} className={styles.cast} />
      <path d="M3 4H72L68 7Q60 9 52 7Q45 14 34 12Q28 26 13 33Q15 46 7 53Q9 62 4 71Z" fill={`url(#${metal})`} className={styles.rim} />
      <path d={cornerLeaves} className={styles.leaf} />
      <path d={foliage} className={styles.shadowCut} transform="translate(0.8 1)" />
      <path d={foliage} className={styles.lightCut} />
      <path d="M8 10Q12 5 20 8Q28 9 26 16Q25 23 17 25Q8 25 7 18Z" className={styles.inset} />
      <path d={cuts[frame]} transform="translate(10.6 9.8) scale(.71)" className={styles.sign} />
      <path d="M8 56V64M7 66V69M56 8H64M66 7H69" className={styles.lightCut} />
      <circle cx="5.5" cy="5.5" r="1.1" className={styles.rivet} />
      <circle cx="17" cy="41" r="1.1" className={styles.rivet} />
      <circle cx="43" cy="14" r="1.1" className={styles.rivet} />
    </svg>
  );
}

function Frond({ mirror = false }: { mirror?: boolean }) {
  return (
    <g transform={mirror ? 'translate(220) scale(-1 1)' : undefined}>
      {beads.map(([cx, cy], index) => <circle key={cx} cx={cx} cy={cy} r={index % 3 ? 1.35 : 1.85} className={styles.pearl} />)}
      <path d={crestLeaves} className={styles.leaf} />
      <path d={frond} className={styles.shadowCut} transform="translate(0 1.4)" />
      <path d={frond} className={styles.lightCut} />
    </g>
  );
}

function Crown({ frame }: { frame: FrameName }) {
  const metal = useId();
  return (
    <svg className={styles.crown} viewBox="0 0 220 58" focusable="false">
      <Bronze id={metal} />
      <path d="M1 32C26 36 31 12 55 12C72 12 81 22 94 18L110 2L126 18C139 22 148 12 165 12C189 12 194 36 219 32C205 45 181 36 166 45C150 57 132 49 122 45L110 57L98 45C88 49 70 57 54 45C39 36 15 45 1 32Z" className={styles.cast} />
      <path d="M8 33C28 34 37 15 55 15C71 14 83 26 96 21L110 5L124 21C137 26 149 14 165 15C183 15 192 34 212 33C193 42 181 34 164 43C150 52 133 47 122 42L110 53L98 42C87 47 70 52 56 43C39 34 27 42 8 33Z" fill={`url(#${metal})`} className={styles.rim} />
      <Frond />
      <Frond mirror />
      <path d="M110 8C121 12 128 21 127 31C126 41 118 48 110 51C102 48 94 41 93 31C92 21 99 12 110 8Z" className={styles.inset} />
      <path d="M110 13Q100 17 102 25Q94 25 96 30Q100 38 108 35M110 13Q120 17 118 25Q126 25 124 30Q120 38 112 35M101 28L98 35M119 28L122 35" className={styles.lightCut} />
      <path d="M110 17Q118 22 116 32Q114 41 110 45Q106 41 104 32Q102 22 110 17Z" fill={`url(#${metal})`} className={styles.rim} />
      <path d={cuts[frame]} transform="translate(105.3 24) scale(.52)" className={styles.sign} />
      <circle cx="110" cy="41" r="1.75" className={styles.rivet} />
    </svg>
  );
}

function Roots() {
  return (
    <svg className={styles.roots} viewBox="0 0 152 34" focusable="false">
      <path d="M2 24Q22 16 41 20Q54 22 65 10Q70 2 76 2Q82 2 87 10Q98 22 111 20Q130 16 150 24L139 29H13Z" className={styles.cast} />
      <path d="M12 24Q29 20 45 23Q63 26 76 10Q89 26 107 23Q123 20 140 24M40 26Q62 28 69 22M112 26Q90 28 83 22M56 17Q66 15 71 11M96 17Q86 15 81 11" className={styles.lightCut} />
      <path d="M76 5Q88 14 76 25Q64 14 76 5Z" className={styles.inset} />
      <path d="M76 9V21M72 15L76 18L80 15" className={styles.lightCut} />
      <circle cx="31" cy="24" r="1.6" className={styles.pearl} />
      <circle cx="121" cy="24" r="1.6" className={styles.pearl} />
    </svg>
  );
}

export function FrameEngraving({ frame, compact = false }: { frame: FrameName; compact?: boolean }) {
  return (
    <span className={styles.engraving} data-compact={compact || undefined} aria-hidden="true">
      <span className={styles.keylines} />
      {(compact ? compactCorners : corners).map((position) => <Corner key={position} frame={frame} position={position} />)}
      {!compact && <><Crown frame={frame} /><Roots /></>}
    </span>
  );
}

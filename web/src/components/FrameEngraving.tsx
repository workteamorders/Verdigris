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
const shell = 'M1 1H78L70 7H40L34 12H29L24 20Q22 25 17 27L12 29V34L7 40V70L1 78Z';
const bevel = 'M3 4H68L65 6H39L33 10H28L22 19Q20 23 16 25L10 28V33L6 39V65L3 68Z';
const foliage = 'M9 62V43Q9 33 17 32Q23 31 26 23Q29 16 35 15Q41 15 42 10M10 52Q13 49 14 44Q14 39 11 37M13 36Q21 40 27 32Q29 29 28 24M29 23Q33 24 37 20Q39 18 39 15M43 10Q47 7 56 8M46 11Q52 13 58 8';

function Corner({ frame, position }: { frame: FrameName; position: (typeof corners)[number] }) {
  return (
    <svg className={`${styles.corner} ${styles[position]}`} viewBox="0 0 80 80" focusable="false">
      <path d={shell} className={styles.cast} />
      <path d={bevel} className={styles.bevel} />
      <path d={foliage} className={styles.shadowCut} transform="translate(0.8 1)" />
      <path d={foliage} className={styles.lightCut} />
      <path d="M10 10L22 8L25 14L20 20L14 25L8 22Z" className={styles.inset} />
      <path d={cuts[frame]} transform="translate(10.7 10.7) scale(.67)" className={styles.sign} />
      <circle cx="5.5" cy="5.5" r="1.1" className={styles.rivet} />
      <path d="M8 56V64M7 66V69M56 8H64M66 7H69M31 11L34 9M11 31L9 34" className={styles.lightCut} />
    </svg>
  );
}

export function FrameEngraving({ frame, compact = false }: { frame: FrameName; compact?: boolean }) {
  return (
    <span className={styles.engraving} data-compact={compact || undefined} aria-hidden="true">
      <span className={styles.keylines} />
      {(compact ? compactCorners : corners).map((position) => <Corner key={position} frame={frame} position={position} />)}
      {!compact && <svg className={styles.cartouche} viewBox="0 0 136 32" focusable="false">
        <path d="M2 10H34L46 4H56L68 1L80 4H90L102 10H134L123 15H101L92 23H82L68 31L54 23H44L35 15H13Z" className={styles.cast} />
        <path d="M11 11H35L47 6H56L68 3L80 6H89L101 11H125M22 13H36L46 21H54L68 28L82 21H90L100 13H114" className={styles.lightCut} />
        <path d="M39 11Q45 10 49 16Q53 21 59 18M97 11Q91 10 87 16Q83 21 77 18M39 15Q44 19 47 18M97 15Q92 19 89 18" className={styles.lightCut} />
        <path d="M68 4L80 15L68 27L56 15Z" className={styles.inset} />
        <path d={cuts[frame]} transform="translate(61.2 8.2) scale(.75)" className={styles.sign} />
        <circle cx="34" cy="12" r="1" className={styles.rivet} />
        <circle cx="102" cy="12" r="1" className={styles.rivet} />
      </svg>}
    </span>
  );
}
